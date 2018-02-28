Installation
===============

Using pip
---------

1. Until version 0.1.0 will be released, you can pip install the repo master branch::

    pip install git+https://github.com/otto-torino/django-baton

2. Add ``baton`` and ``baton.autodiscover`` to your ``INSTALLED_APPS``::

    INSTALLED_APPS = (
        # ...
        'baton',
        'django.contrib.admin',
        # ...
        'baton.autodiscover',
    )

.. important:: ``baton`` must be placed before ``django.contrib.admin`` and ``baton.autodiscover`` as the last app.

3. Replace django.contrib.admin in your project urls, and add baton urls::

    # from django.contrib import admin
    from baton.autodiscover import admin

    urlpatterns = [
        url(r'^admin/', include(admin.site.urls)),
        # ...
        url(r'^baton/', include('baton.urls')),
    ]


Django 2
--------

Steps 1 and 2 remain the same.

Step 3:

    from baton.autodiscover import admin
    from django.urls import path, include

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('baton/', include('baton.urls')),

    ]

.. important:: If you get a "__No crypto library available__" when using the google analytics index, then install this package:

    $ pip install PyOpenSSL


Why two installed apps?
^^^^^^^^^^^^^^^^^^^^^^^

The first baton has to be placed before the ``django.contrib.admin`` app, because it overrides 3 templates and resets all css. The ``baton.autodiscover`` entry is needed as the last installed app in order to register all applications for the admin. I decided to create a custom ``AdminSite`` class, in order to allow the customization of some variables the django way (``site_header``, ``index_title``, ...). I think this is a good approach, better than customizing this vars overwriting the orignal templates. The problem is that when creating a custom ``AdminSite``, you should register manually all the apps. I didn't like this, so I wrote this autodiscover module, which automatically registers all the apps already registered with the django default ``AdminSite``. In order to do this, all the apps must be already registered, so it comes as the last installed app.
