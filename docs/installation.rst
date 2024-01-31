Installation
===============

Using pip
---------

1. Install the last available version::

    pip install django-baton

2. Add ``baton`` and ``baton.autodiscover`` to your ``INSTALLED_APPS``::

    INSTALLED_APPS = (
        # ...
        'baton',
        'django.contrib.admin',
        # ... (place baton.autodiscover at the very end)
        'baton.autodiscover',
    )

.. important:: ``baton`` must be placed before ``django.contrib.admin`` and ``baton.autodiscover`` as the last app.

3. Replace django.contrib.admin in your project urls, and add baton urls::

    from baton.autodiscover import admin
    from django.urls import path, include

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('baton/', include('baton.urls')),

    ]


Why two installed apps?
^^^^^^^^^^^^^^^^^^^^^^^

The first baton has to be placed before the ``django.contrib.admin`` app, because it overrides 3 templates and resets all css. The ``baton.autodiscover`` entry is needed as the last installed app in order to register all applications for the admin. I decided to create a custom ``AdminSite`` class, in order to allow the customization of some variables the django way (``site_header``, ``index_title``, ...). I think this is a good approach, better than customizing this vars overwriting the orignal templates. The problem is that when creating a custom ``AdminSite``, you should register manually all the apps. I didn't like this, so I wrote this autodiscover module, which automatically registers all the apps already registered with the django default ``AdminSite``. In order to do this, all the apps must be already registered, so it comes as the last installed app.
