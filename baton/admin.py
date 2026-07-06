from __future__ import annotations

from typing import Any, Iterable, Iterator, cast

from django.contrib import admin
from django.contrib.admin.filters import (
    SimpleListFilter,
    AllValuesFieldListFilter,
    ChoicesFieldListFilter,
    RelatedFieldListFilter,
    RelatedOnlyFieldListFilter
)
from django.contrib.admin.views.main import ChangeList
from django.db.models import QuerySet
from django.http import HttpRequest
from .models import BatonTheme


class InputFilter(admin.SimpleListFilter):
    template = 'baton/filters/input_filter.html'

    def lookups(
        self, request: HttpRequest, model_admin: admin.ModelAdmin[Any]
    ) -> Iterable[tuple[str, str]] | None:
        # Dummy, required to show the filter.
        return (('all', 'All'),)

    def choices(self, changelist: ChangeList) -> Iterator[Any]:
        # Grab only the "all" option.
        all_choice = cast("dict[str, Any]", next(super(InputFilter, self).choices(changelist)))
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

    def lookups(
        self, request: HttpRequest, model_admin: admin.ModelAdmin[Any]
    ) -> Iterable[tuple[str, str]] | None:
        """
        Must be overridden to return a list of tuples (value, verbose value)
        """
        raise NotImplementedError(
            'The MultipleChoiceListFilter.lookups() method must be overridden to '
            'return a list of tuples (value, verbose value).'
        )

    def queryset(self, request: HttpRequest, queryset: QuerySet[Any]) -> QuerySet[Any] | None:
        param = cast(str, self.parameter_name)
        if request.GET.get(param):
            kwargs = {param: request.GET[param].split(',')}
            queryset = queryset.filter(**kwargs)
        return queryset

    def value_as_list(self) -> list[str]:
        value = self.value()
        return value.split(',') if value else []

    def choices(self, changelist: ChangeList) -> Iterator[Any]:
        param = cast(str, self.parameter_name)

        def amend_query_string(
            include: str | None = None, exclude: str | None = None
        ) -> str:
            selections = self.value_as_list()
            if include and include not in selections:
                selections.append(include)
            if exclude and exclude in selections:
                selections.remove(exclude)
            if selections:
                csv = ','.join(selections)
                return changelist.get_query_string({param: csv})
            else:
                return changelist.get_query_string(remove=[param])

        yield {
            'selected': self.value() is None,
            'query_string': changelist.get_query_string(remove=[param]),
            'display': 'All',
            'reset': True,
        }
        for lookup, title in self.lookup_choices:
            yield {
                'selected': str(lookup) in self.value_as_list(),
                'query_string': changelist.get_query_string({param: lookup}),
                'include_query_string': amend_query_string(include=str(lookup)),
                'exclude_query_string': amend_query_string(exclude=str(lookup)),
                'display': title,
            }

class BatonChangeList(ChangeList):
    def get_filters_params(self, params: dict[str, str] | None = None) -> dict[str, str]:
        # 'ps' is not a model lookup: Django's ChangeList treats any unknown GET
        # param as a filter to apply to the queryset, so it must be excluded here
        # (like PAGE_VAR/ERROR_FLAG already are) or filtering blows up with a
        # FieldError as soon as it's present in the URL.
        lookup_params = super().get_filters_params(params)
        lookup_params.pop('ps', None)
        return lookup_params

    def get_results(self, request: HttpRequest) -> None:
        choices = getattr(self.model_admin, 'list_per_page_choices', None)
        if choices:
            try:
                page_size = int(request.GET.get('ps', ''))
            except (TypeError, ValueError):
                page_size = None
            if page_size is not None and page_size in choices:
                self.list_per_page = page_size
        super().get_results(request)


class BatonListPerPageMixin:
    """
    Opt-in mixin adding a "rows per page" choice to the changelist.

    Set ``list_per_page_choices`` on the ``ModelAdmin`` (e.g. ``[10, 25, 50, 100]``)
    to enable the selector. Leave it unset (``None``) to keep the default,
    unconfigurable Django behaviour.
    """

    list_per_page_choices: list[int] | None = None

    def get_changelist(self, request: HttpRequest, **kwargs: Any) -> type[ChangeList]:
        return BatonChangeList


@admin.register(BatonTheme)
class BatonThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'active')
    list_editable = ('active',)
