Js Translations
==================

There are some circustamces in which Baton will print to screen some js message. Baton detects the user locale and will localize such messages, but it comes with just ``en`` and ``it`` translations provided.

.. important:: Baton retrieves the current user locale from the ``lang`` attribute of the ``html`` tag.

However you can provide or add your own translations by attaching an object to the `Baton` namespace: ::

    // these are the default translations, you can just edit the one you need, or add some locales. Baton engione will always
    // pick up your custom translation first, if it find them.
    // you can define thi object before Baton.init in the base_site template
    Baton.translations = {
      unsavedChangesAlert: {
        en: 'You have some unsaved changes.',
        it: 'Alcune modifiche non sono state salvate.'
      },
      uploading: {
        en: 'Uploading...',
        it: 'Uploading...'
      },
      filter: {
        en: 'Filter',
        it: 'Filtra'
      },
      close: {
        en: 'Close',
        it: 'Chiudi'
      },
      save: {
        en: 'Salva',
        it: 'Chiudi'
      },
      cannotCopyToClipboardMessage: {
        en: 'Cannot copy to clipboard, please do it manually: Ctrl+C, Enter',
        it: 'Impossibile copiare negli appunti, copiare manualmente: Ctrl+C, Enter'
      },
      retrieveDataError: {
        en: 'There was an error retrieving the data',
        it: 'Si è verificato un errore nel reuperare i dati'
      }
    }

    Baton.init(JSON.parse(document.getElementById('baton-config').textContent));

If Baton can't find the translations for the user locale, it will default to ``en``. Keep in mind that Baton will use ``en`` translations for all ``en-xx`` locales, but of course you can specify your custom translations!
