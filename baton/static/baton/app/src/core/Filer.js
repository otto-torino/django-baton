import $ from 'jquery'
import { copyTextToClipboard } from './Utils'

const Filer = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (_) {
    this.fixIcons()
    this.fixCopyToClipboard()
  },
  fixIcons: function () {
    $('.fa-pencil').addClass('fa-pencil-alt')
  },
  fixCopyToClipboard: function () {
    const copyBtns = $('.action-button .fa-link')
    copyBtns.on('click', function (evt) {
      evt.preventDefault()
      let link = $(this).parent('.action-button').attr('href')
      if (!link) {
        link = $(this).parent('.action-button').next('.action-button').attr('href')
      }
      copyTextToClipboard(link)
    })
  },
}

export default Filer
