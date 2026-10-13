# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib
import json
import hmac
import base64
import time
from typing import Any

import requests
from django.db.models import Model, QuerySet
from django.http import HttpRequest, JsonResponse
from django.http.response import HttpResponseBase
from django.apps import apps
from django.contrib.admin import ModelAdmin, site
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.core.exceptions import FieldDoesNotExist, ImproperlyConfigured
from django.db import IntegrityError
from django.views import View
from django.conf import settings
from django.utils.encoding import force_str
from django.utils.text import slugify

from .config import get_config

BATON_AI_API_BASE_PATH = (getattr(settings, "BATON", None) or {}).get(
    "BATON_AI_API_BASE_PATH", "https://baton.sqrt64.it/api/v1"
)
# BATON_AI_API_BASE_PATH = 'http://localhost:1323/api/v1'


def get_baton_ai_headers() -> tuple[dict[str, str] | None, JsonResponse | None]:
    baton_settings = getattr(settings, "BATON", None) or {}
    client_id = baton_settings.get("BATON_CLIENT_ID")
    client_secret = baton_settings.get("BATON_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None, JsonResponse(
            {
                "data": {
                    "message": "Missing BATON_CLIENT_ID or BATON_CLIENT_SECRET settings."
                },
                "success": False,
            },
            status=503,
        )

    ts = str(int(time.time()))
    h = hmac.new(
        client_secret.encode("utf-8"),
        ts.encode("utf-8"),
        hashlib.sha256,
    )
    sig = base64.b64encode(h.digest()).decode()
    return {
        "X-Client-Id": client_id,
        "X-Timestamp": ts,
        "X-Signature": sig,
    }, None


