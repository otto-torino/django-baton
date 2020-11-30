Customization
=============

It's easy to heavily customize the appeareance of baton. All the stuff is compiled from a modern js app which resides in `baton/static/baton/app`.

The Baton js app
----------------

The js app which **baton** provides is a modern js app, written using es2015 and stage-0 code features, which are then transpiled to a code browsers can understand using `babel <https://babeljs.io/>`_ and `webpack <https://webpack.github.io/>`_.

All css are written using sass on top of bootstrap 4.5.0, and transpiled with babel so that the final output is a single js file ready to be included in the html template.

The app entry point is `index.js <https://github.com/otto-torino/django-baton/blob/master/baton/static/baton/app/src/index.js>`_, where the only variable attached to the window object ``Baton`` is defined.

All the js modules used are inside the `core <https://github.com/otto-torino/django-baton/tree/master/baton/static/baton/app/src/core>`_ directory.

Change the baton appearance
---------------------------

It's quite easy to change completely the appearance of baton, just overwrite the `sass variables <https://github.com/otto-torino/django-baton/blob/master/baton/static/baton/app/src/styles/_variables.scss>`_ as you like and recompile the app. Then make sure to serve your recompiled app in place of the baton one.

Here comes what you have to do:

- place one of your django apps before `baton` in the `INSTALLED_APPS` settings, I'll call this app ROOTAPP
- clone the repository (or copy the `static/baton/app` dir from your virtualenv) ::

      $ git clone https://github.com/otto-torino/django-baton.git

- install the app requirements ::

    $ cd django-baton/baton/static/baton/app/
    $ npm install

- edit the ``src/styles/_variables.scss`` file as you like
- recompile the app ::

    $ npm run compile

- copy the generated bundle ``dist/baton.min.js`` in ``ROOTAPP/static/baton/app/dist/``

You can also perform live development, in this case:

- place one of your django apps before `baton` in the `INSTALLED_APPS` settings, I'll call this app ROOTAPP
- create an admin base_site template ``ROOTAPP/templates/admin/base_site.html`` with the following content: ::

    {% extends "admin/base_site.html" %}
    {% block extrahead %}
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <script src="http://localhost:8080/dist/baton.min.js"></script>
        <script>
            {% baton_config 'CONFIRM_UNSAVED_CHANGES' as confirm_unsaved_changes %}
            {% baton_config 'SHOW_MULTIPART_UPLOADING' as show_multipart_uploading %}
            {% baton_config 'ENABLE_IMAGES_PREVIEW' as enable_images_preview %}
            {% baton_config 'CHANGELIST_FILTERS_IN_MODAL' as changelist_filters_in_modal %}
            {% baton_config 'COLLAPSABLE_USER_AREA' as collapsable_user_area %}
            {% baton_config 'MENU_ALWAYS_COLLAPSED' as menu_always_collapsed %}
            {% baton_config 'MENU_TITLE' as menu_title %}
            {% baton_config 'GRAVATAR_DEFAULT_IMG' as gravatar_default_img %}
            (function ($, undefined) {
                $(document).ready(function () {
                    Baton.init({
                        api: {
                            app_list: '{% url 'baton-app-list-json' %}',
                            gravatar: '{% url 'baton-gravatar-json' %}'
                        },
                        confirmUnsavedChanges: {{ confirm_unsaved_changes|yesno:"true,false" }},
                        showMultipartUploading: {{ show_multipart_uploading|yesno:"true,false" }},
                        enableImagesPreview: {{ enable_images_preview|yesno:"true,false" }},
                        changelistFiltersInModal: {{ changelist_filters_in_modal|yesno:"true,false" }},
                        collapsableUserArea: {{ collapsable_user_area|yesno:"true,false" }},
                        menuAlwaysCollapsed: {{ menu_always_collapsed|yesno:"true,false" }},
                        menuTitle: '{{ menu_title|escapejs }}',
                        gravatarDefaultImg: '{{ gravatar_default_img }}'
                    });
                })
            })(jQuery, undefined)
        </script>
    {% endblock %}

- or you can edit directly the baton template and switch the comment of the two lines: ::

    <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> comment the compiled src and uncomment the webpack served src -->
    <script src="http://localhost:8080/dist/baton.min.js"></script>

- start the webpack development server ::

    $ npm run dev

Now while you make your changes to the js app (css included), webpack will update the bundle automatically, so just refresh the page and you'll see your changes.
