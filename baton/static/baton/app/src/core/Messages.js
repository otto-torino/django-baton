import $ from 'jquery'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'
import Translator from './i18n'

const Messages = {
  /** Move the enabled message levels into persistent, dismissible toasts. */
  init: function (opts) {
    this.t = new Translator($('html').attr('lang'))
    if (opts.messagesToasts) {
      const toasts = []
      $('.messagelist > li').each((_, el) => {
        // Django's extra_tags can add classes before or after the severity.
        const tags = (el.getAttribute('class') || '').split(/\s+/)
        const level = tags.find((tag) => Object.prototype.hasOwnProperty.call(this.levelsMap, tag)) || 'info'
        if (opts.messagesToasts === true ||
            (Array.isArray(opts.messagesToasts) && opts.messagesToasts.includes(level))) {
          toasts.push(this.createToast(level, $(el).html()))
          $(el).remove()
        }
      })
      if (toasts.length) {
        let container = $('.baton-toast-container').first()
        if (!container.length) {
          container = $('<div />', { class: 'toast-container baton-toast-container' }).appendTo(document.body)
        }
        container.append(toasts)
      }
      $('.messagelist').filter((_, el) => !el.children.length).remove()
    }

    document.querySelectorAll('.toast').forEach((el) => {
      bootstrap.Toast.getOrCreateInstance(el, { autohide: false }).show()
    })
  },
  levelsMap: {
    debug: { variant: 'secondary', icon: 'bug_report' },
    info: { variant: 'info', icon: 'info' },
    success: { variant: 'success', icon: 'check_circle' },
    warning: { variant: 'warning', icon: 'warning' },
    error: { variant: 'danger', icon: 'error' },
  },
  createToast(level, content) {
    const appearance = this.levelsMap[level] || this.levelsMap.info
    const urgent = level === 'error' || level === 'warning'
    const toast = $('<div />', {
      class: 'toast baton-toast baton-toast-' + appearance.variant,
      role: urgent ? 'alert' : 'status',
      'aria-live': urgent ? 'assertive' : 'polite',
      'aria-atomic': 'true',
    })
    const body = $('<div />', { class: 'toast-body' }).appendTo(toast)
    $('<i />', { class: 'material-symbols-outlined baton-toast-icon', 'aria-hidden': 'true' })
      .text(appearance.icon).appendTo(body)
    // Preserve the markup Django already rendered, including admin object links.
    $('<div />', { class: 'baton-toast-content' }).html(content).appendTo(body)
    $('<button />', {
      type: 'button',
      class: 'btn-close',
      'data-bs-dismiss': 'toast',
      'aria-label': this.t.get('close'),
    }).appendTo(toast)
    toast[0].addEventListener('hidden.bs.toast', () => {
      const container = toast[0].closest('.baton-toast-container')
      bootstrap.Toast.getInstance(toast[0])?.dispose()
      toast.remove()
      if (container && !container.children.length) container.remove()
    }, { once: true })
    return toast
  },
}

export default Messages
