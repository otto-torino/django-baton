export const messages = {
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
    en: 'Save',
    it: 'Salva'
  },
  search: {
    en: 'Search',
    it: 'Cerca'
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

export default class Translator {
  constructor (lng) {
    this.lng = this.setLng(lng)
  }

  setLng (lng) {
    if (lng === 'it' || /it-/.test(lng)) {
      return 'it'
    } else if (lng === 'en' || /en-/.test(lng)) {
      return 'en'
    }

    return lng
  }

  get (key) {
    // check custom translations first
    let b = window.Baton
    if (b.translations && b.translations[key] !== 'undefined') {
      return b.translations[key]
    }

    // if key is not found, return empty string
    if (typeof messages[key] === 'undefined') {
      return ''
    }

    // search localized message
    if (messages[key][this.lng] !== undefined) {
      return messages[key][this.lng]
    }

    // default to english
    return messages[key]['en']
  }
}
