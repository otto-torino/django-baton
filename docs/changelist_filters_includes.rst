Changelist filters includes
===================

.. image:: images/baton-cl-filters-includes.png
.. important:: In order for this feature to work, the user browser must support html template tags.

Baton lets you include templates directly inside the change list filter container, at the top or the bottom. It's as simple as specifying the template path and the position of the template: ::

    @admin.register(News)
    class NewsAdmin(admin.ModelAdmin):
        #...
        baton_cl_filters_includes = [
            ('news/admin_filters_include_top.html', 'top', ),
            ('news/admin_filters_include_below.html', 'bottom', )
        ]


You can specify the following positions:

+----------------------------------------+---------------------------------------------------------------------------------+
| Position                               |  Description                                                                    |
+========================================+=================================================================================+
| top                                    | the template is placed inside the changelist filters container, at the top      |
+----------------------------------------+---------------------------------------------------------------------------------+
| bottom                                 | the template is placed inside the changelist filters container, at the bottom   |
+----------------------------------------+---------------------------------------------------------------------------------+

And, of course, you can access the all the changelist view context variables inside your template.
