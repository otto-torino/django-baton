Collapsable StackedInline entries
=========

.. image:: images/collapsable_stackedinline.png


Baton lets you collapse single stacked inline entries, just add a `collapse-entry` class to the inline, with or without the entire collapse class ::

    class VideosInline(admin.StackedInline):
        model = Video
        extra = 1
        classes = ('collapse-entry', )  # or ('collapse', 'collapse-entry', )


And if you want the first entry to be initially expanded, add also the `expand-first` class ::

    class VideosInline(admin.StackedInline):
        model = Video
        extra = 1
        classes = ('collapse-entry', 'expand-first', )
