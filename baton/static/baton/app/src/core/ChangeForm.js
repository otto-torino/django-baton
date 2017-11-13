import $ from 'jquery'
import Translator from 'core/i18n'

let ChangeForm = {
  /**
   * ChangeForm component
   *
   * Alert unsaved changes stuff
   */
  init: function (opts) {
    if (opts.confirmUnsavedChanges) {
      this.formSubmitting = false
      this.form = $('#content-main form')
      this.initData = this.form.serialize()
      this.t = new Translator($('html').attr('lang'))
      this.activate()
    }
  },
  activate: function () {
    this.form.on('submit', () => (this.formSubmitting = true))
    $(window).on('beforeunload', this.alertDirty.bind(this))
  },
  isDirty: function () {
    return this.form.serialize() !== this.initData
  },
  alertDirty: function (e) {
    if (this.formSubmitting || !this.isDirty()) {
      return undefined
    }
    let confirmationMessage = this.t.get('unsavedChangesAlert');
    (e || window.event).returnValue = confirmationMessage // Gecko + IE
    return confirmationMessage // Gecko + Webkit, Safari, Chrome etc.
  }
}

export default ChangeForm
