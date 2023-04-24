Customization
=============

.. image:: images/customization.png

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
    {% load static baton_tags %}
    {% block extrahead %}
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> -->
        <script src="http://localhost:8080/static/baton/app/dist/baton.min.js"></script>
        {% baton_config as conf %}
        {{ conf | json_script:"baton-config" }}
        <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>
    {% endblock %}

- or you can edit directly the baton template and switch the comment of the two lines: ::

    <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> comment the compiled src and uncomment the webpack served src -->
    <script src="http://localhost:8080/static/baton/app/dist/baton.min.js"></script>

- start the webpack development server ::

    $ npm run dev

Now while you make your changes to the js app (css included), webpack will update the bundle automatically, so just refresh the page and you'll see your changes.
