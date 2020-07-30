Signals
=========

Baton provides a dispatcher that can be used to register function that will be called when some events occurr.
At this moment Baton emits four types of events:

- ``onNavbarReady``: dispatched when the navbar is fully rendered
- ``onMenuReady``: dispatched when the menu is fully rendered (probably the last event fired, since the menu contents are retrieves async)
- ``onTabsReady``: dispatched when the changeform tabs are fully
- ``onMenuError``: dispatched if the request sent to retrieve menu contents fails
- ``onReady``: dispatched when Baton js has finished its sync job

In order to use them just override the baton `admin/base_site.html` template and register your listeners **before** calling `Baton.init`, i.e. ::

    <!-- ... -->
    <script>
        {% baton_config 'CONFIRM_UNSAVED_CHANGES' as confirm_unsaved_changes %}
        {% baton_config 'SHOW_MULTIPART_UPLOADING' as show_multipart_uploading %}
        {% baton_config 'ENABLE_IMAGES_PREVIEW' as enable_images_preview %}
        {% baton_config 'CHANGELIST_FILTERS_IN_MODAL' as changelist_filters_in_modal %}
        {% baton_config 'MENU_ALWAYS_COLLAPSED' as menu_always_collapsed %}
        {% baton_config 'MENU_TITLE' as menu_title %}
        {% baton_config 'GRAVATAR_DEFAULT_IMG' as gravatar_default_img %}
        (function ($, undefined) {
            $(window).on('load', function () {
                Baton.init({
                    api: {
                        app_list: '{% url 'baton-app-list-json' %}',
                        gravatar: '{% url 'baton-gravatar-json' %}'
                    },
                    confirmUnsavedChanges: {{ confirm_unsaved_changes|yesno:"true,false" }},
                    showMultipartUploading: {{ show_multipart_uploading|yesno:"true,false" }},
                    enableImagesPreview: {{ enable_images_preview|yesno:"true,false" }},
                    changelistFiltersInModal: {{ changelist_filters_in_modal|yesno:"true,false" }},
                    menuAlwaysCollapsed: {{ menu_always_collapsed|yesno:"true,false" }},
                    menuTitle: '{{ menu_title|escapejs }}',
                    gravatarDefaultImg: '{{ gravatar_default_img }}'
                });
            })
        })(jQuery, undefined)
    </script>
    <!-- ... -->
