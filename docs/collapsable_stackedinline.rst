Collapsable StackedInline entries
=========

.. image:: images/collapsable_stackedinline.png


Baton lets you collapse single stacked inline entries, just add a `collapse-entry` class to the inline, with or without the entire collapse class ::

    class VideosInline(admin.StackedInline):
        model = Video
        extra = 1
        classes = ('collapse-entry', )  # or ('collapse', 'collapse-entry', )
