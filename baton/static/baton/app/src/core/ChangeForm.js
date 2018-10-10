import $ from 'jquery'
import Translator from 'core/i18n'

let ChangeForm = {
  /**
   * ChangeForm component
   *
   * Alert unsaved changes stuff
   * Display loading spinner if multipart
   */
  init: function (opts) {
    if (opts.confirmUnsavedChanges) {
      this.formSubmitting = false
      this.form = $('#content-main form')
      this.initData = this.form.serialize()
      this.t = new Translator($('html').attr('lang'))
      this.activate()
    }
    if (opts.showMultipartUploading) {
      this.spinner()
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
  },
  spinner: function () {
    if (this.form.attr('enctype') === 'multipart/form-data') {
      this.form.on('submit', () => this.showSpinner())
    }
  },
  showSpinner: function () {
    let run = false
    let inputFiles = $('input[type=file]')
    inputFiles.each(function (index, input) {
      if (input.files.length !== 0) {
        run = true
      }
    })
    if (run) {
      let overlay = $('<div />', {'class': 'spinner-overlay'}).appendTo(document.body)
      let spinner = $('<i />', {'class': 'fa fa-circle-o-notch fa-spin fa-3x fa-fw'})
      $('<div />').append(
        $('<p />').text(this.t.get('uploading')),
        spinner
      ).appendTo(overlay)
    }
  }
}

export default ChangeForm
