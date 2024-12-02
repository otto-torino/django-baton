import json
import time
import hmac
import base64
import hashlib
import requests
from decimal import Decimal
from django.urls import reverse
from django import template
from django.utils.html import escapejs
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from baton.models import BatonTheme

from ..config import get_config
from ..ai import AIModels

register = template.Library()

def get_ai_models(ai_config):
    if ai_config.get("MODELS"): # function hook
        fn = import_string(ai_config.get("MODELS"))
        models = fn()
        translations_model = models.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        summarizations_model = models.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        corrections_model = models.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        images_model = models.get('IMAGES_MODEL', AIModels.BATON_DALL_E_3)
        vision_model = models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI)
    else: # config
        translations_model = ai_config.get('TRANSLATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        summarizations_model = ai_config.get('SUMMARIZATIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        corrections_model = ai_config.get('CORRECTIONS_MODEL', AIModels.BATON_GPT_4O_MINI)
        images_model = ai_config.get('IMAGES_MODEL', AIModels.BATON_DALL_E_3)
        vision_model = ai_config.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI)

    return {
        'TRANSLATIONS_MODEL': translations_model,
        'SUMMARIZATIONS_MODEL': summarizations_model,
        'CORRECTIONS_MODEL': corrections_model,
        'IMAGES_MODEL': images_model,
        'VISION_MODEL': vision_model
    }

@register.simple_tag
def baton_config():
    # retrieve the default language
    default_language = None
    try:
        default_language = settings.MODELTRANSLATION_DEFAULT_LANGUAGE
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
            "imagesModel": ai_models.get('IMAGES_MODEL', AIModels.BATON_DALL_E_3),
            "visionModel": ai_models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI),
            "enableTranslations": ai_config.get('ENABLE_TRANSLATIONS', False) if (get_config('BATON_CLIENT_ID') and get_config('BATON_CLIENT_SECRET')) else False,
            "enableCorrections": ai_config.get('ENABLE_CORRECTIONS', False) if (get_config('BATON_CLIENT_ID') and get_config('BATON_CLIENT_SECRET')) else False,
            "correctionSelectors": ai_config.get('CORRECTION_SELECTORS', ["textarea", "input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])"]),
            "translateApiUrl": reverse('baton-translate'),
            "summarizeApiUrl": reverse('baton-summarize'),
            "visionApiUrl": reverse('baton-vision'),
            "generateImageApiUrl": reverse('baton-generate-image'),
            "correctApiUrl": reverse('baton-correct'),
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

    if conf['ai']['imagesModel'] not in AIModels.image_models:
        raise ImproperlyConfigured('Unsupported AI image model %s' % conf['ai']['imagesModel'])

    return conf


@register.simple_tag
def baton_config_value(key):
    return get_config(key)


@register.inclusion_tag('baton/theme.html')
def baton_theme():
    try:
        theme = BatonTheme.objects.get(active=True)
    except:
        theme = None
    return {
        'theme': theme,
    }

@register.inclusion_tag('baton/footer.html', takes_context=True)
def footer(context):
    user = context['user']
    return {
        'user': user,
        'support_href': get_config('SUPPORT_HREF'),
        'site_title': get_config('SITE_TITLE'),
        'copyright': get_config('COPYRIGHT'),
        'powered_by': get_config('POWERED_BY'),
    }


@register.simple_tag(takes_context=True)
def call_model_admin_method(context, **kwargs):
    try:
        model_admin = kwargs.pop('model_admin')
        method = kwargs.pop('method')
        return getattr(model_admin, method)(context['request'], **kwargs)
    except Exception as e:
        return None


@register.filter
def to_json(python_dict):
    return json.dumps(python_dict)


@register.inclusion_tag('baton/ai_stats.html', takes_context=True)
def baton_ai_stats(context):
    user = context['user']

    # The API endpoint to communicate with
    url_post = "https://baton.sqrt64.it/api/v1/stats/"
    # url_post = "http://localhost:1323/api/v1/stats/"

    # A GET request to the API
    ts = str(int(time.time()))
    h = hmac.new(settings.BATON.get('BATON_CLIENT_SECRET').encode('utf-8'), ts.encode('utf-8'), hashlib.sha256)
    sig = base64.b64encode(h.digest()).decode()

    error = False
    errorMessage = None
    status_code = 200
    budget = 0
    translations = {}
    summarizations = {}
    corrections = {}
    vision = {}
    images = {}
    response_json = {}

    try:
        response = requests.get(url_post, headers={
            'X-Client-Id': settings.BATON.get('BATON_CLIENT_ID'),
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

    ai_config = get_config('AI')
    ai_models = get_ai_models(ai_config)

    return {
        'user': user,
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
        'images_model': ai_models.get('IMAGES_MODEL', AIModels.BATON_DALL_E_3),
        'vision_model': ai_models.get('VISION_MODEL', AIModels.BATON_GPT_4O_MINI),
    }
