from django.contrib import admin

from ..config import get_config


class BatonAdminSite(admin.AdminSite):
    site_header = get_config('SITE_HEADER')
    site_title = get_config('SITE_TITLE')
    index_title = get_config('INDEX_TITLE')
    index_template = 'baton/index.html' if get_config(
        'ANALYTICS') else 'admin/index.html'
    enable_nav_sidebar = False

    def __init__(self, *args, **kwargs):
        """ Registers all apps with BatonAdminSite """
        super(BatonAdminSite, self).__init__(*args, **kwargs)
        # copy registered actions
        self._actions = admin.site._actions
        self._registry.update(admin.site._registry)
        for model in admin.site._registry:
            self.unregister([model])
            self.register([model], type(admin.site._registry[model]))


site = BatonAdminSite()

# override otherwise in admindocs the default admin site is used showing
# the navbar
admin.site = site
