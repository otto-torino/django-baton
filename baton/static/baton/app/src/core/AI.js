import 'regenerator-runtime/runtime'
import $ from 'jquery'
import Translator from './i18n'
const Diff = require('diff')

const AI = {
  editorFields: [],
  /**
   * AI component
   *
   * Automatic translations
   */
  init: function (config, page) {
    this.t = new Translator($('html').attr('lang'))
    this.config = config
    this.editorFields = this.getEditorFields()
    if (config.ai.enableTranslations && (page === 'change_form' || page === 'add_form')) {
      this.activateTranslations()
    }
    if (config.ai.enableCorrections && (page === 'change_form' || page === 'add_form')) {
      this.activateCorrections()
    }
  },
  decodeHtml(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  },
  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
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
      .prepend($('<span class="material-symbols-outlined">translate</span>'))
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
    const self = this
    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const payload = []
    let fieldsIds = $(`[id$=_${this.config.defaultLanguage}]`)
      .filter((_, el) => !$(el).attr('id').includes('__prefix__'))
      .filter((_, el) => $(el).val() !== '')
      .toArray()
      .map((el) => $(el).attr('id'))
    this.editorFields.forEach(function (fieldId) {
      if (
        !fieldId.includes('__prefix__') &&
        fieldId.includes(`_${self.config.defaultLanguage}`) &&
        self.getEditorFieldValue(fieldId) !== ''
      ) {
        fieldsIds.push(fieldId)
      }
    })
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
        const html = self.getEditorFieldValue(`${baseId}_${self.config.defaultLanguage}`)
        payload.push({
          text: html ? self.decodeHtml(html) : $(`#${baseId}_${self.config.defaultLanguage}`).val(),
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
      data: JSON.stringify({
        items: payload,
        model: this.config.ai.translationsModel,
      }),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
    })
      .done(function (data) {
        try {
          ;(data.data?.items || []).forEach(function (item) {
            const key = `${item.id}_${item.language}`
            if (!self.setEditorFieldValue(key, item.translation)) {
              $('#' + key).val(item.translation)
            }
          })
          overlay.remove()
        } catch (err) {
          console.log(err)
          alert(self.t.get('error') + ': ' + err)
          overlay.remove()
        }
      })
      .fail(function (err) {
        console.log(err)
        alert(self.t.get('aiApiError') + ': ' + (err.responseJSON?.data?.message || err.statusText))
        overlay.remove()
      })
  },
  addVision(fieldSelector, conf) {
    const self = this
    const fields = $(fieldSelector)

    fields.each(function (_, f) {
      const field = $(f)
      let target = null
      const id = field.attr('id')
      // inline?
      const lastDash = id.lastIndexOf('-')
      if (lastDash !== -1) {
        const prefix = id.substr(0, lastDash)
        target = $('#' + prefix + '-' + conf.target)
      } else {
        target = $('#id_' + conf.target)
      }
      const targetLabel = $(`label[for="${target.attr('id')}"]`)
      targetLabel.find('.material-symbols-outlined').remove()
      const visionButton = $('<a />', { class: 'btn btn-sm btn-primary me-2 mt-1', href: '#' })
        .on('click', function () {
          self.handleVision(field, conf)
        })
        .prepend($('<span class="material-symbols-outlined">eyeglasses</span>'))
        .append(
          $('<span />').text(
            ` ${self.t.get('generateAltText')}${targetLabel ? ': ' + targetLabel.text().replace(':', '') : ''}`,
          ),
        )
      field.after($('<div />').append(visionButton))
    })
  },
  handleVision: async function (f, conf) {
    const self = this
    if (!conf.target) {
      return
    }

    const field = $(f)
    let target = null
    const id = field.attr('id')
    // inline?
    const lastDash = id.lastIndexOf('-')
    if (lastDash !== -1) {
      const prefix = id.substr(0, lastDash)
      target = $('#' + prefix + '-' + conf.target)
    } else {
      target = $('#id_' + conf.target)
    }

    const targetId = target.attr('id')
    const chars = conf?.chars || 100

    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    const relativePath = $(field).parent().find('a').attr('data-url') || $(field).parent().find('a').attr('href')

    let url
    if ($(field).prop('files').length > 0) {
      const file = $(field).prop('files')[0]
      url = await this.getBase64(file)
    } else if (relativePath !== '#') {
      url = window.location.origin + relativePath
    }

    const payload = {
      id: field.attr('id'),
      url: url,
      chars: parseInt(chars),
      language: conf?.language || this.config.defaultLanguage,
      model: self.config.ai.visionModel,
    }
    // use api
    $.ajax({
      url: this.config.ai.visionApiUrl,
      method: 'POST',
      data: JSON.stringify(payload),
      dataType: 'json',
      contentType: 'application/json',
      headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
    })
      .done(function (data) {
        try {
          $('#' + targetId).val(data.data.description)
          overlay.remove()
        } catch (err) {
          console.log(err)
          alert(self.t.get('error') + ': ' + err)
          overlay.remove()
          return null
        }
      })
      .fail(function (err) {
        console.log(err)
        overlay.remove()
        alert(self.t.get('aiApiError') + ': ' + (err.responseJSON?.data?.message || err.statusText))
      })
  },
  addSummarization(fieldName, conf) {
    const self = this
    const field = $(`#id_${fieldName}`)
    const targetLabel = $(`label[for="id_${conf.target}"]`)
    targetLabel.find('.material-symbols-outlined').remove()
    const summarizeButton = $('<a />', { class: 'btn btn-sm btn-primary mb-2', href: '#' })
      .on('click', function () {
        self.handleSummarization(field, targetLabel, conf)
      })
      .prepend($('<span class="material-symbols-outlined">summarize</span>'))
      .append($('<span />').text(` ${this.t.get('generateSummary')}: ${targetLabel.text().replace(':', '')}`))

    field.after($('<div />').append(summarizeButton))
  },
  handleSummarization(field, targetLabel, conf) {
    const self = this
    const content = `
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
    const myModal = new Baton.Modal({
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
    const self = this
    const targetId = `id_${conf.target}`
    const words = modal.modalObj.find(`#${field.attr('id')}_words`).val()
    if (words === '' || !conf.target) {
      return
    }
    const useBulletedList = modal.modalObj.find(`#${field.attr('id')}_useBulletedList`).is(':checked')

    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const html = this.getEditorFieldValue(field.attr('id'))
    const payload = {
      id: field.attr('id'),
      text: html ? this.decodeHtml(html) : $(`#${field.attr('id')}`).val(),
      words: parseInt(words),
      useBulletedList: useBulletedList,
      language: conf?.language || this.config.defaultLanguage,
      model: self.config.ai.summarizationsModel,
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
          if (!self.setEditorFieldValue(targetId, data.data.summary)) {
            $('#' + targetId).val(data.data.summary)
          }
          overlay.remove()
        } catch (err) {
          console.log(err)
          alert(self.t.get('error') + ': ' + err)
          overlay.remove()
          return null
        }
        modal.close()
        modal.destroy()
      })
      .fail(function (err) {
        console.log(err)
        overlay.remove()
        alert(self.t.get('aiApiError') + ': ' + (err.responseJSON?.data?.message || err.statusText))
        modal.close()
        modal.destroy()
      })
  },
  addImageGeneration(fieldName) {
    const field = $(`#id_${fieldName}`)

    const generateImageButton = $('<a />', {
      id: `generate-image-${fieldName}`,
      class: 'btn btn-sm btn-primary mt-1',
      href: '#',
    })
      .prepend($('<span class="material-symbols-outlined">image</span>'))
      .append($('<span />').text(` ${this.t.get('generateImageFromAI')}`))

    field.after($('<div />').append(generateImageButton))

    const content = `
        <div>
        <label class="block mb-1" style="font-weight: 700">${this.t.get('fileName')}</label>
        <input class="form-control" id="ai-image-name" value="ai_image" />
        <label class="block mb-1 mt-2" style="font-weight: 700">${this.t.get('aspectRatio')}</label>
        <select class="form-select" id="ai-image-aspect-ratio">
            <option value="1">1024x1024</option>
            <option value="2">1792x1024</option>
            <option value="3">1024:1792</option>
        </select>
        <label class="block mt-2 mb-1" style="font-weight: 700">${this.t.get('describeImageContent')}</label>
        <textarea class="form-control" id="ai-image-description"></textarea>
        <div id="ai-image-preview"></div>
        </div>
        `

    const self = this
    $(generateImageButton).on('click', function () {
      const myModal = new Baton.Modal({
        title: self.t.get('generateImageFromAI'),
        content: content,
        size: 'md',
        actionBtnLabel: self.t.get('generate'),
        actionBtnCb: async function () {
          const prompt = myModal.modalObj.find('#ai-image-description').val()
          const aspectRatio = myModal.modalObj.find('#ai-image-aspect-ratio').val()
          self.generateImage(field, prompt, aspectRatio, function (image) {
            if (!image) {
              alert(self.t.get('imageGenerationError'))
              return
            }
            const imageEl = new Image()
            imageEl.src = `data:image/png;base64,${image}`
            $(imageEl).css({ width: '100%', marginTop: '1rem' })
            myModal.modalObj.find('#ai-image-preview').append(imageEl)
            myModal.modalObj.find('.btn-action').text(self.t.get('useImage'))
            myModal.modalObj.find('.btn-action').off('click')
            myModal.modalObj.find('.btn-action').on('click', function (evt) {
              // base64 data
              const data = `data:image/png;base64,${image}`
              // create a blob object
              const blob = self.dataURItoBlob(data)
              // use the Blob to create a File Object
              const imageName = myModal.modalObj.find('#ai-image-name').val()
              const file = new File([blob], imageName ? imageName + '.png' : 'image.png', {
                type: 'image/png',
                lastModified: new Date().getTime(),
              })
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
    const self = this
    const csrfToken = $('input[name="csrfmiddlewaretoken"]').val()
    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
    $('<div />').append($('<p />').append(spinner)).appendTo(overlay)

    // retrieve necessary translations
    const payload = {
      id: field.attr('id'),
      prompt: prompt,
      format: aspectRatio,
      model: self.config.ai.imagesModel,
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
        alert(self.t.get('imageGenerationError') + ': ' + (err.responseJSON?.data?.message || err.statusText))
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
    const self = this
    const payload = {
      id: field.attr('id'),
      text,
      language: this.getCorrectionLanguage(field.attr('id')),
      model: self.config.ai.correctionsModel,
    }

    // spinner
    const overlay = $('<div />', { class: 'spinner-overlay' }).appendTo(document.body)
    const spinner = $('<i />', { class: 'material-symbols-outlined icon-spin' }).text('progress_activity')
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
            class: 'material-symbols-outlined',
          })
            .text('check')
            .css({ color: 'green', marginTop: '8px', marginLeft: '6px' })
          if (!self.setEditorFieldCorrect($(field).attr('id'), checkIcon)) {
            $(field).after(checkIcon)
          }
        } else if (data?.data?.text) {
          const diff = Diff.diffChars(text, data?.data?.text)
          // const fragment = $('<div />') // use fragment if escaping all html

          const diffParts = []
          diff.forEach((part) => {
            // green for additions, red for deletions
            // grey for common parts
            // const color = part.added ? 'green' : part.removed ? 'red' : 'black'
            // const fontWeight = part.added ? '700' : part.removed ? '700' : '400'
            // const span = $('<span />').css({ color: color, fontWeight: fontWeight }).text(part.value)
            // fragment.append(span)
            diffParts.push(
              part.added
                ? `<span style="color: green; background: rgba(0, 255, 0, 0.2); padding: 0 3px;">${part.value}</span>`
                : part.removed
                  ? `<span style="color: red; background: rgba(255, 0, 0, 0.2); padding: 0 3px;">${part.value}</span>`
                  : `${part.value}`,
            )
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
          const myModal = new Baton.Modal({
            title: self.t.get('Correction'),
            content: content,
            size: 'xl',
            actionBtnLabel: self.t.get('useCorrection'),
            actionBtnCb: function () {
              const fieldId = $(field).attr('id')
              if (!self.setEditorFieldValue(fieldId, data.data.text)) {
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
        console.log(err)
        overlay.remove()
        alert(self.t.get('aiApiError') + ': ' + (err.responseJSON?.data?.message || err.statusText))
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
    for (const selector of this.config.ai.correctionSelectors) {
      if ($(field).is(selector)) {
        return true
      }
    }
    return false
  },
  activateCorrections: function () {
    const self = this
    // check if form has fields that need translation
    $('label[for]').each(function () {
      const fieldId = $(this).attr('for')
      const field = $(`#${fieldId}`)

      if (self.editorFields.includes(fieldId) || self.isEnabledCorrectionField(field)) {
        const icon = $('<a class="material-symbols-outlined" href="javascript:void(0)">spellcheck</a>')
        icon.on('click', function () {
          let text
          if (self.editorFields.includes(fieldId)) {
            text = self.decodeHtml(self.getEditorFieldValue(fieldId))
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
        if (self.editorFields.includes(fieldId)) {
          text = self.getEditorFieldValue(fieldId)
        } else if (field.attr('type') === 'text' || field.prop('tagName') === 'TEXTAREA') {
          text = $(field).val()
        }
        if (text) {
          self.correct($(field), text)
        }
      }
    })
  },
  // hooks
  // Get editor fields, should return a list fields ids
  getEditorFields: function () {
    if (this.getEditorFieldsHook) {
      return this.getEditorFieldsHook()
    }

    return window.CKEDITOR ? Object.keys(window.CKEDITOR.instances) : []
  },
  // Given a field id return the field value and null or undefined if field id is not an editor field
  getEditorFieldValue: function (fieldId) {
    if (this.getEditorFieldValueHook) {
      return this.getEditorFieldValueHook(fieldId)
    }
    return window.CKEDITOR?.instances[fieldId]?.getData()
  },
  // Given a field id and a new value should set the editor field value if it exists and return true, false otherwise
  setEditorFieldValue: function (fieldId, value) {
    if (this.setEditorFieldValueHook) {
      return this.setEditorFieldValueHook(fieldId, value)
    }
    if (window.CKEDITOR?.instances[fieldId]) {
      window.CKEDITOR.instances[fieldId].setData(value)
      return true
    }
    return false
  },
  // Given a field id should render the given icon to indicate the field is correct if it exists and return true, false otherwise
  setEditorFieldCorrect: function (fieldId, icon) {
    if (this.setEditorFieldCorrectHook) {
      return this.setEditorFieldCorrectHook(fieldId, icon)
    }
    if (window.CKEDITOR?.instances[fieldId]) {
      $(`#${fieldId}`).parent('.django-ckeditor-widget').after(icon)
      return true
    }
    return false
  },
}

export default AI
