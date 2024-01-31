from django.urls import reverse
from django import template
from django.utils.html import escapejs

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
    }

    return conf


@register.simple_tag
def baton_config_value(key):
    return get_config(key)

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
