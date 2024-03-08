import $ from 'jquery'
import Translator from './i18n'

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
    const fieldsIds = $(`[id$=_${this.config.defaultLanguage}]`)
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
              window.CKEDITOR.instances[key].insertText(item.translation)
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
      .fail(function () {
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
    const words = $(`#${field.attr('id')}_words`).val()
    if (words === '' || !conf.target) {
      return
    }
    const useBulletedList = $(`#${field.attr('id')}_useBulletedList`).is(':checked')

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
            window.CKEDITOR.instances[targetId].setData('', {
              callback: function () {
                window.CKEDITOR.instances[targetId].insertText(data.data.summary)
              },
            })
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
      .fail(function () {
        overlay.remove()
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
          self.generateImage(field, prompt, function (image) {
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
  generateImage: function (field, prompt, cb) {
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
}

export default AI
