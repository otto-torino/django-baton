# -*- coding: utf-8 -*-
from django.conf import settings
from django.utils.html import mark_safe
from django.utils.translation import gettext as _

default_config = {
    "SITE_TITLE": "Baton",
    "SITE_HEADER": '<img class="baton-logo-light" src="%sbaton/img/logo.png" /><img class="baton-logo-dark" src="%sbaton/img/logo_dark.png" />'
    % (settings.STATIC_URL, settings.STATIC_URL),
    "INDEX_TITLE": _("Site administration"),
    "MENU_TITLE": _("Menu"),
    "SUPPORT_HREF": "https://github.com/otto-torino/django-baton/issues",
    "COPYRIGHT": 'copyright © 2022 <a href="https://www.otto.to.it">Otto srl</a>',  # noqa
    "POWERED_BY": '<a href="https://www.otto.to.it">Otto srl</a>',
    "IMAGE_PREVIEW_WIDTH": 200,
    "CONFIRM_UNSAVED_CHANGES": True,
    "SHOW_MULTIPART_UPLOADING": True,
    "ENABLE_IMAGES_PREVIEW": True,
    "COLLAPSABLE_USER_AREA": False,
    "CHANGELIST_FILTERS_IN_MODAL": True,
    "CHANGELIST_FILTERS_ALWAYS_OPEN": False,
    "CHANGELIST_FILTERS_FORM": False,
    "CHANGEFORM_FIXED_SUBMIT_ROW": True,
    "MENU_ALWAYS_COLLAPSED": False,
    "MESSAGES_TOASTS": False,
    "GRAVATAR_DEFAULT_IMG": "retro",
    "GRAVATAR_ENABLED": True,
    "LOGIN_SPLASH": None,
    "SEARCH_FIELD": None,
    "FORCE_THEME": None,
    "BATON_CLIENT_ID": None,
    "BATON_CLIENT_SECRET": None,
    "AI": None,
}


def get_config(key):
    safe = [
        "SITE_HEADER",
        "COPYRIGHT",
        "POWERED_BY",
    ]
    user_settings = getattr(settings, "BATON", None)

    if user_settings is None:
        value = default_config.get(key, None)
    else:
        value = user_settings.get(key, default_config.get(key, None))

    if key in safe:
        return mark_safe(value)

    return value
