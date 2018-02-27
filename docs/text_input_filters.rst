Text Input Filters
==================

Idea taken from this `medium article <https://medium.com/@hakibenita/how-to-add-a-text-filter-to-django-admin-5d1db93772d8>`_.

Baton defines a custom InputFilter class that you can use to create text input filters and use them as any other ``list_filters``, for example ::

    # your app admin

    from baton.admin import InputFilter

    class IdFilter(InputFilter):
        parameter_name = 'id'
        title = 'id'
     
        def queryset(self, request, queryset):
            if self.value() is not None:
                search_term = self.value()
                return queryset.filter(
                    id=search_term
                )


    class MyModelAdmin(admin.ModelAdmin):
        list_filters = (
            'my_field',
            IdFilter,
            'my_other_field',
        )

Just define in the ``queryset`` method the logic used to retrieve the results.
