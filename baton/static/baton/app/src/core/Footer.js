import $ from 'jquery'

let Footer = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function (opts) {
    $('#footer').appendTo('#content')
    if (opts.remove) {
      $('#footer').remove()
    }
  }
}

export default Footer
