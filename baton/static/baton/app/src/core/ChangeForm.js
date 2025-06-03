import $ from 'jquery'
import Translator from './i18n'

const ChangeForm = {
  /**
   * ChangeForm component
   *
   * Alert unsaved changes stuff
   * Display loading spinner if multipart
   */
  init: function (opts, Dispatcher) {
    this.Dispatcher = Dispatcher
    const self = this
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
    if (opts.changeformFixedSubmitRow && window.screen.width > 992) {
      this.fixSubmitRow()
    }
    self.fixNewlines()
    setTimeout(function () {
      self.fixNewlines() // js inserted ones
    }, 50)
    this.fixWrappedFields()
    if (opts.enableImagesPreview) {
      this.lazyLoadImages()
    }
    this.fixCollapseDetails() // with Django 5.1 a collapse-entry class causes details/summary markup to appear
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
    let data = jQuery(':not([data-baton-excluded])', this.form).serialize()
    $('select.filtered[multiple][id$=_to]').each(function (_, select) {
      const optionsValues = []
      $(select)
        .children('option')
        .each(function (_, option) {
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
    const confirmationMessage = this.t.get('unsavedChangesAlert')
    ;(e || window.event).returnValue = confirmationMessage // Gecko + IE
    return confirmationMessage // Gecko + Webkit, Safari, Chrome etc.
  },
  spinner: function () {
    if (this.form.attr('enctype') === 'multipart/form-data') {
      this.form.on('submit', () => this.showSpinner())
    }
  },
  showSpinner: function () {
    let run = false
    const inputFiles = $('input[type=file]')
    inputFiles.each(function (_, input) {
      if (input.files.length !== 0) {
        run = true
      }
    })
    if (run) {
      const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
      const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
      $('<div />')
        .append($('<p />').text(this.t.get('uploading')), spinner)
        .appendTo(overlay)
    }
  },
  fixWrappedFields: function () {
    this.form.find('.form-row').each(function (_, row) {
      const fieldBoxes = $(row).children('.fieldBox')
      fieldBoxes.each(function (_, fbox) {
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
    $('.file-upload').each(function (_, p) {
      const cur = $(p).find('a')
      if (cur.length) {
        const url = cur.attr('href')
        const ext = url.split('?')[0].split('.').pop()
        if (['jpg', 'jpeg', 'png', 'bmp', 'svg', 'gif', 'tif', 'webp'].indexOf(ext) !== -1) {
          const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' })
            .text('progress_activity')
            .css('color', '#aaa')
          const preview = $('<div />', { class: 'py-2' }).append(spinner)
          $(p).prepend(preview)
          const image = new Image()
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
  fixCollapseDetails: function () {
    const details = $('fieldset:not(.collapse) details').attr('open', 'open')
    $('fieldset.collapsed > details').removeAttr('open')
  },
  activateEntryCollapsing: function () {
    $('.collapse-entry h3, .collapse-entry h2')
      .addClass('entry-collapsed entry-collapse-full-toggler')
      .append('<span />') // just to have the toggler right aligned
      .append('<span class="entry-collapse-toggler" />')
    $('.collapse-entry').click(function (e) {
      const target = $(e.target)
      if (target.hasClass('entry-collapse-full-toggler')) {
        target.toggleClass('entry-collapsed')
      } else if (target.parent('.entry-collapse-full-toggler').length > 0) {
        target.parent('.entry-collapse-full-toggler').toggleClass('entry-collapsed')
      }
    })
    $('.form-row.errors').each(function (index, el) {
      if ($(el).parent('fieldset').siblings('h3.entry-collapsed')) {
        $(el).parent('fieldset').siblings('h3.entry-collapsed').removeClass('entry-collapsed')
      }
    })
  },
  fixExpandFirstErrorCollapsing: function () {
    $('.expand-first').each(function (_, el) {
      if ($(el).find('.inline-related[id$=0] .form-row.errors').length) {
        // inverse logic
        $(el)
          .find('.inline-related[id$=0] .form-row.errors')
          .parent('fieldset')
          .siblings('h3')
          .addClass('entry-collapsed')
      }
    })
  },
  changeFieldsetCollapseStyle: function () {
    $(window).on('load', function () {
      $('fieldset.collapse > h2').each(function (_, title) {
        const text = $(title)
          .text()
          .replace(/\(.*\)/, '')
        setTimeout(function () {
          $(title)
            .html(text)
            .on('click', function () {
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
      right: 'after',
    }
    $('template:not(#template-object-tools)').each(function (_, template) {
      const field = $(template).attr('id').replace('template-', '')
      const position = positionMap[$(template).attr('data-position')]
      if (position !== undefined) {
        const el =
          $(template).attr('data-position') === 'right'
            ? $('.form-row.field-' + field + ' #id_' + field)
            : $('.form-row.field-' + field)
        el[position]($(template).html())
      } else {
        console.error('Baton: wrong form include position detected')
      }
    })

    $('template#template-object-tools').each(function (_, template) {
      const position = $(template).attr('data-position') === 'right' ? 'append' : 'prepend'
      const el = $('ul.object-tools')
      el[position]($(template).html())
    })
  },
  fixSubmitRow: function () {
    $('#content-main form').addClass('baton-fixed-submit-row')
    const footerHeight = $('.site-footer').outerHeight()
    const fixPosition = function () {
      if ($(window).scrollTop() + $(window).height() > $(document).height() - footerHeight + 2) {
        $('form .submit-row').css('padding-bottom', `calc(${footerHeight}px + 1rem)`)
      } else {
        $('form .submit-row').css('padding-bottom', '1rem')
      }
    }
    fixPosition()
    $(window).on('scroll', fixPosition)
    $(window).on('resize', fixPosition)
    this.Dispatcher.register('onTabsReady', fixPosition)
    this.Dispatcher.register('onTabChanged', fixPosition)
  },
}

export default ChangeForm
