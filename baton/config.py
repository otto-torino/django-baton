# -*- coding: utf-8 -*-
from django.conf import settings
from django.utils.html import mark_safe
from django.utils.translation import ugettext as _

default_config = {
    'SITE_TITLE': 'Baton',
    'SITE_HEADER': '<img src="%sbaton/img/logo.png" />' % settings.STATIC_URL,
    'INDEX_TITLE': _('Site administration'),
    'SUPPORT_HREF': 'https://github.com/otto-torino/django-baton/issues',
    'COPYRIGHT': 'copyright © 2017 <a href="https://www.otto.to.it">Otto srl</a>', # noqa
    'POWERED_BY': '<a href="https://www.otto.to.it">Otto srl</a>',
    'CONFIRM_UNSAVED_CHANGES': True,
    'SHOW_MULTIPART_UPLOADING': True,
    'ENABLE_IMAGES_PREVIEW': True,
    'CHANGELIST_FILTERS_IN_MODAL': False,
    'MENU_ALWAYS_COLLAPSED': False,
}


def get_config(key):
    safe = ['SITE_HEADER', 'COPYRIGHT', 'POWERED_BY', ]
    user_settings = getattr(settings, 'BATON', None)

    if user_settings is None:
        value = default_config.get(key, None)
    else:
        value = user_settings.get(key, default_config.get(key, None))

    if key in safe:
        return mark_safe(value)

    return value
