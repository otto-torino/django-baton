from django.contrib import admin
from django.contrib.admin.filters import (
    SimpleListFilter,
    AllValuesFieldListFilter,
    ChoicesFieldListFilter,
    RelatedFieldListFilter,
    RelatedOnlyFieldListFilter
)
from .models import BatonTheme


class InputFilter(admin.SimpleListFilter):
    template = 'baton/filters/input_filter.html'

    def lookups(self, request, model_admin):
        # Dummy, required to show the filter.
        return (('all', 'All'),)

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


class MultipleChoiceListFilter(admin.SimpleListFilter):
    template = 'baton/filters/multiple_choice_filter.html'

    def lookups(self, request, model_admin):
        """
        Must be overridden to return a list of tuples (value, verbose value)
        """
        raise NotImplementedError(
            'The MultipleChoiceListFilter.lookups() method must be overridden to '
            'return a list of tuples (value, verbose value).'
        )

    def queryset(self, request, queryset):
        if request.GET.get(self.parameter_name):
            kwargs = {self.parameter_name: request.GET[self.parameter_name].split(',')}
            queryset = queryset.filter(**kwargs)
        return queryset

    def value_as_list(self):
        return self.value().split(',') if self.value() else []

    def choices(self, changelist):

        def amend_query_string(include=None, exclude=None):
            selections = self.value_as_list()
            if include and include not in selections:
                selections.append(include)
            if exclude and exclude in selections:
                selections.remove(exclude)
            if selections:
                csv = ','.join(selections)
                return changelist.get_query_string({self.parameter_name: csv})
            else:
                return changelist.get_query_string(remove=[self.parameter_name])

        yield {
            'selected': self.value() is None,
            'query_string': changelist.get_query_string(remove=[self.parameter_name]),
            'display': 'All',
            'reset': True,
        }
        for lookup, title in self.lookup_choices:
            yield {
                'selected': str(lookup) in self.value_as_list(),
                'query_string': changelist.get_query_string({self.parameter_name: lookup}),
                'include_query_string': amend_query_string(include=str(lookup)),
                'exclude_query_string': amend_query_string(exclude=str(lookup)),
                'display': title,
            }

@admin.register(BatonTheme)
class BatonThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'active')
    list_editable = ('active',)
