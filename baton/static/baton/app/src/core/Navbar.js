import $ from 'jquery'

const Navbar = {
  /**
   * Navbar component
   *
   * Adds a menu toggler for mobile and does some styling
   */
  init: function (config) {
    this.menuAlwaysCollapsed = config.menuAlwaysCollapsed
    this.fixNodes()
  },
  fixNodes: function () {
    if (!this.menuAlwaysCollapsed) {
      $('#header').addClass('expand')
    } else {
      $('#header').addClass('menu-always-collapsed')
    }
    // insert burger
    $('#branding').before(
      $('<button/>', {
        class: 'navbar-toggler navbar-toggler-right',
        'data-bs-toggle': 'collapse'
      }).html('<i class="fa fa-bars"></i>')
        .click(() => $(document.body).addClass('menu-open')))
    // remove only text
    $('#user-tools')
      .contents().filter(function () {
        return (this.nodeType === 3)
      }).remove()
    // dropdown
    const dropdown = $('<div/>', { class: 'dropdown' }).appendTo($('#user-tools'))
    const dropdownMenu = $('<div/>', { class: 'dropdown-menu dropdown-menu-right' }).appendTo(dropdown)
    $('#user-tools strong')
      .addClass('dropdown-toggle btn btn-default')
      .attr('data-bs-toggle', 'dropdown')
      .prependTo(dropdown)
    // @TODO find a way to mv view site from dropdown
    // password change view doesn't have it so breaks things
    $('#user-tools  > a').addClass('dropdown-item').appendTo(dropdownMenu)

    // django 4.1 logout form
    if ($('#logout-form').length) {
      $('#logout-form button').css('display', 'none')
      $('<a />', { class: 'dropdown-item', 'data-item': 'logout' })
        .html($('#logout-form button').html())
        .on('click', function () { $('#logout-form').submit() })
        .appendTo(dropdownMenu)
    }
  }
}

export default Navbar
