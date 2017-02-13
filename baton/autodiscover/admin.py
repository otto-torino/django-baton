from django.contrib.admin import AdminSite, site

from ..config import get_config


class BatonAdminSite(AdminSite):
    site_header = get_config('SITE_HEADER')
    site_title = get_config('SITE_TITLE')
    index_title = get_config('INDEX_TITLE')
    index_template = 'baton/index.html' if get_config('ANALYTICS') else 'admin/index.html' # noqa

    def __init__(self, *args, **kwargs):
        """ Registers all apps with BatonAdminSite """
        super(BatonAdminSite, self).__init__(*args, **kwargs)
        self._registry.update(site._registry)
        for model in site._registry:
            self.unregister(model)
            self.register(model, type(site._registry[model]))

site = BatonAdminSite() # noqa
