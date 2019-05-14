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
    this.form = $('#content-main form')
    if (opts.confirmUnsavedChanges) {
      this.formSubmitting = false
      this.t = new Translator($('html').attr('lang'))
      var self = this
      // wait for django SelectFilter to do its job
      setTimeout(function () {
        self.initData = self.serializeData()
        self.activate()
      }, 500)
    }
    if (opts.showMultipartUploading) {
      this.spinner()
    }
    this.fixWrappedFields()
    if (opts.enableImagesPreview) {
      this.lazyLoadImages()
    }
  },
  activate: function () {
    this.form.on('submit', () => (this.formSubmitting = true))
    $(window).on('beforeunload', this.alertDirty.bind(this))
  },
  serializeData: function () {
    // form serialize does not detect filter_horizontal controllers because
    // in that case options are not selected, just added to the list of options,
    // and jquery form serialize only serializes values which are set!
    let data = this.form.serialize()
    $('select.filtered[multiple][id$=_to]').each(function (k, select) {
      let optionsValues = []
      $(select).children('option').each(function (kk, option) {
        optionsValues.push($(option).attr('value'))
      })
      data += `&${jQuery(select).attr('name')}=${optionsValues.sort().join(',')}`
    })
    return data
  },
  isDirty: function () {
    return this.serializeData() !== this.initData
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
      let spinner = $('<i />', {'class': 'fa fa-spinner fa-spin fa-3x fa-fw'})
      $('<div />').append(
        $('<p />').text(this.t.get('uploading')),
        spinner
      ).appendTo(overlay)
    }
  },
  fixWrappedFields: function () {
    this.form.find('.form-row > .fieldBox').wrapAll('<div class="wrapped-fields-container" />')
    this.form.find('.wrapped-fields-container > .fieldBox').children().unwrap()
  },
  lazyLoadImages: function () {
    $('.file-upload').each(function (index, p) {
      let cur = $(p).find('a')
      if (cur.length) {
        let url = cur.attr('href')
        let ext = url.split('.').pop()
        if (['jpg', 'jpeg', 'png', 'bmp', 'svg', 'gif', 'tif'].indexOf(ext) !== -1) {
          let spinner = $('<i />', {'class': 'fa fa-spinner fa-spin fa-2x fa-fw'}).css('color', '#aaa')
          let preview = $('<div />', {'class': 'py-2'}).append(spinner)
          $(p).prepend(preview)
          let image = new Image()
          image.onload = function () {
            spinner.replaceWith($(image).addClass('baton-image-preview'))
          }
          image.onerror = function () {
            preview.remove()
          }
          image.src = url
        }
      }
    })
  }
}

export default ChangeForm
