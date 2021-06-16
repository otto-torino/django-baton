import json
from django.urls import reverse
from django import template
from django.utils.html import escapejs
from django.core.exceptions import ImproperlyConfigured

from ..config import get_config

register = template.Library()


@register.simple_tag
def baton_config():
    conf = {
        "api": {
            "app_list": reverse('baton-app-list-json'),
            "gravatar": reverse('baton-gravatar-json'),
        },
        "confirmUnsavedChanges": get_config('CONFIRM_UNSAVED_CHANGES'),
        "showMultipartUploading": get_config('SHOW_MULTIPART_UPLOADING'),
        "enableImagesPreview": get_config('ENABLE_IMAGES_PREVIEW'),
        "changelistFiltersInModal": get_config('CHANGELIST_FILTERS_IN_MODAL'),
        "changelistFiltersAlwaysOpen": get_config('CHANGELIST_FILTERS_ALWAYS_OPEN'),
        "changelistFiltersForm": get_config('CHANGELIST_FILTERS_FORM'),
        "collapsableUserArea": get_config('COLLAPSABLE_USER_AREA'),
        "menuAlwaysCollapsed": get_config('MENU_ALWAYS_COLLAPSED'),
        "menuTitle": escapejs(get_config('MENU_TITLE')),
        "messagesToasts": get_config('MESSAGES_TOASTS'),
        "gravatarDefaultImg": get_config('GRAVATAR_DEFAULT_IMG'),
        "loginSplash": get_config('LOGIN_SPLASH'),
        "searchField": get_config('SEARCH_FIELD'),
    }

    return conf


@register.simple_tag
def baton_config_value(key):
    return get_config(key)


@register.inclusion_tag('baton/analytics.html', takes_context=True)
def analytics(context, next=None):
    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
    except ModuleNotFoundError as e:
        raise ModuleNotFoundError('django-baton: missing Google Analytics optional dependencies') from e

    analytics_settings = get_config('ANALYTICS')

    if not analytics_settings['CREDENTIALS']:
        raise ImproperlyConfigured(
            'Analytics service account json path missing')  # noqa

    if not analytics_settings['VIEW_ID']:
        raise ImproperlyConfigured('Analytics view id missing')

    # The scope for the OAuth2 request.
    SCOPES = [
        'https://www.googleapis.com/auth/analytics.readonly',
    ]
    # The location of the key file with the key data.
    SERVICE_ACCOUNT_FILE = analytics_settings['CREDENTIALS']

    _credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES, )
    _credentials.refresh(Request())

    # Construct a credentials objects from the key data and OAuth2 scope.
    # _credentials = SignedJwtAssertionCredentials(
    #     _key_data['client_email'], _key_data['private_key'], SCOPE)

    return {
        'token': _credentials.token,
        'view_id': analytics_settings['VIEW_ID']
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
