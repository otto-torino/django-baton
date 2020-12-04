List Filters
==================

Input Text Filters
------------------

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


Dropdown Filters
----------------

Taken from the github app `django-admin-list-filter-dropdown <https://github.com/mrts/django-admin-list-filter-dropdown>`_.

Baton provides a dropdown form of the following list filters:

+----------------------------------------+------------------------------------+
| Django admin filter name               |  Baton name                        |
+========================================+====================================+
| SimpleListFilter                       | SimpleDropdownFilter               |
+----------------------------------------+------------------------------------+
| AllValuesFieldListFilter               | DropdownFilter                     |
+----------------------------------------+------------------------------------+
| ChoicesFieldListFilter                 | ChoicesDropdownFilter              |
+----------------------------------------+------------------------------------+
| RelatedFieldListFilter                 | RelatedDropdownFilter              |
+----------------------------------------+------------------------------------+
| RelatedOnlyFieldListFilter             | RelatedOnlyDropdownFilter          |
+----------------------------------------+------------------------------------+

The dropdown is visible only if the filter contains at least three options, otherwise the default template is used.

Usage: ::

    from baton.admin import DropdownFilter, RelatedDropdownFilter, ChoicesDropdownFilter

    class MyModelAdmin(admin.ModelAdmin):

        list_filter = (
            # for ordinary fields
            ('a_charfield', DropdownFilter),
            # for choice fields
            ('a_choicefield', ChoiceDropdownFilter),
            # for related fields
            ('a_foreignkey_field', RelatedDropdownFilter),
        )
