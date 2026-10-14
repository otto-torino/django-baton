import $ from 'jquery'

const Footer = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function (opts) {
    // the language form is submitted on change here and not by an inline handler, which a CSP would block
    $('form[data-baton-language-switcher] select').on('change', function () {
      this.form.submit()
    })
    $('#footer').appendTo('#content')
    if (opts.remove) {
      $('#footer').remove()
    }
  },
}

export default Footer
