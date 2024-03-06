import $ from 'jquery'
import Translator from './i18n'

const AI = {
    /**
     * AI component
     *
     * Automatic translations
     */
    init: function(config, page) {
        this.config = config
        if (config.ai.enableTranslations && (page === 'change_form' || page === 'add_form')) {
            this.activateTranslations()
        }
    },
    activateTranslations: function() {
        this.t = new Translator($('html').attr('lang'))
        const translateButton = $('<a />', { id: 'translate-tool', href: '#' })
            .on('click', this.translate.bind(this))
            .prepend($('<i />', { class: 'fa fa-language' }))
            .append($('<span />').text(` ${this.t.get('translate')}`))
        $('ul.object-tools').prepend($('<li />').append(translateButton))
    },
    translate: function() {
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
        fieldsIds.each(function(_, el) {
            const re = new RegExp(`_${self.config.defaultLanguage}`)
            const baseId = $(el).attr('id').replace(re, '')
            const missing = []
            self.config.otherLanguages.forEach(function(lng) {
                if ($(`#${baseId}_${lng}`).val() === '') {
                    missing.push(lng)
                }
            })
            if (missing.length > 0) {
                payload.push({
                    text: window.CKEDITOR?.instances[`${baseId}_${self.config.defaultLanguage}`]?.getData() || $(`#${baseId}_${self.config.defaultLanguage}`).val(),
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
            .done(function(data) {
                try {
                    ; (data.data?.items || []).forEach(function(item) {
                        const key = `${item.id}_${item.language}`
                        if (window.CKEDITOR?.instances[key]) {
                            window.CKEDITOR.instances[key].insertText(item.translation)
                        } else {
                            $('#' + key).val(item.translation)
                        }
                    })
                    overlay.remove()
                } catch (e) {
                    overlay.remove()
                }
            })
            .fail(function() {
                overlay.remove()
            })
    },
}

export default AI
