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
        (function ($, undefined) {
            // init listeners
            Baton.Dispatcher.register('onReady', function () { console.log('BATON IS READY') })
            Baton.Dispatcher.register('onMenuReady', function () { console.log('BATON MENU IS READY') })
            Baton.Dispatcher.register('onNavbarReady', function () { console.log('BATON NAVBAR IS READY') })
            // end listeners
        })(jQuery, undefined)
    </script>
    <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>
    <!-- ... -->