class GetAppListJsonView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(GetAppListJsonView, self).dispatch(*args, **kwargs)

    def get(self, request: HttpRequest) -> JsonResponse:
        """Returns a json representing the menu voices
        in a format eaten by the js menu.
        Raised ImproperlyConfigured exceptions can be viewed
        in the browser console
        """
        self.app_list = site.get_app_list(request)
        self.apps_dict = self.create_app_list_dict()
        # no menu provided
        items = self.get_menu(request)
        if not items:
            voices = self.get_default_voices()
        else:
            voices = []
            for item in items:
                self.add_voice(voices, item)

        return JsonResponse(voices, safe=False)

    def get_menu(self, request: HttpRequest) -> Any:
        return get_config("MENU")

    def add_voice(self, voices: list[dict[str, Any]], item: dict[str, Any]) -> None:
        """Adds a voice to the list"""
        voice = None
        if item.get("type") == "title":
            voice = self.get_title_voice(item)
        elif item.get("type") == "app":
            voice = self.get_app_voice(item)
        elif item.get("type") == "model":
            voice = self.get_app_model_voice(item)
        elif item.get("type") == "free":
            voice = self.get_free_voice(item)
        if voice:
            voices.append(voice)

    def get_title_voice(self, item: dict[str, Any]) -> dict[str, Any] | None:
        """Title voice
        Returns the js menu compatible voice dict if the user
        can see it, None otherwise
        """
        view = True
        if item.get("perms", None):
            view = self.check_user_permission(item.get("perms", []))
        elif item.get("apps", None):
            view = self.check_apps_permission(item.get("apps", []))
        if view:
            children_items = item.get("children", [])
            children: list[dict[str, Any]] = []
            if len(children_items):
                for citem in children_items:
                    self.add_voice(children, citem)

            return {
                "type": "title",
                "label": item.get("label", ""),
                "icon": item.get("icon", None),
                "defaultOpen": item.get("default_open", False),
                "children": children,
            }
        return None

    def get_free_voice(self, item: dict[str, Any]) -> dict[str, Any] | None:
        """Free voice
        Returns the js menu compatible voice dict if the user
        can see it, None otherwise
        """
        view = True
        if item.get("perms", None):
            view = self.check_user_permission(item.get("perms", []))
        elif item.get("apps", None):
            view = self.check_apps_permission(item.get("apps", []))

        if view:
            children_items = item.get("children", [])
            children: list[dict[str, Any]] = []
            if len(children_items):
                for citem in children_items:
                    self.add_voice(children, citem)
            return {
                "type": "free",
                "label": item.get("label", ""),
                "icon": item.get("icon", None),
                "url": item.get("url", None),
                "re": item.get("re", None),
                "defaultOpen": item.get("default_open", False),
                "children": children,
            }
        return None

    def get_app_voice(self, item: dict[str, Any]) -> dict[str, Any] | None:
        """App voice
        Returns the js menu compatible voice dict if the user
        can see it, None otherwise
        """
        app_name = item.get("name")
        if app_name is None:
            raise ImproperlyConfigured("App menu voices must have a name key")
        if self.check_apps_permission([app_name]):
            children: list[dict[str, Any]] = []
            if item.get("models", None) is None:
                for name, model in self.apps_dict[app_name]["models"].items():  # noqa
                    children.append(
                        {
                            "type": "model",
                            "label": model.get("name", ""),
                            "url": model.get("admin_url", ""),
                        }
                    )
            else:
                for model_item in item.get("models", []):
                    voice = self.get_model_voice(app_name, model_item)
                    if voice:
                        children.append(voice)

            return {
                "type": "app",
                "label": item.get("label", ""),
                "icon": item.get("icon", None),
                "defaultOpen": item.get("default_open", False),
                "children": children,
            }
        return None

    def get_app_model_voice(self, app_model_item: dict[str, Any]) -> dict[str, Any] | None:
        """App Model voice
        Returns the js menu compatible voice dict if the user
        can see it, None otherwise
        """
        if app_model_item.get("name", None) is None:
            raise ImproperlyConfigured("Model menu voices must have a name key")  # noqa

        app = app_model_item.get("app")
        if app is None:
            raise ImproperlyConfigured("Model menu voices must have an app key")  # noqa

        return self.get_model_voice(app, app_model_item)

    def get_model_voice(self, app: str, model_item: dict[str, Any]) -> dict[str, Any] | None:
        """Model voice
        Returns the js menu compatible voice dict if the user
        can see it, None otherwise
        """
        name = model_item.get("name")
        if name is None:
            raise ImproperlyConfigured("Model menu voices must have a name key")  # noqa

        if self.check_model_permission(app, name):
            return {
                "type": "model",
                "label": model_item.get("label", ""),
                "icon": model_item.get("icon", None),
                "url": self.apps_dict[app]["models"][name][
                    "admin_url"
                ],  # noqa
            }

        return None

    def create_app_list_dict(self) -> dict[str, Any]:
        """Creates a more efficient to check dictionary from
        the app_list list obtained from django admin
        """
        d = {}
        for app in self.app_list:
            models = {}
            for model in app.get("models", []):
                models[model.get("object_name").lower()] = model
            d[app.get("app_label").lower()] = {
                "app_url": app.get("app_url", ""),
                "app_label": app.get("app_label"),
                "models": models,
            }
        return d

    def check_user_permission(self, perms: list[str]) -> bool:
        for perm in perms:
            if self.request.user.has_perm(perm):
                return True
        return False

    def check_apps_permission(self, apps: list[str]) -> bool:
        """Checks if one of apps is listed in apps_dict
        Since apps_dict is derived from the app_list
        given by django admin, it lists only the apps
        the user can view
        """
        for app in apps:
            if app in self.apps_dict:
                return True

        return False

    def check_model_permission(self, app: str, model: str) -> bool:
        """Checks if model is listed in apps_dict
        Since apps_dict is derived from the app_list
        given by django admin, it lists only the apps
        and models the user can view
        """
        if self.apps_dict.get(app, False) and model in self.apps_dict[app]["models"]:
            return True

        return False

    def get_default_voices(self) -> list[dict[str, Any]]:
        """When no custom menu is defined in settings
        Retrieves a js menu ready dict from the django admin app list
        """
        voices = []
        for app in self.app_list:
            children = []
            for model in app.get("models", []):
                child = {
                    "type": "model",
                    "label": model.get("name", ""),
                    "url": model.get("admin_url", ""),
                }
                children.append(child)
            voice = {
                "type": "app",
                "label": app.get("name", ""),
                "url": app.get("app_url", ""),
                "children": children,
            }
            voices.append(voice)

        return voices


