from __future__ import annotations

import json
from typing import Any, Callable, Iterable, Iterator, cast

from django.contrib import admin, messages
from django.contrib.admin.filters import (
    SimpleListFilter,
    AllValuesFieldListFilter,
    ChoicesFieldListFilter,
    RelatedFieldListFilter,
    RelatedOnlyFieldListFilter
)
from django.contrib.admin.views.main import ALL_VAR, ORDER_VAR, ChangeList
from django.core import checks
from django.core.exceptions import FieldDoesNotExist, PermissionDenied
from django.db import transaction
from django.db.models import Max, Model, QuerySet
from django.forms import Form
from django.http import HttpRequest, HttpResponseBase, HttpResponseNotAllowed, JsonResponse
from django.urls import URLPattern, path
from django.utils.html import format_html
from django.utils.translation import gettext as _
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
    def get_query_string(
        self,
        new_params: dict[str, Any] | None = None,
        remove: Iterable[str] | None = None,
    ) -> str:
        params_to_remove = list(remove or ())
        if (
            new_params is not None
            and ALL_VAR in new_params
            and new_params[ALL_VAR] is not None
        ):
            params_to_remove.append('ps')
        return super().get_query_string(new_params, params_to_remove)

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


class BatonSortableMixin:
    """
    Opt-in mixin ordering the changelist rows by dragging them.

    Set ``sortable_field`` on the ``ModelAdmin`` to the integer field the model is
    ordered by (e.g. ``"position"``). Its column becomes a handle with the value
    beside it, read only, and the field is read only in the form: the order
    changes only by dragging, and is saved as soon as a row is dropped. The rows
    can be dragged only while the changelist is ordered by that field,
    ascending; new objects go to the end of the list.
    """

    sortable_field: str | None = None
    # the name of the column of the handle in list_display
    sortable_column = 'baton_sortable_handle'

    model: type[Model]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        if self.sortable_field:
            # an attribute of the instance, so that every admin has the header of its field
            setattr(self, self.sortable_column, self._baton_sortable_column())

    def _baton_sortable_column(self) -> Callable[[Model], str]:
        field = cast(str, self.sortable_field)

        def column(obj: Model) -> str:
            return format_html(
                '<button type="button" class="btn baton-cl-sort-handle" data-pk="{}" aria-label="{}">'
                '<span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>'
                '</button><span class="baton-cl-sort-value">{}</span>',
                obj.pk,
                _('Drag to reorder; use arrow keys to move'),
                getattr(obj, field),
            )

        try:
            column.short_description = self.model._meta.get_field(field).verbose_name  # type: ignore[attr-defined, union-attr]
        except FieldDoesNotExist:
            column.short_description = field  # type: ignore[attr-defined]
        column.admin_order_field = field  # type: ignore[attr-defined]
        return column

    def check(self, **kwargs: Any) -> list[checks.CheckMessage]:
        errors = cast(list[checks.CheckMessage], super().check(**kwargs))  # type: ignore[misc]
        field = self.sortable_field
        if not field:
            return errors
        try:
            self.model._meta.get_field(field)
        except FieldDoesNotExist:
            return [*errors, checks.Error(
                "sortable_field '%s' is not a field of %s." % (field, self.model._meta.label),
                obj=self.__class__, id='baton.E001',
            )]
        if field in getattr(self, 'list_editable', ()):
            errors.append(checks.Error(
                "sortable_field '%s' cannot be in list_editable: it is set by dragging the rows." % field,
                obj=self.__class__, id='baton.E002',
            ))
        ordering = list(getattr(self, 'ordering', None) or self.model._meta.ordering or [])
        if not ordering or ordering[0] != field:
            errors.append(checks.Warning(
                "The changelist of %s is not ordered by sortable_field '%s': "
                "its rows can be dragged only when ordered by it." % (self.model._meta.label, field),
                obj=self.__class__, id='baton.W001',
            ))
        return errors

    def get_list_display(self, request: HttpRequest) -> Any:
        list_display = list(super().get_list_display(request))  # type: ignore[misc]
        field = self.sortable_field
        if not field:
            return list_display
        if field in list_display:
            return [self.sortable_column if name == field else name for name in list_display]
        return [self.sortable_column, *list_display]

    def get_readonly_fields(self, request: HttpRequest, obj: Model | None = None) -> Any:
        readonly = list(super().get_readonly_fields(request, obj))  # type: ignore[misc]
        if self.sortable_field and self.sortable_field not in readonly:
            readonly.append(self.sortable_field)
        return readonly

    def save_model(self, request: HttpRequest, obj: Model, form: Form, change: bool) -> None:
        field = self.sortable_field
        if field and not change:
            last = self.model._default_manager.aggregate(last=Max(field))['last']
            setattr(obj, field, (last or 0) + 1)
        super().save_model(request, obj, form, change)  # type: ignore[misc]

    def get_urls(self) -> list[URLPattern]:
        urls = cast(list[URLPattern], super().get_urls())  # type: ignore[misc]
        if not self.sortable_field:
            return urls
        opts = self.model._meta
        # before the URLs of the objects, which would take "reorder" for an id
        return [
            path(
                'reorder/',
                self.admin_site.admin_view(self.baton_reorder_view),  # type: ignore[attr-defined]
                name='%s_%s_baton_reorder' % (opts.app_label, opts.model_name),
            ),
            *urls,
        ]

    def _baton_sortable_ordering(self, request: HttpRequest) -> list[Any]:
        ordering = list(self.get_ordering(request) or self.model._meta.ordering or [])  # type: ignore[attr-defined]
        return [*ordering, 'pk']

    def baton_reorder_view(self, request: HttpRequest) -> HttpResponseBase:
        """Gives the rows of the page the places they had, in the order they were dropped in.

        The other rows (on other pages, filtered out, hidden by the queryset of the
        admin) keep their places; then all the rows are numbered from 1.
        """
        if request.method != 'POST':
            return HttpResponseNotAllowed(['POST'])
        if not self.has_change_permission(request):  # type: ignore[attr-defined]
            raise PermissionDenied
        try:
            order = json.loads(request.body)['order']
        except (ValueError, KeyError, TypeError):
            return JsonResponse({'error': _('The order is not valid.')}, status=400)
        if not isinstance(order, list) or not order:
            return JsonResponse({'error': _('The order is not valid.')}, status=400)
        order = [str(pk) for pk in order]
        if len(set(order)) != len(order):
            return JsonResponse({'error': _('The order is not valid.')}, status=400)

        field = cast(str, self.sortable_field)
        with transaction.atomic():
            objects = list(
                self.model._default_manager.select_for_update()
                .order_by(*self._baton_sortable_ordering(request))
                .only(field)
            )
            index = {str(obj.pk): i for i, obj in enumerate(objects)}
            if any(pk not in index for pk in order):
                return JsonResponse(
                    {'error': _('The list has changed in the meantime: reload the page.')},
                    status=400,
                )
            by_pk = {str(obj.pk): obj for obj in objects}
            for slot, pk in zip(sorted(index[pk] for pk in order), order):
                objects[slot] = by_pk[pk]
            changed = []
            for value, obj in enumerate(objects, start=1):
                if getattr(obj, field) != value:
                    setattr(obj, field, value)
                    changed.append(obj)
            self.model._default_manager.bulk_update(changed, [field])
        messages.success(request, _('The order has been saved.'))
        return JsonResponse({'ok': True})

    def baton_cl_sortable(self, request: HttpRequest, cl: ChangeList) -> dict[str, Any] | None:
        """The configuration of the dragging, for the changelist template."""
        field = self.sortable_field
        if not field:
            return None
        ordering = cl.get_ordering(request, cl.root_queryset)
        first = ordering[0] if ordering else None
        if isinstance(first, str):
            ordered = first == field
        else:
            expression = getattr(first, 'expression', None)
            ordered = getattr(expression, 'name', None) == field and not getattr(first, 'descending', False)
        opts = self.model._meta
        return {
            'url': self._baton_reorder_url(opts.app_label, cast(str, opts.model_name)),
            'can_change': self.has_change_permission(request),  # type: ignore[attr-defined]
            'ordered': ordered,
            'reset_url': cl.get_query_string(remove=[ORDER_VAR]),
        }

    def _baton_reorder_url(self, app_label: str, model_name: str) -> str:
        from django.urls import reverse
        return reverse(
            '%s:%s_%s_baton_reorder' % (self.admin_site.name, app_label, model_name),  # type: ignore[attr-defined]
        )


@admin.register(BatonTheme)
class BatonThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'active')
    list_editable = ('active',)
