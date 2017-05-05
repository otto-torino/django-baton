import $ from 'jquery'

let ChangeList = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this._filtersDiv = $('#changelist-filter')
    if (this._filtersDiv.length) {
      this.activate()
    }
  },
  activate: function () {
    // filters active?
    let _activeFilters = /__[^=]+=/.test(location.search)
    let _changelistForm = $('#changelist-form')
    let _filtersToggler = $('<a />', {
      'class': 'fa fa-filter changelist-filter-toggler' + (_activeFilters ? ' active' : '')
    }).click(() => {
      $(document.body).toggleClass('changelist-filter-active')
      if (parseInt(this._filtersDiv.css('max-width')) === 100) {
        $('html,body').animate({scrollTop: this._filtersDiv.offset().top})
      }
    })
    _changelistForm.prepend(_filtersToggler)
  }
}

export default ChangeList
