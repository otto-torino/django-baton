import $ from 'jquery'
import Translator from './i18n'

let ChangeForm = {
  /**
   * ChangeForm component
   *
   * Alert unsaved changes stuff
   * Display loading spinner if multipart
   */
  init: function (opts) {
    var self = this
    this.form = $('#content-main form')
    if (opts.confirmUnsavedChanges) {
      this.formSubmitting = false
      this.t = new Translator($('html').attr('lang'))
      // wait for django SelectFilter to do its job
      setTimeout(function () {
        self.initData = self.serializeData()
        self.activate()
      }, 500)
    }
    if (opts.showMultipartUploading) {
      this.spinner()
    }
    self.fixNewlines()
    setTimeout(function () {
      self.fixNewlines() // js inserted ones
    }, 50)
    this.fixWrappedFields()
    if (opts.enableImagesPreview) {
      this.lazyLoadImages()
    }
    this.activateEntryCollapsing()
    this.changeFieldsetCollapseStyle()
    this.fixExpandFirstErrorCollapsing()
    this.initTemplates()
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
    this.form.find('.form-row').each(function (index, row) {
      var fieldBoxes = $(row).children('.fieldBox')
      fieldBoxes.each(function (index, fbox) {
        if ($(fbox).hasClass('errors')) {
          $(row).addClass('errors')
        }
      })
      fieldBoxes.wrapAll('<div class="wrapped-fields-container" />')
      if (fieldBoxes.length) {
        $(row).addClass('with-wrapped-fields')
      }
    })
    // this.form.find('.wrapped-fields-container > .fieldBox:first-child').children().unwrap()
  },
  fixNewlines: function () {
    $('.form-row br').replaceWith('<span class="newline"></span>')
  },
  lazyLoadImages: function () {
    $('.file-upload').each(function (index, p) {
      let cur = $(p).find('a')
      if (cur.length) {
        let url = cur.attr('href')
        let ext = url.split('?')[0].split('.').pop()
        if (['jpg', 'jpeg', 'png', 'bmp', 'svg', 'gif', 'tif', 'webp'].indexOf(ext) !== -1) {
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
  },
  activateEntryCollapsing: function () {
    $('.collapse-entry h3')
      .addClass('entry-collapsed entry-collapse-full-toggler')
      .append('<span />') // just to have the toggler right aligned
      .append('<span class="entry-collapse-toggler" />')
    $('.collapse-entry')
      .click(function (e) {
        let target = $(e.target)
        if (target.hasClass('entry-collapse-full-toggler')) {
          target.toggleClass('entry-collapsed')
        } else if (target.parent('.entry-collapse-full-toggler').length > 0) {
          target.parent('.entry-collapse-full-toggler').toggleClass('entry-collapsed')
        }
      })
    $('.form-row.errors').each(function (index, el) {
      if ($(el).parent('fieldset').prev('h3.entry-collapsed')) {
        $(el).parent('fieldset').prev('h3.entry-collapsed').removeClass('entry-collapsed')
      }
    })
  },
  fixExpandFirstErrorCollapsing: function () {
    $('.expand-first').each(function (index, el) {
      if ($(el).find('.inline-related[id$=0] .form-row.errors').length) {
        // inverse logic
        $(el).find('.inline-related[id$=0] .form-row.errors').parent('fieldset').prev('h3').addClass('entry-collapsed')
      }
    })
  },
  changeFieldsetCollapseStyle: function () {
    $(window).on('load', function () {
      $('fieldset.collapse > h2').each(function (index, title) {
        let text = $(title).text().replace(/\(.*\)/, '')
        setTimeout(function () {
          $(title).html(text).on('click', function () {
            $(this).parent('.collapse').toggleClass('collapsed')
          })
        }, 100)
      })
    })
  },
  initTemplates: function () {
    const positionMap = {
      above: 'before',
      below: 'after',
      top: 'prepend',
      bottom: 'append',
      right: 'after'
    }
    $('template').each(function (index, template) {
      let field = $(template).attr('id').replace('template-', '')
      let position = positionMap[$(template).attr('data-position')]
      if (position !== undefined) {
        let el = $(template).attr('data-position') === 'right'
          ? $('.form-row.field-' + field + ' #id_' + field)
          : $('.form-row.field-' + field)
        el[position]($(template).html())
      } else {
        console.error('Baton: wrong form include position detected')
      }
    })
  }
}

export default ChangeForm