class GetGravatartUrlJsonView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        if not request.user.is_authenticated:
            return JsonResponse({})
        try:
            email = request.user.email.lower().strip()
            hash = hashlib.md5(email.encode())
            return JsonResponse({"hash": hash.hexdigest()})
        except Exception:
            return JsonResponse({})


class TranslateView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(TranslateView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        body = json.loads(request.body)
        payload = {"items": [], "model": body.get("model")}
        for field in body.get("items"):
            payload["items"].append(
                {
                    "defaultLanguage": field.get("defaultLanguage"),
                    "languages": field.get("languages"),
                    "id": field.get("field"),
                    "text": field.get("text"),
                }
            )

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/translate/"

        # A POST request to tthe API
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )


class SummarizeView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(SummarizeView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        data = json.loads(request.body)
        payload = {
            "id": data.get("id"),
            "text": data.get("text"),
            "words": data.get("words"),
            "model": data.get("model"),
            "useBulletedList": data.get("useBulletedList"),
            "language": data.get("language"),
        }

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/summarize/"
        # url_post = "http://192.168.1.245:1323/api/v1/summarize/"

        # A POST request to tthe API
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )


class VisionView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(VisionView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        data = json.loads(request.body)
        payload = {
            "id": data.get("id"),
            "url": data.get("url"),
            "chars": data.get("chars"),
            "model": data.get("model"),
            "language": data.get("language"),
        }

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/vision/"

        # A POST request to the API
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )


class GenerateImageView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(GenerateImageView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        if not (get_config("AI") or {}).get("ENABLE_IMAGE_GENERATION", True):
            return JsonResponse(
                {
                    "data": {"message": "AI image generation is disabled."},
                    "success": False,
                },
                status=403,
            )
        data = json.loads(request.body)
        payload = {
            "id": data.get("id"),
            "prompt": data.get("prompt"),
            "format": int(data.get("format")),
            "model": data.get("model"),
        }

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/image/"
        # url_post = "http://192.168.1.160:1323/api/v1/image/"

        # A POST request to tthe API
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )


class CorrectView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(CorrectView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        data = json.loads(request.body)
        payload = {
            "id": data.get("id"),
            "text": data.get("text"),
            "language": data.get("language"),
            "model": data.get("model"),
        }

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/correct/"
        # url_post = "http://192.168.1.245:1323/api/v1/correct/"

        # A POST request to tthe API
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )


