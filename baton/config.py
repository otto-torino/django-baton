# -*- coding: utf-8 -*-
from django.conf import settings
from django.utils.html import mark_safe

default_config = {
    'SITE_HEADER': 'Baton',
    'SITE_TITLE': 'Baton',
    'INDEX_TITLE': 'Site administration',
    'SUPPORT_HREF': 'https://github.com/otto-torino/django-baton/issues',
    'COPYRIGHT': 'copyright © 2017 <a href="https://www.otto.to.it">Otto srl</a>', # noqa
    'POWERED_BY': '<a href="https://www.otto.to.it">Otto srl</a>',
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
