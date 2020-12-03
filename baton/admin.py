from django.contrib import admin
from django.contrib.admin.filters import (
    SimpleListFilter,
    AllValuesFieldListFilter,
    ChoicesFieldListFilter,
    RelatedFieldListFilter,
    RelatedOnlyFieldListFilter
)


class InputFilter(admin.SimpleListFilter):
    template = 'baton/filters/input_filter.html'

    def lookups(self, request, model_admin):
        # Dummy, required to show the filter.
        return ((),)

    def choices(self, changelist):
        # Grab only the "all" option.
        all_choice = next(super(InputFilter, self).choices(changelist))
        all_choice['query_parts'] = (
            (k, v)
            for k, v in changelist.get_filters_params().items()
            if k != self.parameter_name
        )
        yield all_choice


class SimpleDropdownFilter(SimpleListFilter):
    template = 'baton/filters/dropdown_filter.html'


class DropdownFilter(AllValuesFieldListFilter):
    template = 'baton/filters/dropdown_filter.html'


class ChoicesDropdownFilter(ChoicesFieldListFilter):
    template = 'baton/filters/dropdown_filter.html'


class RelatedDropdownFilter(RelatedFieldListFilter):
    template = 'baton/filters/dropdown_filter.html'


class RelatedOnlyDropdownFilter(RelatedOnlyFieldListFilter):
    template = 'baton/filters/dropdown_filter.html'
