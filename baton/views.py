# -*- coding: utf-8 -*-
import hashlib
import json
import hmac
import base64
import time
import requests
from django.http import JsonResponse
from django.contrib.admin import site
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.core.exceptions import ImproperlyConfigured
from django.views import View
from django.conf import settings

from .config import get_config

BATON_AI_API_BASE_PATH = 'https://baton.sqrt64.it/api/v1'
# BATON_AI_API_BASE_PATH = 'http://localhost:1323/api/v1'


class GetAppListJsonView(View):

    @method_decorator(staff_member_required)
    def dispatch(self, *args, **kwargs):
        """ Only staff members can access this view """
        return super(GetAppListJsonView, self).dispatch(*args, **kwargs)

    def get(self, request):
        """ Returns a json representing the menu voices
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

    def get_menu(self, request):
        return get_config('MENU')

    def add_voice(self, voices, item):
        """ Adds a voice to the list
        """
        voice = None
        if item.get('type') == 'title':
            voice = self.get_title_voice(item)
        elif item.get('type') == 'app':
            voice = self.get_app_voice(item)
        elif item.get('type') == 'model':
            voice = self.get_app_model_voice(item)
        elif item.get('type') == 'free':
            voice = self.get_free_voice(item)
        if voice:
            voices.append(voice)

    def get_title_voice(self, item):
        """ Title voice
            Returns the js menu compatible voice dict if the user
            can see it, None otherwise
        """
        view = True
        if item.get('perms', None):
            view = self.check_user_permission(item.get('perms', []))
        elif item.get('apps', None):
            view = self.check_apps_permission(item.get('apps', []))
        if view:
            children_items = item.get('children', [])
            children = []
            if len(children_items):
                for citem in children_items:
                    self.add_voice(children, citem)

            return {
                'type': 'title',
                'label': item.get('label', ''),
                'icon': item.get('icon', None),
                'defaultOpen': item.get('default_open', False),
                'children': children,
            }
        return None

    def get_free_voice(self, item):
        """ Free voice
            Returns the js menu compatible voice dict if the user
            can see it, None otherwise
        """
        view = True
        if item.get('perms', None):
            view = self.check_user_permission(item.get('perms', []))
        elif item.get('apps', None):
            view = self.check_apps_permission(item.get('apps', []))

        if view:
            children_items = item.get('children', [])
            children = []
            if len(children_items):
                for citem in children_items:
                    self.add_voice(children, citem)
            return {
                'type': 'free',
                'label': item.get('label', ''),
                'icon': item.get('icon', None),
                'url': item.get('url', None),
                're': item.get('re', None),
                'defaultOpen': item.get('default_open', False),
                'children': children,
            }
        return None

    def get_app_voice(self, item):
        """ App voice
            Returns the js menu compatible voice dict if the user
            can see it, None otherwise
        """
        if item.get('name', None) is None:
            raise ImproperlyConfigured('App menu voices must have a name key')
        if self.check_apps_permission([item.get('name', None)]):
            children = []
            if item.get('models', None) is None:
                for name, model in self.apps_dict[item.get('name')]['models'].items(): # noqa
                    children.append({
                        'type': 'model',
                        'label': model.get('name', ''),
                        'url': model.get('admin_url', '')
                    })
            else:
                for model_item in item.get('models', []):
                    voice = self.get_model_voice(item.get('name'), model_item)
                    if voice:
                        children.append(voice)

            return {
                'type': 'app',
                'label': item.get('label', ''),
                'icon': item.get('icon', None),
                'defaultOpen': item.get('default_open', False),
                'children': children
            }
        return None

    def get_app_model_voice(self, app_model_item):
        """ App Model voice
            Returns the js menu compatible voice dict if the user
            can see it, None otherwise
        """
        if app_model_item.get('name', None) is None:
            raise ImproperlyConfigured('Model menu voices must have a name key') # noqa

        if app_model_item.get('app', None) is None:
            raise ImproperlyConfigured('Model menu voices must have an app key') # noqa

        return self.get_model_voice(app_model_item.get('app'), app_model_item)

    def get_model_voice(self, app, model_item):
        """ Model voice
            Returns the js menu compatible voice dict if the user
            can see it, None otherwise
        """
        if model_item.get('name', None) is None:
            raise ImproperlyConfigured('Model menu voices must have a name key') # noqa

        if self.check_model_permission(app, model_item.get('name', None)):
            return {
                'type': 'model',
                'label': model_item.get('label', ''),
                'icon': model_item.get('icon', None),
                'url': self.apps_dict[app]['models'][model_item.get('name')]['admin_url'], # noqa
            }

        return None

    def create_app_list_dict(self):
        """ Creates a more efficient to check dictionary from
            the app_list list obtained from django admin
        """
        d = {}
        for app in self.app_list:
            models = {}
            for model in app.get('models', []):
                models[model.get('object_name').lower()] = model
            d[app.get('app_label').lower()] = {
                'app_url': app.get('app_url', ''),
                'app_label': app.get('app_label'),
                'models': models
            }
        return d

    def check_user_permission(self, perms):
        for perm in perms:
            if self.request.user.has_perm(perm):
                return True
        return False

    def check_apps_permission(self, apps):
        """ Checks if one of apps is listed in apps_dict
            Since apps_dict is derived from the app_list
            given by django admin, it lists only the apps
            the user can view
        """
        for app in apps:
            if app in self.apps_dict:
                return True

        return False

    def check_model_permission(self, app, model):
        """ Checks if model is listed in apps_dict
            Since apps_dict is derived from the app_list
            given by django admin, it lists only the apps
            and models the user can view
        """
        if self.apps_dict.get(app, False) and model in self.apps_dict[app]['models']:
            return True

        return False

    def get_default_voices(self):
        """ When no custom menu is defined in settings
            Retrieves a js menu ready dict from the django admin app list
        """
        voices = []
        for app in self.app_list:
            children = []
            for model in app.get('models', []):
                child = {
                    'type': 'model',
                    'label': model.get('name', ''),
                    'url': model.get('admin_url', '')
                }
                children.append(child)
            voice = {
                'type': 'app',
                'label': app.get('name', ''),
                'url': app.get('app_url', ''),
                'children': children
            }
            voices.append(voice)

        return voices


class GetGravatartUrlJsonView(View):
    def get(self, request):
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
    def dispatch(self, *args, **kwargs):
        """ Only staff members can access this view """
        return super(TranslateView, self).dispatch(*args, **kwargs)

    def post(self, request):
        body = json.loads(request.body)
        payload = { "items": [], "model": body.get("model") }
        for field in body.get("items"):
            payload["items"].append({
                "defaultLanguage": field.get("defaultLanguage"),
                "languages": field.get("languages"),
                "id": field.get("field"),
                "text": field.get("text"),
            })

        # The API endpoint to communicate with
        url_post = f"{BATON_AI_API_BASE_PATH}/translate/"

        # A POST request to tthe API
        ts = str(int(time.time()))
        h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()
        post_response = requests.post(url_post, json=payload, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
            'X-Timestamp': ts,
            'X-Signature': sig,
        })

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse({"data": post_response_json, "success": success}, status=post_response.status_code)


class SummarizeView(View):
    def post(self, request):
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
        ts = str(int(time.time()))
        h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()
        post_response = requests.post(url_post, json=payload, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
            'X-Timestamp': ts,
            'X-Signature': sig,
        })

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse({"data": post_response_json, "success": success}, status=post_response.status_code)

class VisionView(View):
    def post(self, request):
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
        # url_post = "http://192.168.1.245:1323/api/v1/summarize/"

        # A POST request to tthe API
        ts = str(int(time.time()))
        h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()
        post_response = requests.post(url_post, json=payload, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
            'X-Timestamp': ts,
            'X-Signature': sig,
        })

        # Print the response
        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse({"data": post_response_json, "success": success}, status=post_response.status_code)


class GenerateImageView(View):
    def post(self, request):
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
        ts = str(int(time.time()))
        h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()
        post_response = requests.post(url_post, json=payload, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
            'X-Timestamp': ts,
            'X-Signature': sig,
        })

        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse({"data": post_response_json, "success": success}, status=post_response.status_code)


class CorrectView(View):
    def post(self, request):
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
        ts = str(int(time.time()))
        h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()
        post_response = requests.post(url_post, json=payload, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
            'X-Timestamp': ts,
            'X-Signature': sig,
        })

        post_response_json = post_response.json()

        success = post_response.status_code == 200
        return JsonResponse({"data": post_response_json, "success": success}, status=post_response.status_code)
