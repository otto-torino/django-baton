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
    this.initTextareaCounters()
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
      // the errors of a field box, and with Django >= 6.1 of any field, are
      // flagged on its container: the row carries them for styles and tabs
      if ($(row).children('.errors').length) {
        $(row).addClass('errors')
      }
      // Django >= 6.1 makes the row itself the flex container of its fields
      if ($(row).hasClass('form-multiline')) {
        return
      }
      const fieldBoxes = $(row).children('.fieldBox')
      fieldBoxes.wrapAll('<div class="wrapped-fields-container" />')
      if (fieldBoxes.length) {
        $(row).addClass('with-wrapped-fields')
      }
    })
    // this.form.find('.wrapped-fields-container > .fieldBox:first-child').children().unwrap()
  },
  // the number of words and characters under every textarea, updated while writing
  initTextareaCounters: function () {
    const self = this
    this.counterT = new Translator($('html').attr('lang'))
    // the row under the textarea follows its width, also when resized or shown in a tab
    this.counterObserver = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target.offsetWidth) {
          $(`#${entry.target.id}_baton_footer`).css('width', entry.target.offsetWidth)
        }
      })
    })
    // the empty form of the inlines too: new rows clone its counter
    this.form.find('textarea').each(function (_, textarea) {
      // rich text editors hide their textarea, and count by themselves if they want
      if (!textarea.id || textarea.style.display === 'none' || $(textarea).closest('.django-ckeditor-widget').length) {
        return
      }
      // the counter on the right, the room on the left for the buttons of the field
      $(textarea).after(
        $('<div />', { id: `${textarea.id}_baton_footer`, class: 'baton-field-footer' }).append(
          $('<div />', { id: `${textarea.id}_baton_counter`, class: 'baton-textarea-counter' }),
        ),
      )
      self.updateTextareaCounter(textarea)
      self.counterObserver.observe(textarea)
    })
    this.form.on('input', 'textarea', function () {
      self.updateTextareaCounter(this)
    })
    // the counter of a new inline row is there, cloned, but its textarea is not observed
    document.addEventListener('formset:added', function (event) {
      $(event.target)
        .find('textarea')
        .each(function (_, textarea) {
          if ($(`#${textarea.id}_baton_footer`).length) {
            self.counterObserver.observe(textarea)
          }
        })
    })
  },
  updateTextareaCounter: function (textarea) {
    const counter = $(`#${textarea.id}_baton_counter`)
    if (!counter.length) {
      return
    }
    // a dash or another sign alone is not a word; the characters are code points, spaces included
    const words = textarea.value.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
    const characters = Array.from(textarea.value).length
    const lang = $('html').attr('lang') || undefined
    counter.text(
      `${words.toLocaleString(lang)} ${this.counterT.get(words === 1 ? 'countWord' : 'countWords')} · ` +
        `${characters.toLocaleString(lang)} ${this.counterT.get(characters === 1 ? 'countCharacter' : 'countCharacters')}`,
    )
  },
  fixNewlines: function () {
    $('.form-row br').replaceWith('<span class="newline"></span>')
  },
  lazyLoadImages: function () {
    $('.file-upload').each(function (_, p) {
      // the AI image input shows its own preview, to set the subject
      if ($(p).find('[data-baton-subject-preview]').length) {
        return
      }
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
      top: 'after',
      bottom: 'append',
      right: 'after',
    }
    // only baton's own templates: other apps' widgets (e.g. django-filer) put theirs, without id, in the form
    $('template[id^="template-"]:not(#template-object-tools)').each(function (_, template) {
      const field = $(template).attr('id').replace('template-', '')
      const position = positionMap[$(template).attr('data-position')]
      if (position !== undefined) {
        const rows = $('.form-row.field-' + field)
        // top: after the label of the field only, since Django 6 the fields with several inputs
        // (e.g. datetime) are a fieldset, with a legend and a label for each input
        const el =
          $(template).attr('data-position') === 'right'
            ? rows.find('#id_' + field)
            : $(template).attr('data-position') === 'top'
              ? rows.map((_, row) => $(row).find('legend, label').get(0))
              : rows
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
