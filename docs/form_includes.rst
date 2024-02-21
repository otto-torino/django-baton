Form includes
=========

.. image:: images/baton-form-includes.png

.. important:: In order for this feature to work, the user browser must support html template tags.

Baton lets you include templates directly inside the change form page, in any position you desire. It's as simple as specifying the template path, the field name used as anchor and the position of the template::

    @admin.register(News)
    class NewsAdmin(admin.ModelAdmin):
        #...
        baton_form_includes = [
            ('news/admin_datetime_include.html', 'datetime', 'top', ),
            ('news/admin_content_include.html', 'content', 'above', )
        ]

In this case, Baton will place the content of the ``admin_datetime_include.html`` template at the top of the datetime field row, and the content of the ``admin_content_include.html`` above the content field row.

You can specify the following positions:

+----------------------------------------+--------------------------------------------------------------------+
| Position                               |  Description                                                       |
+========================================+====================================================================+
| top                                    | the template is placed inside the form row, at the top             |
+----------------------------------------+--------------------------------------------------------------------+
| bottom                                 | the template is placed inside the form row, at the bottom          |
+----------------------------------------+--------------------------------------------------------------------+
| above                                  | the template is placed above the form row                          |
+----------------------------------------+--------------------------------------------------------------------+
| below                                  | the template is placed below the form row                          |
+----------------------------------------+--------------------------------------------------------------------+
| right                                  | the template is placed inline at the field right side              |
+----------------------------------------+--------------------------------------------------------------------+

And, of course, you can access the `{{ original }}` object variable inside your template.

It works seamlessly with the tab facility, if you include content related to a field inside one tab, then the content will be placed in the same tab.

Baton lets also include templates in the object tools top bar in the change form page, keep in mind that suche templates are injected inside an ``ul`` tag. The template can be inserted on the left or the right::

    @admin.register(News)
    class NewsAdmin(admin.ModelAdmin):
        #...
        baton_form_object_tools_include = ('news/object_tools_include.html', 'left', )


.. image:: images/baton_form_object_tools_include.png
