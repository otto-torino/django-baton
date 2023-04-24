Js Translations
==================

There are some circustamces in which Baton will print to screen some js message. Baton detects the user locale and will localize such messages, but it comes with just ``en`` and ``it`` translations provided.

.. important:: Baton retrieves the current user locale from the ``lang`` attribute of the ``html`` tag.

However you can provide or add your own translations by attaching an object to the `Baton` namespace: ::

    // these are the default translations, you can just edit the one you need, or add some locales. Baton engione will always
    // pick up your custom translation first, if it find them.
    // you can define thi object before Baton.init in the base_site template
    Baton.translations = {
      unsavedChangesAlert: 'You have some unsaved changes.',
      uploading: 'Uploading...',
      filter: 'Filter',
      close: 'Close',
      save: 'Save',
      search: 'Search',
      cannotCopyToClipboardMessage: 'Cannot copy to clipboard, please do it manually: Ctrl+C, Enter',
      retrieveDataError: 'There was an error retrieving the data'
    }

.. important:: Just use the ``trans`` templatetag to deal with multilanguage web applications

If Baton can't find the translations for the user locale, it will default to ``en``. Keep in mind that Baton will use ``en`` translations for all ``en-xx`` locales, but of course you can specify your custom translations!
