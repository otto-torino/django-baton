import $ from 'jquery'
import Translator from './i18n'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'

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
    this.create() // adds modal, modalObj and events
    this.update(config)
  }

  create () {
    this.modalObj = $('<div />', {'class': 'modal fade'}).appendTo(document.body)
    this.modalObj.html(`
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

    var self = this
    this.modalObj.on('hidden.bs.modal', function () {
      self.close()
    })

    this.modal = new bootstrap.Modal(this.modalObj[0])
  }

  update (config) {
    this.options = $.extend({}, this.opts, config)
    this.setSize()
    this.setHeader()
    this.setTitle()
    this.setSubtitle()
    this.setContent()
    this.setButtons()
  }

  setSize () {
    this.modalObj.find('.modal-dialog').addClass('modal-' + this.options.size)
  }

  setHeader () {
    if (this.options.showBackBtn) {
      this.modalObj.find('.modal-header .back').show()
      this.modalObj
        .find('.modal-header .back')
        .on('click', this.options.backBtnCb)
    } else {
      this.modalObj.find('.modal-header .back').hide()
    }
  }

  setTitle () {
    if (typeof this.options.title !== 'undefined') {
      this.modalObj.find('.modal-title').html(this.options.title)
    }
  }

  setSubtitle () {
    if (this.options.subtitle) {
      this.modalObj
        .find('.modal-subtitle')
        .show()
        .html(this.options.subtitle)
    } else {
      this.modalObj
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
        self.modalObj.find('.modal-body').html(response)
        self.options.onUrlLoaded(self)
      })
    } else if (this.options.content instanceof jQuery) {
      self.modalObj.find('.modal-body').append(this.options.content)
    } else if (typeof this.options.content !== 'undefined') {
      self.modalObj.find('.modal-body').html(this.options.content)
    }
  };

  setButtons () {
    if (this.options.hideFooter) {
      this.modalObj.find('.modal-footer').hide()
    } else {
      if (this.options.actionBtnCb) {
        this.modalObj.find('.btn-action').text(this.options.actionBtnLabel)
        this.modalObj.find('.btn-action').on('click', this.options.actionBtnCb)
      } else {
        this.modalObj.find('.btn-action').hide()
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
    this.modal[this.isOpen ? 'hide' : 'show']()
    this.isOpen = !this.isOpen
  }

  close () {
    if (!this.isOpen) {
      return
    }

    this.modal.hide()
    this.options.onClose()
    this.isOpen = false
  }
}

export default Modal
