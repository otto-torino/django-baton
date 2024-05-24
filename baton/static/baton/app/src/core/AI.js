import 'regenerator-runtime/runtime'
import $ from 'jquery'
import Translator from './i18n'
const Diff = require('diff')

const AI = {
  /**
   * AI component
   *
   * Automatic translations
   */
  init: function (config, page) {
    this.t = new Translator($('html').attr('lang'))
    this.config = config
    if (config.ai.enableTranslations && (page === 'change_form' || page === 'add_form')) {
      this.activateTranslations()
    }
    if (config.ai.enableCorrections && (page === 'change_form' || page === 'add_form')) {
      this.activateCorrections()
    }
  },
  activateTranslations: function () {
    // check if form has fields that need translation
    let hasTranslations = false
    const firstOtherLanguage = this.config.otherLanguages.length ? this.config.otherLanguages[0] : null

    if (firstOtherLanguage) {
      const re = new RegExp(`_${this.config.defaultLanguage}$`)
      const fieldsIds = $(`[id$=_${this.config.defaultLanguage}]`).filter(
        (_, el) => !$(el).attr('id').includes('__prefix__'),
      )

      for (const fieldId of fieldsIds) {
        if ($(`#${fieldId.id}`.replace(re, `_${firstOtherLanguage}`)).length) {
          hasTranslations = true
          break
        }
      }
    }

    if (!hasTranslations) {
      return
    }

    // add translate button if needed
    const translateButton = $('<a />', { id: 'translate-tool', href: '#' })
      .on('click', this.translate.bind(this))
      .prepend($('<i />', { class: 'fa fa-language' }))
      .append($('<span />').text(` ${this.t.get('translate')}`))
    const container = $('ul.object-tools')
    if (container.length) {
      // change form
      container.prepend($('<li />').append(translateButton))
    } else {
      // add form
      $('<ul />', { class: 'object-tools' }).prepend($('<li />').append(translateButton)).prependTo('#content-main')
    }
  },
  translate: function () {
    var self = this
    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'fa fa-spinner fa-spin fa-2x fa-fw' })
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const payload = []
    let fieldsIds = $(`[id$=_${this.config.defaultLanguage}]`)
      .filter((_, el) => !$(el).attr('id').includes('__prefix__'))
      .filter((_, el) => $(el).val() !== '')
      .toArray()
      .map((el) => $(el).attr('id'))
    if (window.CKEDITOR) {
      Object.keys(window.CKEDITOR.instances).forEach(function (fieldId) {
        if (window.CKEDITOR.instances[fieldId].getData() !== '') {
          fieldsIds.push(fieldId)
        }
      })
    }
    fieldsIds = [...new Set(fieldsIds)]

    fieldsIds.forEach(function (fieldId) {
      const re = new RegExp(`_${self.config.defaultLanguage}`)
      const baseId = fieldId.replace(re, '')
      const missing = []
      self.config.otherLanguages.forEach(function (lng) {
        if ($(`#${baseId}_${lng}`).val() === '') {
          missing.push(lng)
        }
      })
      if (missing.length > 0) {
        payload.push({
          text:
            window.CKEDITOR?.instances[`${baseId}_${self.config.defaultLanguage}`]?.getData() ||
            $(`#${baseId}_${self.config.defaultLanguage}`).val(),
          field: baseId,
          languages: missing,
          defaultLanguage: self.config.defaultLanguage,
        })
      }
    })
    // use api
    $.ajax({
      url: this.config.ai.translateApiUrl,
      method: 'POST',
      data: JSON.stringify(payload),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
    })
      .done(function (data) {
        try {
          ;(data.data?.items || []).forEach(function (item) {
            const key = `${item.id}_${item.language}`
            if (window.CKEDITOR?.instances[key]) {
              window.CKEDITOR.instances[key].setData(item.translation)
            } else {
              $('#' + key).val(item.translation)
            }
          })
          overlay.remove()
        } catch (e) {
          console.log(err)
          alert(self.t.get('error') + ': ' + err)
          overlay.remove()
        }
      })
      .fail(function (err) {
        console.log(err)
        alert(self.t.get('aiApiError') + ': ' + err.statusText)
        overlay.remove()
      })
  },
  addSummarization(fieldName, conf) {
    var self = this
    console.info('Baton:', conf, this.t)
    const field = $(`#id_${fieldName}`)
    const targetLabel = $(`label[for="id_${conf.target}"]`)
    const summarizeButton = $('<a />', { class: 'btn btn-sm btn-secondary mb-2', href: '#' })
      .on('click', function () {
        self.handleSummarization(field, targetLabel, conf)
      })
      .prepend($('<i />', { class: 'fa fa-rocket' }))
      .append($('<span />').text(` ${this.t.get('generateSummary')}: ${targetLabel.text()}`))

    field.after(summarizeButton)
  },
  handleSummarization(field, targetLabel, conf) {
    var self = this
    let content = `
<div>
<label for="words" class="mb-2" style="font-weight: 700">${this.t.get('words')}</label>
<input type="number" name="words" id="${field.attr('id')}_words" value="${conf?.words || 100}" class="form-control" />
</div>
<div class="mt-2">
<label for="words" class="mb-2 d-block" style="font-weight: 700">${this.t.get('useBulletedList')}</label>
<input type="checkbox" name="useBulletedList" id="${field.attr('id')}_useBulletedList" value="1" ${
      conf?.useBulletedList ? 'checked' : ''
    } class="form-check-input" />
</div>
`
    let myModal = new Baton.Modal({
      title: this.t.get('generateSummary') + ' - ' + targetLabel.text(),
      size: 'md',
      actionBtnLabel: this.t.get('generate'),
      actionBtnCb: function () {
        self.summarize(field, conf, myModal)
      },
      content,
    })

    myModal.open()
  },
  summarize: function (field, conf, modal) {
    const targetId = `id_${conf.target}`
    const words = modal.modalObj.find(`#${field.attr('id')}_words`).val()
    if (words === '' || !conf.target) {
      return
    }
    const useBulletedList = modal.modalObj.find(`#${field.attr('id')}_useBulletedList`).is(':checked')

    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'fa fa-spinner fa-spin fa-2x fa-fw' })
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const payload = {
      id: field.attr('id'),
      text: window.CKEDITOR?.instances[field.attr('id')]?.getData() || $(`#${field.attr('id')}`).val(),
      words: parseInt(words),
      useBulletedList: useBulletedList,
      language: conf?.language || this.config.defaultLanguage,
    }
    // use api
    $.ajax({
      url: this.config.ai.summarizeApiUrl,
      method: 'POST',
      data: JSON.stringify(payload),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
    })
      .done(function (data) {
        try {
          if (window.CKEDITOR?.instances[targetId]) {
            window.CKEDITOR.instances[targetId].setData(data.data.summary)
          } else {
            $('#' + targetId).val(data.data.summary)
          }
          overlay.remove()
        } catch (e) {
          console.log(err)
          alert(self.t.get('error') + ': ' + err)
          overlay.remove()
          return null
        }
        modal.close()
        modal.destroy()
      })
      .fail(function (err) {
        overlay.remove()
        alert(self.t.get('aiApiError') + ': ' + err.statusText)
        modal.close()
        modal.destroy()
      })
  },
  addImageGeneration(fieldName) {
    const field = $(`#id_${fieldName}`)

    const generateImageButton = $('<a />', {
      id: `generate-image-${fieldName}`,
      class: 'btn btn-sm btn-secondary mt-1',
      href: '#',
    })
      .prepend($('<i />', { class: 'fa fa-rocket' }))
      .append($('<span />').text(` ${this.t.get('generateImageFromAI')}`))

    field.after(generateImageButton)

    const content = `
        <div>
        <label class="block mb-1" style="font-weight: 700">${this.t.get('fileName')}</label>
        <input class="form-control" id="ai-image-name" value="ai_image" />
        <label class="block mb-1 mt-2" style="font-weight: 700">${this.t.get('aspectRatio')}</label>
        <select class="form-select" id="ai-image-aspect-ratio">
            <option value="1">1:1</option>
            <option value="2">14:8</option>
            <option value="3">8:14</option>
        </select>
        <label class="block mt-2 mb-1" style="font-weight: 700">${this.t.get('describeImageContent')}</label>
        <textarea class="form-control" id="ai-image-description"></textarea>
        <div id="ai-image-preview"></div>
        </div>
        `

    var self = this
    $(generateImageButton).on('click', function () {
      let myModal = new Baton.Modal({
        title: self.t.get('generateImageFromAI'),
        content: content,
        size: 'md',
        actionBtnLabel: self.t.get('generate'),
        actionBtnCb: async function () {
          let prompt = $('#ai-image-description').val()
          let aspectRatio = $('#ai-image-aspect-ratio').val()
          self.generateImage(field, prompt, aspectRatio, function (image) {
            if (!image) {
              alert(self.t.get('imageGenerationError'))
              return
            }
            let imageEl = new Image()
            imageEl.src = `data:image/png;base64,${image}`
            $(imageEl).css({ width: '100%', marginTop: '1rem' })
            $('#ai-image-preview').append(imageEl)
            myModal.modalObj.find('.btn-action').text(self.t.get('useImage'))
            myModal.modalObj.find('.btn-action').off('click')
            myModal.modalObj.find('.btn-action').on('click', function (evt) {
              // base64 data
              const data = `data:image/png;base64,${image}`
              // create a blob object
              const blob = self.dataURItoBlob(data)
              // use the Blob to create a File Object
              const file = new File(
                [blob],
                $('#ai-image-name').val() ? $('#ai-image-name').val() + '.png' : 'image.png',
                { type: 'image/png', lastModified: new Date().getTime() },
              )
              const array_images = [file]

              // modify the input content to be submited
              const input_images = document.querySelector(`#id_${fieldName}`)
              input_images.files = new self.fileListItems(array_images)

              myModal.close()
              myModal.destroy()
            })
          })
        },
      })

      myModal.open()
    })
  },
  generateImage: function (field, prompt, aspectRatio, cb) {
    var self = this
    const csrfToken = $('input[name="csrfmiddlewaretoken"]').val()
    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'fa fa-spinner fa-spin fa-2x fa-fw' })
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const payload = {
      id: field.attr('id'),
      prompt: prompt,
      format: aspectRatio,
    }
    // use api
    return $.ajax({
      url: this.config.ai.generateImageApiUrl,
      method: 'POST',
      data: JSON.stringify(payload),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': csrfToken },
    })
      .done(function (data) {
        cb(data.data.base64Image)
        overlay.remove()
      })
      .fail(function (err) {
        console.log(err)
        alert(self.t.get('imageGenerationError'))
        overlay.remove()
        return null
      })
  },
  dataURItoBlob: function (dataURI) {
    const binary = atob(dataURI.split(',')[1])
    const array = []
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i))
    }
    return new Blob([new Uint8Array(array)], { type: 'image/png' })
  },
  fileListItems(file_objects) {
    const new_input = new ClipboardEvent('').clipboardData || new DataTransfer()
    for (let i = 0, size = file_objects.length; i < size; ++i) {
      new_input.items.add(file_objects[i])
    }
    return new_input.files
  },
  correct: function (field, text) {
    var self = this
    const payload = {
      id: field.attr('id'),
      text,
      language: this.getCorrectionLanguage(field.attr('id')),
    }

    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'fa fa-spinner fa-spin fa-2x fa-fw' })
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // use api
    $.ajax({
      url: this.config.ai.correctApiUrl,
      method: 'POST',
      data: JSON.stringify(payload),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
    })
      .done(function (data) {
        if (data?.data?.text.trim() === text.trim()) {
          const checkIcon = $('<i />', {
            class: 'fa fa-check',
          }).css({ color: 'green', marginTop: '8px', marginLeft: '6px' })
          if (window.CKEDITOR?.instances[$(field).attr('id')]) {
            $(field).parent('.django-ckeditor-widget').after(checkIcon)
          } else {
            $(field).after(checkIcon)
          }
        } else if (data?.data?.text) {
          const decodedText = $('<textarea />').html(text).text().replace(/&nbsp;/g, ' ') // ckeditor
          const diff = Diff.diffChars(decodedText, data?.data?.text)
          // const fragment = $('<div />') // use fragment if escaping all html 

          const diffParts = []
          diff.forEach((part) => {
            // green for additions, red for deletions
            // grey for common parts
            // const color = part.added ? 'green' : part.removed ? 'red' : 'black'
            // const fontWeight = part.added ? '700' : part.removed ? '700' : '400'
            // const span = $('<span />').css({ color: color, fontWeight: fontWeight }).text(part.value)
            // fragment.append(span)
            diffParts.push(part.added 
                ? `<span style="color: green; background: rgba(0, 255, 0, 0.2); padding: 0 3px;">${part.value}</span>`
                : part.removed
                    ? `<span style="color: red; background: rgba(255, 0, 0, 0.2); padding: 0 3px;">${part.value}</span>`
                    : `${part.value}`)
          })
          // const fragmentHtml = fragment[0].outerHTML
          const content = `
<div class="row">
<div class="col-md-4">
<label class="block mt-2 mb-1" style="font-weight: 700">${self.t.get('Original')}</label>
<div>${text}</div>
</div>
<div class="col-md-4">
<label class="block mt-2 mb-1" style="font-weight: 700">${self.t.get('Correction')}</label>
<div>${data.data.text}</div>
</div>
<div class="col-md-4">
<label class="block mt-2 mb-1" style="font-weight: 700">${self.t.get('Diff')}</label>
<div>${diffParts.join('')}</div>
</div>
</div>
`
          let myModal = new Baton.Modal({
            title: self.t.get('Correction'),
            content: content,
            size: 'xl',
            actionBtnLabel: self.t.get('useCorrection'),
            actionBtnCb: function () {
              const fieldId = $(field).attr('id')
              if (window.CKEDITOR?.instances[fieldId]) {
                window.CKEDITOR.instances[fieldId].setData(data.data.text)
              } else {
                $(field).val(data.data.text)
              }
              myModal.close()
              myModal.destroy()
            },
          })

          myModal.open()
        }
        overlay.remove()
      })
      .fail(function (err) {
        overlay.remove()
        console.log(err)
        alert(self.t.get('aiApiError') + ': ' + err.statusText)
      })
  },
  getCorrectionLanguage: function (fieldId) {
    let locale = this.config.defaultLanguage
    this.config.otherLanguages.forEach(function (lng) {
      const re = new RegExp(`_${lng}$`)
      if (fieldId.match(re)) {
        locale = lng
      }
    })
    return locale
  },
  isEnabledCorrectionField: function (field) {
    for (let selector of this.config.ai.correctionSelectors) {
      if ($(field).is(selector)) {
        return true
      }
    }
    return false
  },
  activateCorrections: function () {
    var self = this
    // check if form has fields that need translation
    $('label[for]').each(function () {
      const fieldId = $(this).attr('for')
      const field = $(`#${fieldId}`)

      if (
        window.CKEDITOR?.instances[fieldId] ||
        self.isEnabledCorrectionField(field)
      ) {
        const icon = $('<a class="fa-solid fa-spell-check me-2 text-decoration-none" href="javascript:void(0)"></a>')
        icon.on('click', function () {
          let text
          if (window.CKEDITOR?.instances[fieldId]) {
            text = window.CKEDITOR?.instances[fieldId]?.getData()
          } else if (field.attr('type') === 'text' || field.prop('tagName') === 'TEXTAREA') {
            text = $(field).val()
          }
          if (text) {
            self.correct($(field), text)
          }
        })
        $(this).prepend(icon)
      }
    })
    $(this.config.ai.correctionSelectors.join(', ')).on('click', function (evt) {
      if (evt.ctrlKey) {
        const field = $(this)
        const fieldId = field.attr('id')
        let text
        if (window.CKEDITOR?.instances[fieldId]) {
          text = window.CKEDITOR?.instances[fieldId]?.getData()
        } else if (field.attr('type') === 'text' || field.prop('tagName') === 'TEXTAREA') {
          text = $(field).val()
        }
        if (text) {
          self.correct($(field), text)
        }
      }
    })
  },
}

export default AI
