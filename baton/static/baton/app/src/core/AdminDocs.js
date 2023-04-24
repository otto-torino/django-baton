import $ from 'jquery'

const AdminDocs = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function () {
    const container = $('<div />', { class: 'admindocs-body' })
    container.append($('#content > *:not(h1):not(.breadcrumbs)')).appendTo($('#content'))
  },
}

export default AdminDocs
