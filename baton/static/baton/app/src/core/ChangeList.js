import $ from 'jquery'
import Translator from 'core/i18n'

let ChangeList = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this._filtersDiv = $('#changelist-filter')
    this.t = new Translator($('html').attr('lang'))
    if (this._filtersDiv.length) {
      this.activate()
    }
  },
  activate: function () {
    // filters active?
    let _activeFilters = /__[^=]+=/.test(location.search)
    let _changelistForm = $('#changelist-form')
    let _filtersToggler = $('<a />', {
      class:
        'btn btn-info changelist-filter-toggler' +
        (_activeFilters ? ' active' : '')
    })
      .html('<i class="fa fa-filter"></i> <span>' + this.t.get('filter') + '</span>')
      .click(() => {
        $(document.body).toggleClass('changelist-filter-active')
        if (parseInt(this._filtersDiv.css('max-width')) === 100) {
          $('html,body').animate({ scrollTop: this._filtersDiv.offset().top })
        }
      })
    _changelistForm.prepend(_filtersToggler)
    if (/_popup=1/.test(location.href)) {
      $('#changelist-form .results').css('padding-top', '78px')
    }
  }
}

export default ChangeList
