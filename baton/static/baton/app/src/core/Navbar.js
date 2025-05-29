import $ from 'jquery'
import Translator from './i18n'

const Navbar = {
  /**
   * Navbar component
   *
   * Adds a menu toggler for mobile and does some styling
   */
  init: function (config) {
    this.t = new Translator($('html').attr('lang'))
    this.menuAlwaysCollapsed = config.menuAlwaysCollapsed
    this.fixNodes(config)
  },
  fixNodes: function (config) {
    if (!this.menuAlwaysCollapsed) {
      $('#header').addClass('expand')
    } else {
      $('body').addClass('baton-menu-always-collapsed')
      $('#header').addClass('menu-always-collapsed')
      $('#content').css('min-height', `calc(100vh - ${$('#header').outerHeight()}px)`)
    }
    // insert burger
    $('#branding').before(
      $('<button/>', {
        class: 'navbar-toggler navbar-toggler-right',
        'data-bs-toggle': 'collapse',
      })
        .html('<i class="material-symbols-outlined" style="font-size: 36px">menu_open</i>')
        .click(() => $(document.body).addClass('menu-open')),
    )
    // remove only text
    $('#user-tools')
      .contents()
      .filter(function () {
        return this.nodeType === 3
      })
      .remove()
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
        .on('click', function () {
          $('#logout-form').submit()
        })
        .appendTo(dropdownMenu)
    }

    if (!config.forceTheme) {
      let self = this
      const currentTheme = $('html').attr('data-bs-theme')
      const themeToggler = $('<a />', { class: 'dropdown-item dropdown-item-theme' })
        .html(currentTheme === 'dark' ? this.t.get('lightTheme') : this.t.get('darkTheme'))
        .css('cursor', 'pointer')
        .click(function () {
          const currentTheme = $('html').attr('data-bs-theme')
          $('hmtl').attr('data-theme', currentTheme === 'dark' ? 'light' : 'dark')
          $('html').attr('data-bs-theme', currentTheme === 'dark' ? 'light' : 'dark')
          $(this).html(currentTheme === 'dark' ? self.t.get('darkTheme') : self.t.get('lightTheme'))
          localStorage.setItem('baton-theme', currentTheme === 'dark' ? 'light' : 'dark')
        })
      if (dropdownMenu.find('.dropdown-item-theme').length === 0) {
        dropdownMenu.append(themeToggler)
      }
    }
  },
}

export default Navbar
