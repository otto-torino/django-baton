import $ from 'jquery'

const AdminDocs = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function () {
    const container = $('<div />', { class: 'admindocs-body' })
    // Django >= 6.1 wraps the title in .titles-and-tools
    container.append($('#content > *:not(h1):not(.titles-and-tools):not(.breadcrumbs)')).appendTo($('#content'))
  },
}

export default AdminDocs
