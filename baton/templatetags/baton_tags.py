from __future__ import annotations

import json
import time
import hmac
import base64
import hashlib
from typing import Any

import requests
from decimal import Decimal
from django.urls import reverse
from django import template
from django.template import Context
from django.utils.html import escapejs
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from baton.models import BatonTheme

from ..config import get_config
from ..ai import AIModels

register = template.Library()

def get_ai_models(ai_config: dict[str, Any]) -> dict[str, Any]:
    models_hook = ai_config.get("MODELS")
    if models_hook: # function hook
        fn = import_string(models_hook)
        models = fn()
        translations_model = models.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        summarizations_model = models.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        corrections_model = models.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        images_model = models.get('IMAGES_MODEL', AIModels.BATON_GPT_IMAGE_1_5)
        vision_model = models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI)
        tag_suggestions_model = models.get('TAG_SUGGESTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
    else: # config
        translations_model = ai_config.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        summarizations_model = ai_config.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        corrections_model = ai_config.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        images_model = ai_config.get('IMAGES_MODEL', AIModels.BATON_GPT_IMAGE_1_5)
        vision_model = ai_config.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI)
        tag_suggestions_model = ai_config.get('TAG_SUGGESTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)

    return {
        'TRANSLATIONS_MODEL': translations_model,
        'SUMMARIZATIONS_MODEL': summarizations_model,
        'CORRECTIONS_MODEL': corrections_model,
        'IMAGES_MODEL': images_model,
        'VISION_MODEL': vision_model,
        'TAG_SUGGESTIONS_MODEL': tag_suggestions_model,
    }

@register.simple_tag
def baton_config() -> dict[str, Any]:
    # retrieve the default language
    default_language = None
    try:
        default_language = getattr(settings, "MODELTRANSLATION_DEFAULT_LANGUAGE")
    except AttributeError:
        default_language = settings.LANGUAGES[0][0]
    except:
        pass

    # retrieve other languages for translations
    other_languages = []
    try:
        other_languages = [l[0] for l in settings.LANGUAGES if l[0] != default_language]
    except:
        pass

    ai_config = get_config('AI') or {}
    ai_models = get_ai_models(ai_config)

    conf = {
        "api": {
            "app_list": reverse('baton-app-list-json'),
            "gravatar": reverse('baton-gravatar-json'),
        },
        "ai": {
            "translationsModel": ai_models.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
            "correctionsModel": ai_models.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
            "summarizationsModel": ai_models.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
            "imagesModel": ai_models.get('IMAGES_MODEL', AIModels.BATON_GPT_IMAGE_1_5),
            "visionModel": ai_models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI),
            "tagSuggestionsModel": ai_models.get('TAG_SUGGESTIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
            "enableTranslations": ai_config.get('ENABLE_TRANSLATIONS', False) if (get_config('BATON_CLIENT_ID') and get_config('BATON_CLIENT_SECRET')) else False,
            "enableCorrections": ai_config.get('ENABLE_CORRECTIONS', False) if (get_config('BATON_CLIENT_ID') and get_config('BATON_CLIENT_SECRET')) else False,
            "correctionSelectors": ai_config.get('CORRECTION_SELECTORS', ["textarea", "input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])"]),
            "translateApiUrl": reverse('baton-translate'),
            "summarizeApiUrl": reverse('baton-summarize'),
            "visionApiUrl": reverse('baton-vision'),
            "generateImageApiUrl": reverse('baton-generate-image'),
            "correctApiUrl": reverse('baton-correct'),
            "suggestTagsApiUrl": reverse('baton-suggest-tags'),
            "createTagsApiUrl": reverse('baton-create-tags'),
        },
        "confirmUnsavedChanges": get_config('CONFIRM_UNSAVED_CHANGES'),
        "showMultipartUploading": get_config('SHOW_MULTIPART_UPLOADING'),
        "enableImagesPreview": get_config('ENABLE_IMAGES_PREVIEW'),
        "changelistFiltersInModal": get_config('CHANGELIST_FILTERS_IN_MODAL'),
        "changelistFiltersAlwaysOpen": get_config('CHANGELIST_FILTERS_ALWAYS_OPEN'),
        "changelistFiltersForm": get_config('CHANGELIST_FILTERS_FORM'),
        "changeformFixedSubmitRow": get_config('CHANGEFORM_FIXED_SUBMIT_ROW'),
        "collapsableUserArea": get_config('COLLAPSABLE_USER_AREA'),
        "menuAlwaysCollapsed": get_config('MENU_ALWAYS_COLLAPSED'),
        "menuTitle": escapejs(get_config('MENU_TITLE')),
        "messagesToasts": get_config('MESSAGES_TOASTS'),
        "gravatarDefaultImg": get_config('GRAVATAR_DEFAULT_IMG'),
        "gravatarEnabled": get_config('GRAVATAR_ENABLED'),
        "loginSplash": get_config('LOGIN_SPLASH'),
        "searchField": get_config('SEARCH_FIELD'),
        "forceTheme": get_config('FORCE_THEME'),
        "defaultLanguage": default_language,
        "otherLanguages": other_languages,
    }

    if conf['ai']['translationsModel'] not in AIModels.text_models:
        raise ImproperlyConfigured('Unsupported AI translation model %s' % conf['ai']['translationsModel'])

    if conf['ai']['correctionsModel'] not in AIModels.text_models:
        raise ImproperlyConfigured('Unsupported AI correction model %s' % conf['ai']['correctionsModel'])

    if conf['ai']['summarizationsModel'] not in AIModels.text_models:
        raise ImproperlyConfigured('Unsupported AI summarization model %s' % conf['ai']['summarizationsModel'])

    if conf['ai']['tagSuggestionsModel'] not in AIModels.tag_suggestion_models:
        raise ImproperlyConfigured('Unsupported AI tag suggestions model %s' % conf['ai']['tagSuggestionsModel'])

    if conf['ai']['imagesModel'] not in AIModels.image_models:
        raise ImproperlyConfigured('Unsupported AI image model %s' % conf['ai']['imagesModel'])

    return conf


@register.simple_tag
def baton_config_value(key: str) -> Any:
    return get_config(key)


@register.simple_tag
def baton_ai_credentials_configured() -> bool:
    """Whether the Baton AI credentials are set.

    The opt-in AI features (summarize, vision, tag suggestions) are wired in the
    change form only when this is true, so their buttons do not show up when the
    AI cannot be reached, consistently with translations and corrections.
    """
    return bool(get_config('BATON_CLIENT_ID') and get_config('BATON_CLIENT_SECRET'))


@register.inclusion_tag('baton/theme.html', takes_context=True)
def baton_theme(context: Context) -> dict[str, Any]:
    try:
        theme = BatonTheme.objects.get(active=True)
    except:
        theme = None
    return {
        'theme': theme,
        # the CSP nonce of Django >= 6.0, when its context processor is enabled
        'csp_nonce': context.get('csp_nonce'),
    }

@register.inclusion_tag('baton/footer.html', takes_context=True)
def footer(context: Context) -> dict[str, Any]:
    user = context['user']
    return {
        'user': user,
        'support_href': get_config('SUPPORT_HREF'),
        'site_title': get_config('SITE_TITLE'),
        'copyright': get_config('COPYRIGHT'),
        'powered_by': get_config('POWERED_BY'),
        # forwarded so the language switcher form can render csrf + the next path
        'request': context.get('request'),
        'csrf_token': context.get('csrf_token'),
    }


@register.simple_tag(takes_context=True)
def call_model_admin_method(context: Context, **kwargs: Any) -> Any:
    try:
        model_admin = kwargs.pop('model_admin')
        method = kwargs.pop('method')
        return getattr(model_admin, method)(context['request'], **kwargs)
    except Exception as e:
        return None


@register.filter
def to_json(python_dict: Any) -> str:
    return json.dumps(python_dict)


@register.inclusion_tag('baton/ai_stats.html', takes_context=True)
def baton_ai_stats(context: Context) -> dict[str, Any]:
    user = context['user']

    error = False
    errorMessage: str | None = None
    status_code = 200
    budget: Decimal | int = 0
    translations = {}
    summarizations = {}
    corrections = {}
    vision = {}
    images = {}
    response_json = {}

    # Credentials may be unset (BATON absent, or client id/secret missing). In
    # that case degrade gracefully into the same error path the template already
    # renders, instead of crashing, consistently with get_baton_ai_headers.
    baton_settings = getattr(settings, "BATON", None) or {}
    client_id = baton_settings.get('BATON_CLIENT_ID')
    client_secret = baton_settings.get('BATON_CLIENT_SECRET')

    if not client_id or not client_secret:
        error = True
        errorMessage = "Missing BATON_CLIENT_ID or BATON_CLIENT_SECRET settings."
    else:
        # The API endpoint to communicate with
        url_post = "https://baton.sqrt64.it/api/v1/stats/"
        # url_post = "http://localhost:1323/api/v1/stats/"

        # A GET request to the API
        ts = str(int(time.time()))
        h = hmac.new(client_secret.encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
        sig = base64.b64encode(h.digest()).decode()

        try:
            response = requests.get(url_post, headers={
                'X-Client-Id': client_id,
                'X-Timestamp': ts,
                'X-Signature': sig,
            })

            status_code = response.status_code
            if status_code != 200:
                error = True
                try:
                    errorMessage = response.json().get('message', None)
                except Exception as e:
                    errorMessage = str(e)
            else:
                response_json = response.json()
                budget = round(Decimal(response_json.get('budget', 0.0)), 2)
                translations = response_json.get('translations', {})
                summarizations = response_json.get('summarizations', {})
                vision = response_json.get('vision', {})
                corrections = response_json.get('corrections', {})
                images = response_json.get('images', {})
        except Exception as e:
            errorMessage = str(e)
            error = True

    ai_config = get_config('AI') or {}
    ai_models = get_ai_models(ai_config)

    return {
        'user': user,
        'csp_nonce': context.get('csp_nonce'),
        'error': error,
        'error_message': errorMessage,
        'status_code': status_code,
        'budget': budget,
        'translations': translations,
        'summarizations': summarizations,
        'corrections': corrections,
        'vision': vision,
        'images': images,
        'translations_model': ai_models.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
        'corrections_model': ai_models.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
        'summarizations_model': ai_models.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI),
        'images_model': ai_models.get('IMAGES_MODEL', AIModels.BATON_GPT_IMAGE_1_5),
        'vision_model': ai_models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI),
    }
