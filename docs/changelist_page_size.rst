Changelist Page Size
=====================

By default Django's admin changelist page size is fixed by ``ModelAdmin.list_per_page`` and can't be changed by the end user. Baton can add a "rows per page" selector to the pagination bar, opt-in per ``ModelAdmin``.

How to enable it:

1. Add the ``BatonListPerPageMixin`` to your ``ModelAdmin`` (it must come before ``admin.ModelAdmin``/other mixins in the base classes list).
2. Set ``list_per_page_choices`` to the list of page sizes you want to offer.

Example: ::

    from baton.admin import BatonListPerPageMixin

    class NewsAdmin(BatonListPerPageMixin, admin.ModelAdmin):
        list_per_page = 25
        list_per_page_choices = [10, 25, 50, 100]

.. important:: Include your existing ``list_per_page`` value in ``list_per_page_choices``, otherwise the selector won't have a matching option to preselect for the default view.

If your ``ModelAdmin`` already overrides ``get_changelist``, make it return (or extend) ``baton.admin.BatonChangeList`` yourself instead of using the mixin.

The chosen page size is only ever accepted if it's part of ``list_per_page_choices``: any other value passed through the URL (``?ps=...``) is ignored and Baton falls back to ``list_per_page``, so this can't be used to force arbitrarily large queries.
