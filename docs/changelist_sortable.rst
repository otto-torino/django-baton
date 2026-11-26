Sortable Changelist
===================

Baton can order the rows of a changelist by dragging them, for models ordered by an integer field such as ``position``. It is opt-in per ``ModelAdmin``.

How to enable it:

1. Add the ``BatonSortableMixin`` to your ``ModelAdmin`` (it must come before ``admin.ModelAdmin``/other mixins in the base classes list).
2. Set ``sortable_field`` to the name of the field. The model must be ordered by it.

Example: ::

    from baton.admin import BatonSortableMixin

    class CategoryAdmin(BatonSortableMixin, admin.ModelAdmin):
        list_display = ("name", "position")
        sortable_field = "position"

    class Category(models.Model):
        name = models.CharField(max_length=50)
        position = models.PositiveIntegerField(default=1)

        class Meta:
            ordering = ("position", "pk")

What it does:

- The column of the field becomes a handle with the value beside it, read only (the column is added first when the field is not in ``list_display``). Clicking its header orders the list by the field.
- The order is saved as soon as a row is dropped, then the page reloads with the new values and a confirmation message. On the handle, the up and down arrow keys move the row; the order is saved when they stop.
- The rows can be dragged only while the changelist is ordered by the field, ascending. Ordered by another column, the handles are disabled and a notice links back to the order by the field.
- With filters, a search or pagination, the visible rows swap the places they already had: the others keep theirs. Then all the rows, also the ones the queryset of the admin hides, are numbered from 1.
- The field is read only in the change form, and new objects go to the end of the list.
- Users without the change permission see the values without the handles.

.. important:: The field cannot be in ``list_editable`` (system check ``baton.E002``). If there are unsaved changes in the ``list_editable`` fields, a drop is undone and asks to save them first, since the reload would lose them.

.. note:: The order is saved with ``bulk_update``: ``save()`` and the ``pre_save``/``post_save`` signals are not called for the reordered objects.
