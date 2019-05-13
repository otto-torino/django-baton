import $ from 'jquery'
import { copyTextToClipboard } from 'core/Utils'

let Filer = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this.fixIcons()
    this.fixCopyToClipboard()
  },
  fixIcons: function () {
    $('.fa-pencil').addClass('fa-pencil-alt')
  },
  fixCopyToClipboard: function () {
    let copyBtns = $('.action-button .fa-link')
    copyBtns.on('click', function (evt) {
      evt.preventDefault()
      copyTextToClipboard($(this).parent('.action-button').next('.action-button').attr('href'))
    })
  }
}

export default Filer
