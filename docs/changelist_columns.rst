Changelist Columns
==================

Baton adds a "Columns" button to the changelist: it opens a popup where the user can show and hide the columns of the list (all but the ones that link to the change form). The choices are stored in the user browser, per changelist.

All the columns are visible by default. You can hide some of them by default, so that they are available in the popup without crowding the list, listing them in ``baton_cl_hidden_columns``: ::

    class NewsAdmin(admin.ModelAdmin):
        list_display = ("title", "date", "status", "created", "modified")
        baton_cl_hidden_columns = ("created", "modified")

The names are the ones used in ``list_display``. When the user shows a column hidden by default, or hides a visible one, the choice wins over the default.
