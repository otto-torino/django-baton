Compact stacked inlines
=======================

Baton displays every stacked inline as a compact row with its object name,
model label, a plain-text summary and controls to open the form and delete
or restore the entry. Tabular inlines keep their table. No inline classes
are needed to enable this presentation.

Saved entries start collapsed; new entries and entries with validation
errors start expanded. ``expand-first`` still opens the first entry.
The existing form widgets and Django permissions are preserved.

When an inline has an editable numeric ``position``, ``sort_order`` or
``order`` field, its handle lets users drag it or use the Up/Down arrow keys.
The menu also offers Move up and Move down. The model must use that field
in its ordering for the order to persist across visits. All changes,
including ordering and deletion, are saved with the parent form.
Untouched extra forms are excluded from ordering to avoid empty records.

To keep the previous presentation for a project::

    BATON = {"COMPACT_INLINES": False}

In that mode, ``collapse-entry`` and ``expand-first`` retain their original
behaviour for stacked inlines.
