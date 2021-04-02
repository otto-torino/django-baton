import $ from 'jquery'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'

let Messages = {
  /**
   * Messages
   *
   * If toast are enabled, moves messages ul lis in toasts
   */
  init: function (opts) {
    if (opts.messagesToasts) {
      let toasts = []
      let all = true
      $('.messagelist li').each((index, el) => {
        let lv = $(el).attr('class')
        if (opts.messagesToasts === true || opts.messagesToasts.indexOf(lv) !== -1) {
          toasts.push(this.createToast($(el).attr('class'), $(el).html()))
          $(el).remove()
        } else {
          all = false
        }
      })
      if (toasts.length) {
        $('<div />', {'class': 'toast-container position-absolute top-0 end-0 p-3'})
          .append(toasts).appendTo($(document.body))
      }
      if (all) {
        $('.messagelist').remove()
      }
    }
    const toastElList = [].slice.call(document.querySelectorAll('.toast'))
    toastElList.map(function (toastEl) {
      new bootstrap.Toast(toastEl, { autohide: false }).show()
    })
  },
  levelsMap: {
    info: {
      bg: 'info',
      icon: 'fa fa-info-circle',
      iconColor: '#fff'
    },
    success: {
      bg: 'success',
      icon: 'fa fa-check-circle',
      iconColor: '#fff'
    },
    warning: {
      bg: 'warning',
      icon: 'fa fa-exclamation-circle',
      iconColor: '#fff'
    },
    error: {
      bg: 'danger',
      icon: 'fa fa-exclamation-circle',
      iconColor: '#fff'
    }
  },
  createToast (level, content) {
    let toast = `
      <div class="toast d-flex align-items-center text-white bg-${this.levelsMap[level].bg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-body">
          <i class="${this.levelsMap[level].icon}" style="color: ${this.levelsMap[level].iconColor}; margin-right: .5rem"></i>
          ${content}
        </div>
        <button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `
    return $(toast)
  }
}

export default Messages
