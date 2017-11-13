export const messages = {
  unsavedChangesAlert: {
    en: 'You have some unsaved changes.',
    it: 'Alcune modifiche non sono state salvate.'
  }
}

export default class Translator {

  constructor (lng) {
    this.lng = this.setLng(lng)
  }

  setLng (lng) {
    if (lng === 'it' || /it-/.test(lng)) {
      return 'it'
    }

    return 'en'
  }

  get (key) {
    if (typeof messages[key] === 'undefined') {
      return ''
    }
    return messages[key][this.lng]
  }
}
