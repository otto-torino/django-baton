import $ from 'jquery'

let Navbar = {
  /**
   * Navbar component
   *
   * Adds a menu toggler for mobile and does some styling
   */
  init: function () {
    this.fixNodes()
  },
  fixNodes: function () {
    // insert burger
    $('#branding').before(
      $('<button/>', {
        'class': 'navbar-toggler navbar-toggler-right',
        'data-toggle': 'collapse'
      }).html('<i class="fa fa-bars"></i>')
        .click(() => $(document.body).addClass('menu-open')))
    // remove only text
    $('#user-tools')
      .contents().filter(function () {
        return (this.nodeType === 3)
      }).remove()
    // dropdown
    let dropdown = $('<div/>', { 'class': 'dropdown' }).appendTo($('#user-tools'))
    let dropdownMenu = $('<div/>', { 'class': 'dropdown-menu dropdown-menu-right' }).appendTo(dropdown)
    $('#user-tools strong')
      .addClass('dropdown-toggle btn btn-default')
      .attr('data-toggle', 'dropdown')
      .prependTo(dropdown)
    // @TODO find a way to mv view site from dropdown
    // password change view doesn't have it so breaks things
    $('#user-tools  > a').addClass('dropdown-item').appendTo(dropdownMenu)
  }
}

export default Navbar
