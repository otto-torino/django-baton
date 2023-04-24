Page Detection
==============

Baton triggers some of its functionalities basing upon the current page. For example, it will trigger the tab functionality only when the current page is an add form or change form page.

Baton understands which page is currently displayed performing some basic regular expressions against the location pathname.
There may be cases in which you'd like to serve such contents at different and custom urls, in such cases you need a way to tell Baton which kind of page is tied to that url.

For this reason you can inject your custom hook, a javascript function which should return the page type and that receives as first argument the Baton's default function to use as fallback, i.e. ::

    <!-- admin/base_site.html -->
    <script>
        (function () {
            Baton.detectPageHook = fn => /newschange/.test(location.pathname) ? 'change_form' : fn()
        })()
    </script>
    <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>

In this case we tell Baton that when the location pathname includes the string ``newschange``, then the page should be considered a ``change_form``, otherwise we let Baton guess the page type.

So, in order to hook into the Baton page detection system, just define a ``Baton.detectPageHook`` function which receives the default function as first argument and should return the page type.

The available page types are the following: ``dashboard``, ``admindocs``, ``login``, ``logout``, ``passowrd_change``, ``password_change_success``, ``add_form``, ``change_form``, ``changelist``, ``filer``, ``default``.
