import $ from 'jquery'

let AdminDocs = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function (opts) {
    let container = $('<div />', {'class': 'admindocs-body'})
    container.append($('#content > *:not(h1):not(.breadcrumbs)')).appendTo($('#content'))
  }
}

export default AdminDocs
