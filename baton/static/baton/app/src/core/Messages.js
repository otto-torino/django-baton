/* eslint-disable max-len */
import $ from 'jquery'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'

const Messages = {
  /**
   * Messages
   *
   * If toast are enabled, moves messages ul lis in toasts
   */
  init: function (opts) {
    if (opts.messagesToasts) {
      const toasts = []
      let all = true
      $('.messagelist li').each((_, el) => {
        const lv = $(el).attr('class')
        if (opts.messagesToasts === true || opts.messagesToasts.indexOf(lv) !== -1) {
          toasts.push(this.createToast($(el).attr('class'), $(el).html()))
          $(el).remove()
        } else {
          all = false
        }
      })
      if (toasts.length) {
        $('<div />', { class: 'toast-container position-absolute top-0 end-0 p-3' })
          .append(toasts)
          .appendTo($(document.body))
      }
      if (all) {
        $('.messagelist').remove()
      }
    }
    const toastElList = [].slice.call(document.querySelectorAll('.toast'))
    // eslint-disable-next-line array-callback-return
    toastElList.map(function (toastEl) {
      new bootstrap.Toast(toastEl, { autohide: false }).show()
    })
  },
  levelsMap: {
    info: {
      bg: 'info',
      icon: 'info',
      iconColor: '#fff',
    },
    success: {
      bg: 'success',
      icon: 'check_circle',
      iconColor: '#fff',
    },
    warning: {
      bg: 'warning',
      icon: 'warning',
      iconColor: '#fff',
    },
    error: {
      bg: 'danger',
      icon: 'error',
      iconColor: '#fff',
    },
  },
  createToast(level, content) {
    const toast = `
      <div class="toast d-flex align-items-center text-white bg-${this.levelsMap[level].bg} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-body">
          <i class="material-symbols-outlined" style="color: ${this.levelsMap[level].iconColor}; margin-right: .5rem">${this.levelsMap[level].icon}</i>
          ${content}
        </div>
        <button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `
    return $(toast)
  },
}

export default Messages
