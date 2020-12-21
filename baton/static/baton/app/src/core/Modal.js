import $ from 'jquery'
import Translator from './i18n'

class Modal {
  constructor (config) {
    this.t = new Translator($('html').attr('lang'))

    this.opts = {
      subtitle: '',
      hideFooter: false,
      showBackBtn: false,
      backBtnCb: function () {},
      actionBtnLabel: this.t.get('save'),
      actionBtnCb: null,
      onUrlLoaded: function () {},
      size: 'lg',
      onClose: function () {}
    }

    this.isOpen = false
    this.modal = this.create()
    this.update(config)
  }

  create () {
    let modal = $('<div />', {'class': 'modal fade'}).appendTo(document.body)
    modal.html(`
      <div class="modal-dialog" role="document">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 class="modal-title"></h5>
                  <div style="display: flex;">
                      <button type="button" class="back me-1" aria-label="Back">
                          <i class="fa fa-angle-left"></i>
                      </button>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
              </div>
              <div class="modal-body">
              </div>
              <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.t.get('close')}</button>
                  <button type="button" class="btn btn-primary btn-action"></button>
              </div>
          </div><!-- /.modal-content -->
      </div><!-- /.modal-dialog -->
    `)

    return modal
  }

  update (config) {
    this.options = $.extend({}, this.opts, config)
    this.setEvents()
    this.setSize()
    this.setHeader()
    this.setTitle()
    this.setSubtitle()
    this.setContent()
    this.setButtons()
  }

  setEvents () {
    var self = this
    this.modal.on('hidden.bs.modal', function () {
      self.close()
    })
  }

  setSize () {
    this.modal.find('.modal-dialog').addClass('modal-' + this.options.size)
  }

  setHeader () {
    if (this.options.showBackBtn) {
      this.modal.find('.modal-header .back').show()
      this.modal
        .find('.modal-header .back')
        .on('click', this.options.backBtnCb)
    } else {
      this.modal.find('.modal-header .back').hide()
    }
  }

  setTitle () {
    if (typeof this.options.title !== 'undefined') {
      this.modal.find('.modal-title').html(this.options.title)
    }
  }

  setSubtitle () {
    if (this.options.subtitle) {
      this.modal
        .find('.modal-subtitle')
        .show()
        .html(this.options.subtitle)
    } else {
      this.modal
        .find('.modal-subtitle')
        .hide()
        .html('')
    }
  }

  setContent () {
    var self = this
    if (typeof this.options.url !== 'undefined') {
      this.method = 'request'
      $.get(this.options.url, function (response) {
        self.modal.find('.modal-body').html(response)
        self.options.onUrlLoaded(self)
      })
    } else if (this.options.content instanceof jQuery) {
      self.modal.find('.modal-body').append(this.options.content)
    } else if (typeof this.options.content !== 'undefined') {
      self.modal.find('.modal-body').html(this.options.content)
    }
  };

  setButtons () {
    if (this.options.hideFooter) {
      this.modal.find('.modal-footer').hide()
    } else {
      if (this.options.actionBtnCb) {
        this.modal.find('.btn-action').text(this.options.actionBtnLabel)
        this.modal.find('.btn-action').on('click', this.options.actionBtnCb)
      } else {
        this.modal.find('.btn-action').hide()
      }
    }
  }

  open () {
    if (this.isOpen) {
      return
    }
    this.toggle()
    this.isOpen = true
  }

  toggle () {
    this.modal.modal(this.isOpen ? 'hide' : 'show')
    this.isOpen = !this.isOpen
  }

  close () {
    if (!this.isOpen) {
      return
    }

    this.modal.modal('hide')
    this.options.onClose()
    this.isOpen = false
  }
}

export default Modal