class SuggestTagsView(View):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(SuggestTagsView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        data = json.loads(request.body)
        app_label = data.get("appLabel")
        model_name = data.get("modelName")
        field_name = data.get("field")

        model_admin, error_response = self.get_model_admin(
            request,
            app_label,
            model_name,
            field_name,
        )
        if error_response:
            return error_response
        assert model_admin is not None

        field_config = getattr(model_admin, "baton_tag_suggestion_fields").get(
            field_name,
            {},
        )
        # Tag suggestions and new tags always use the project default language:
        # the language is not configurable per field, so new tags are created in
        # the default (fallback) language and translated later via the AI
        # translation tool, instead of leaking foreign text into other languages.
        language = self.get_default_language()
        label_field = field_config.get("label_field")
        try:
            existing_tags = self.get_existing_tags(
                model_admin.model,
                field_name,
                label_field,
                language,
                int(field_config.get("existing_limit", 300)),
            )
        except ImproperlyConfigured as err:
            return JsonResponse(
                {"data": {"message": force_str(err)}, "success": False},
                status=400,
            )
        existing_by_id = {force_str(tag["id"]): tag for tag in existing_tags}
        existing_by_label = {
            self.normalize_label(label): tag
            for tag in existing_tags
            for label in tag.get("labels", [])
            if label
        }

        source_fields = field_config.get("source_fields", [])
        content = {
            key: value
            for key, value in (data.get("content") or {}).items()
            if not source_fields or key in source_fields
        }
        selected = [force_str(value) for value in data.get("selected", [])]
        max_suggestions = int(field_config.get("max_suggestions", 8))
        allow_new = field_config.get("allow_new", True)
        preselect_min_confidence = field_config.get("preselect_min_confidence", 0.8)
        payload = {
            "id": data.get("id"),
            "field": field_name,
            "content": content,
            "existingTags": [
                {"id": tag["id"], "label": tag["label"]}
                for tag in existing_tags
            ],
            "selectedTags": selected,
            "maxSuggestions": max_suggestions,
            "allowNew": allow_new,
            "language": language,
            "model": data.get("model"),
        }

        url_post = f"{BATON_AI_API_BASE_PATH}/tag-suggestions/"
        headers, error_response = get_baton_ai_headers()
        if error_response:
            return error_response
        post_response = requests.post(
            url_post,
            json=payload,
            headers=headers,
        )

        post_response_json = post_response.json()
        success = post_response.status_code == 200
        if success:
            post_response_json = self.normalize_ai_response(
                post_response_json,
                existing_by_id,
                existing_by_label,
                selected,
                allow_new,
                max_suggestions,
                preselect_min_confidence,
            )

        return JsonResponse(
            {"data": post_response_json, "success": success},
            status=post_response.status_code,
        )

    def get_model_admin(
        self, request: HttpRequest, app_label: str, model_name: str, field_name: str
    ) -> tuple[ModelAdmin[Any] | None, JsonResponse | None]:
        try:
            model = apps.get_model(app_label, model_name)
        except (LookupError, ValueError):
            model = None
        if not model or model not in site._registry:
            return None, JsonResponse(
                {"data": {"message": "Unknown admin model."}, "success": False},
                status=400,
            )

        model_admin = site._registry[model]
        config = getattr(model_admin, "baton_tag_suggestion_fields", {}) or {}
        if field_name not in config:
            return None, JsonResponse(
                {
                    "data": {
                        "message": (
                            "Tag suggestions are not configured for this field."
                        ),
                    },
                    "success": False,
                },
                status=400,
            )

        has_permission = (
            model_admin.has_view_permission(request)
            or model_admin.has_change_permission(request)
            or model_admin.has_add_permission(request)
        )
        if not has_permission:
            return None, JsonResponse(
                {"data": {"message": "Permission denied."}, "success": False},
                status=403,
            )

        return model_admin, None

    def get_existing_tags(
        self,
        model: type[Model],
        field_name: str,
        label_field: str | None,
        language: str,
        limit: int,
    ) -> list[dict[str, Any]]:
        try:
            field = model._meta.get_field(field_name)
        except FieldDoesNotExist:
            raise ImproperlyConfigured(
                "Unknown tag suggestion field %s." % field_name
            )
        if not field.many_to_many:
            raise ImproperlyConfigured(
                "baton_tag_suggestion_fields supports ManyToManyField fields."
            )

        assert field.remote_field is not None
        related_model = field.remote_field.model
        label_field = label_field or self.get_default_label_field(related_model)
        tags = []
        for item in related_model._default_manager.all()[:limit]:
            labels = self.get_label_values(item, label_field, language)
            tags.append(
                {
                    "id": force_str(item.pk),
                    "label": labels[0] if labels else force_str(item),
                    "labels": labels,
                }
            )
        return tags

    def get_default_label_field(self, model: type[Model]) -> str | None:
        field_names = [field.name for field in model._meta.fields]
        for candidate in ("name", "title", "label", "slug"):
            if candidate in field_names:
                return candidate
        return None

    def get_label_values(self, item: Model, label_field: str | None, language: str) -> list[str]:
        if not label_field:
            return [force_str(item)]

        labels = []
        language_code = (language or "").split("-")[0]
        localized_field = "%s_%s" % (label_field, language_code)
        if language_code and hasattr(item, localized_field):
            value = getattr(item, localized_field)
            if value:
                labels.append(force_str(value))

        if hasattr(item, label_field):
            value = getattr(item, label_field)
            if value:
                labels.append(force_str(value))

        for field in item._meta.fields:
            if field.name.startswith("%s_" % label_field):
                value = getattr(item, field.name)
                if value:
                    labels.append(force_str(value))

        labels.append(force_str(item))
        return list(dict.fromkeys(labels))

    def get_default_language(self) -> str:
        try:
            return getattr(settings, "MODELTRANSLATION_DEFAULT_LANGUAGE")
        except AttributeError:
            return settings.LANGUAGES[0][0]

    def normalize_ai_response(
        self,
        data: dict[str, Any],
        existing_by_id: dict[str, Any],
        existing_by_label: dict[str, Any],
        selected: list[str],
        allow_new: bool,
        max_suggestions: int,
        preselect_min_confidence: float = 0.8,
    ) -> dict[str, Any]:
        suggestions = data.get("data", data)
        existing_items = suggestions.get("existing", suggestions.get("existingTags", []))
        new_items = suggestions.get("new", suggestions.get("newTags", []))
        selected_set = set(selected)

        existing = []
        seen_existing = set()
        for item in existing_items:
            tag = self.get_existing_tag(item, existing_by_id, existing_by_label)
            if not tag or tag["id"] in selected_set or tag["id"] in seen_existing:
                continue
            confidence = self.get_confidence(item)
            existing.append(
                {
                    "id": tag["id"],
                    "label": tag["label"],
                    "confidence": confidence,
                    # Existing tags below the threshold are still shown but not
                    # preselected: the AI tends to force a weakly related tag
                    # (e.g. "Technology" on a tennis article), so the user opts
                    # in instead of having to deselect it.
                    "preselected": self.is_preselected(
                        confidence, preselect_min_confidence
                    ),
                }
            )
            seen_existing.add(tag["id"])
            if len(existing) >= max_suggestions:
                break

        new = []
        seen_new = set()
        if allow_new:
            for item in new_items:
                label = self.get_label(item)
                normalized = self.normalize_label(label)
                if (
                    not label
                    or normalized in seen_new
                    or normalized in existing_by_label
                ):
                    continue
                confidence = self.get_confidence(item)
                new.append(
                    {
                        "label": label,
                        "confidence": confidence,
                        # New candidates below the threshold are shown but not
                        # preselected, mirroring existing tags: the user opts in
                        # instead of having to deselect a weakly related tag.
                        "preselected": self.is_preselected(
                            confidence, preselect_min_confidence
                        ),
                    }
                )
                seen_new.add(normalized)
                if len(existing) + len(new) >= max_suggestions:
                    break

        return {
            "existing": existing,
            "new": new,
        }

    def get_existing_tag(
        self, item: Any, existing_by_id: dict[str, Any], existing_by_label: dict[str, Any]
    ) -> dict[str, Any] | None:
        if isinstance(item, dict):
            item_id = item.get("id") or item.get("pk") or item.get("value")
            label = item.get("label") or item.get("name")
        else:
            item_id = item
            label = item

        if item_id is not None and force_str(item_id) in existing_by_id:
            return existing_by_id[force_str(item_id)]

        normalized = self.normalize_label(label)
        if normalized in existing_by_label:
            return existing_by_label[normalized]

        return None

    def get_label(self, item: Any) -> str:
        if isinstance(item, dict):
            return item.get("label") or item.get("name") or ""
        return force_str(item)

    def get_confidence(self, item: Any) -> Any:
        if isinstance(item, dict):
            return item.get("confidence") or item.get("score")
        return None

    def is_preselected(self, confidence: Any, threshold: Any) -> bool:
        # When the AI returns no confidence, keep the previous behaviour and
        # preselect the tag.
        if confidence is None:
            return True
        try:
            return float(confidence) >= float(threshold)
        except (TypeError, ValueError):
            return True

    def normalize_label(self, label: Any) -> str:
        return slugify(force_str(label or "")).lower()


class CreateTagsView(SuggestTagsView):
    @method_decorator(staff_member_required)
    def dispatch(self, *args: Any, **kwargs: Any) -> HttpResponseBase:
        """Only staff members can access this view"""
        return super(CreateTagsView, self).dispatch(*args, **kwargs)

    def post(self, request: HttpRequest) -> JsonResponse:
        data = json.loads(request.body)
        app_label = data.get("appLabel")
        model_name = data.get("modelName")
        field_name = data.get("field")

        model_admin, error_response = self.get_model_admin(
            request,
            app_label,
            model_name,
            field_name,
        )
        if error_response:
            return error_response
        assert model_admin is not None

        field_config = getattr(model_admin, "baton_tag_suggestion_fields").get(
            field_name,
            {},
        )
        if not field_config.get("allow_new", True):
            return JsonResponse(
                {
                    "data": {
                        "message": "Creating new tags is disabled for this field.",
                    },
                    "success": False,
                },
                status=400,
            )

        try:
            field = model_admin.model._meta.get_field(field_name)
        except FieldDoesNotExist:
            return JsonResponse(
                {"data": {"message": "Unknown tag field."}, "success": False},
                status=400,
            )
        if not field.many_to_many:
            return JsonResponse(
                {
                    "data": {
                        "message": (
                            "baton_tag_suggestion_fields supports "
                            "ManyToManyField fields."
                        ),
                    },
                    "success": False,
                },
                status=400,
            )

        related_model = field.remote_field.model
        if not self.has_related_add_permission(request, related_model):
            return JsonResponse(
                {"data": {"message": "Permission denied."}, "success": False},
                status=403,
            )

        language = self.get_default_language()
        label_field = field_config.get("label_field") or self.get_default_label_field(
            related_model,
        )
        if not label_field:
            return JsonResponse(
                {
                    "data": {
                        "message": "Cannot infer a label field for new tags.",
                    },
                    "success": False,
                },
                status=400,
            )

        labels = [
            force_str(label).strip()
            for label in data.get("labels", [])
            if force_str(label).strip()
        ]
        labels = list(dict.fromkeys(labels))
        if not labels:
            return JsonResponse({"data": {"tags": []}, "success": True})

        existing_tags = self.get_existing_tags(
            model_admin.model,
            field_name,
            label_field,
            language,
            int(field_config.get("existing_limit", 300)),
        )
        existing_by_label = {
            self.normalize_label(label): tag
            for tag in existing_tags
            for label in tag.get("labels", [])
            if label
        }

        tags = []
        seen_labels = set(existing_by_label.keys())
        for label in labels:
            normalized = self.normalize_label(label)
            if normalized in existing_by_label:
                tag = existing_by_label[normalized]
                tags.append({"id": tag["id"], "label": tag["label"]})
                continue
            if normalized in seen_labels:
                continue

            item = related_model()
            self.set_tag_label(item, label_field, label)
            try:
                item.save()
            except IntegrityError:
                return JsonResponse(
                    {
                        "data": {
                            "message": (
                                "Cannot create tag '%s' because it already "
                                "exists or violates a database constraint."
                            )
                            % label,
                        },
                        "success": False,
                    },
                    status=400,
                )
            tag = {"id": force_str(item.pk), "label": label}
            tags.append(tag)
            seen_labels.add(normalized)
            existing_by_label[normalized] = tag

        return JsonResponse(
            {"data": {"tags": tags}, "success": True},
        )

    def has_related_add_permission(self, request: HttpRequest, related_model: type[Model]) -> bool:
        related_admin = site._registry.get(related_model)
        if related_admin:
            return related_admin.has_add_permission(request)

        opts = related_model._meta
        return request.user.has_perm("%s.add_%s" % (opts.app_label, opts.model_name))

    def set_tag_label(self, item: Model, label_field: str, label: str) -> None:
        field_names = [field.name for field in item._meta.fields]
        # Base column (kept in sync with the default language by modeltranslation)
        if label_field in field_names:
            item.__dict__[label_field] = label
        # Populate the base field and every localized variant with the default
        # language label, so the tag is usable in all languages out of the box;
        # the other languages can be edited manually afterwards.
        for name in field_names:
            if name == label_field or name.startswith("%s_" % label_field):
                setattr(item, name, label)
