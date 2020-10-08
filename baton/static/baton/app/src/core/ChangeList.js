import $ from 'jquery'
import Translator from './i18n'

let ChangeList = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this._filtersDiv = $('#changelist-filter')
    this.t = new Translator($('html').attr('lang'))
    this.filtersInModal = opts.changelistFiltersInModal
    this.filtersAlwaysOpen = opts.changelistFiltersAlwaysOpen
    if (this._filtersDiv.length) {
      this.activate()
    }
  },
  activate: function () {
    if (this.filtersAlwaysOpen) {
      $(document.body).addClass('changelist-filter-active changelist-filter-always-open')
    } else {
      // filters active?
      let _activeFilters = /__[^=]+=/.test(location.search)
      // actions ?
      let _activeActions = $('#changelist-form > .actions').length !== 0
      let _changelistForm = $('#changelist-form')
      let _filtersToggler = $('<a />', {
        class:
          'btn btn-info changelist-filter-toggler' +
          (_activeFilters ? ' active' : '') + (_activeActions ? ' with-actions' : '')
      })
        .html('<i class="fa fa-filter"></i> <span>' + this.t.get('filter') + '</span>')

      if (this.filtersInModal) {
        $('#changelist-filter').prop('id', 'changelist-filter-modal')
        this.modal = this.createModal()
        _filtersToggler
          .click(() => {
            this.modal.modal('toggle')
          })
      } else {
        _filtersToggler
          .click(() => {
            $(document.body).toggleClass('changelist-filter-active')
            if (parseInt(this._filtersDiv.css('max-width')) === 100) {
              $('html,body').animate({ scrollTop: this._filtersDiv.offset().top })
            }
          })
      }
      _changelistForm.prepend(_filtersToggler)
    }
    if (/_popup=1/.test(location.href)) {
      $('#changelist-form .results').css('padding-top', '78px')
    }
  },
  createModal: function () {
    let modal = $('<div />', { 'class': 'modal' })
    let modalContent = `
<div class="modal-dialog modal-dialog-centered" role="document">
  <div class="modal-content">
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-dismiss="modal">${this.t.get('close')}</button>
    </div>
  </div>
</div>
    `
    modal.html(modalContent)
    modal.find('.modal-content').prepend($('#changelist-filter-modal'))
    let title = modal.find('#changelist-filter-modal > h2')
    modal.find('.modal-content').prepend(title.addClass('modal-header').css('margin-bottom', 0))
    return modal
  }
}

export default ChangeList
