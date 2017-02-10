import $ from 'jquery'

let Footer = {
  /**
   * Footer component
   *
   * Moves the footer inside the main external container
   */
  init: function () {
    $('#footer').appendTo('#content')
  }
}

export default Footer
