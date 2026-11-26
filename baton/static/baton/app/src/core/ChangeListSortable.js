import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'
import Sortable from 'sortablejs'
import Translator from './i18n'
import Messages from './Messages'

const FOCUS_KEY = 'baton-cl-sort-focus'
// the keyboard saves once the arrows stop
const KEYBOARD_DELAY = 800

// Rows of the changelist ordered by dragging, see BatonSortableMixin: the order
// is saved when a row is dropped, then the page reloads with the new numbers
const ChangeListSortable = {
  init () {
    const config = document.getElementById('baton-sortable')
    this.tbody = document.querySelector('#result_list tbody')
    if (!config || !this.tbody) return
    this.config = JSON.parse(config.textContent)
    this.t = new Translator(document.documentElement.lang)
    this.handles = [...this.tbody.querySelectorAll('.baton-cl-sort-handle')]
    if (!this.config.can_change) {
      this.handles.forEach((handle) => handle.remove())
      return
    }
    if (!this.config.ordered) {
      this.disable()
      return
    }
    this.initial = this.order()
    this.handles.forEach((handle) => handle.addEventListener('keydown', (event) => this.onKeydown(event)))
    this.sortable = new Sortable(this.tbody, {
      handle: '.baton-cl-sort-handle',
      draggable: 'tr',
      animation: 150,
      swapThreshold: 0.65,
      easing: 'cubic-bezier(1, 0, 0, 1)',
      onEnd: (event) => {
        this.renumberRows()
        this.save(event.item)
      },
    })
    this.restoreFocus()
  },

  order () {
    return [...this.tbody.querySelectorAll('.baton-cl-sort-handle')].map((handle) => handle.dataset.pk)
  },

  // the striped rows follow their place, also while they move
  renumberRows () {
    ;[...this.tbody.children].forEach((row, i) => {
      row.classList.toggle('row1', i % 2 === 0)
      row.classList.toggle('row2', i % 2 === 1)
    })
  },

  // ordered by another column: the handles are off, with a link to the order by the field
  disable () {
    const header = document.querySelector('#result_list thead th.column-baton_sortable_handle')
    const label = header ? (header.querySelector('.text') || header).textContent.trim() : ''
    const message = this.t.get('sortNotOrdered') + (label ? ' «' + label + '»' : '')
    this.handles.forEach((handle) => {
      handle.disabled = true
      handle.title = message
      handle.removeAttribute('aria-label')
    })
    const notice = document.createElement('p')
    notice.className = 'baton-cl-sort-notice'
    const link = document.createElement('a')
    link.href = this.config.reset_url
    link.textContent = this.t.get('sortReset')
    notice.append(message + '. ', link)
    document.getElementById('result_list').closest('.results')?.before(notice)
  },

  onKeydown (event) {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const row = event.target.closest('tr')
    const sibling = event.key === 'ArrowUp' ? row.previousElementSibling : row.nextElementSibling
    if (!sibling) return
    if (event.key === 'ArrowUp') sibling.before(row)
    else sibling.after(row)
    this.renumberRows()
    event.target.focus()
    clearTimeout(this.keyboardTimer)
    this.keyboardTimer = setTimeout(() => this.save(row), KEYBOARD_DELAY)
  },

  // the edits of list_editable would be lost with the reload
  hasUnsavedChanges () {
    const form = document.getElementById('changelist-form')
    if (!form) return false
    return [...form.querySelectorAll('#result_list input, #result_list select, #result_list textarea')].some((field) => {
      if (field.type === 'checkbox' && field.name === '_selected_action') return false
      if (field.type === 'checkbox' || field.type === 'radio') return field.checked !== field.defaultChecked
      if (field.tagName === 'SELECT') return [...field.options].some((option) => option.selected !== option.defaultSelected)
      return field.value !== field.defaultValue
    })
  },

  revert () {
    const rows = new Map([...this.tbody.children].map((row) => [row.querySelector('.baton-cl-sort-handle')?.dataset.pk, row]))
    this.initial.forEach((pk) => this.tbody.append(rows.get(pk)))
    this.renumberRows()
  },

  notify (level, message) {
    let container = document.querySelector('.baton-toast-container')
    if (!container) {
      container = document.createElement('div')
      container.className = 'toast-container baton-toast-container'
      document.body.append(container)
    }
    const toast = Messages.createToast(level, '')
    toast.find('.baton-toast-content').text(message)
    container.append(toast[0])
    bootstrap.Toast.getOrCreateInstance(toast[0], { autohide: false }).show()
  },

  save (row) {
    const order = this.order()
    if (order.join() === this.initial.join()) return
    if (this.hasUnsavedChanges()) {
      this.revert()
      this.notify('warning', this.t.get('sortUnsaved'))
      return
    }
    const pk = row.querySelector('.baton-cl-sort-handle')?.dataset.pk
    try {
      sessionStorage.setItem(FOCUS_KEY, location.pathname + '#' + pk)
    } catch (_) { /* no storage: the focus stays on the page */ }
    this.sortable.option('disabled', true)
    fetch(this.config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.csrfToken() },
      body: JSON.stringify({ order }),
      credentials: 'same-origin',
    }).then((response) => response.json().catch(() => ({})).then((data) => {
      if (!response.ok) throw new Error(data.error || this.t.get('sortError'))
      location.reload()
    })).catch((error) => {
      this.revert()
      this.sortable.option('disabled', false)
      this.notify('error', error.message || this.t.get('sortError'))
    })
  },

  csrfToken () {
    const input = document.querySelector('input[name=csrfmiddlewaretoken]')
    if (input) return input.value
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('csrftoken='))
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : ''
  },

  // after the reload of a move from the keyboard, back on the moved row
  restoreFocus () {
    let target
    try {
      target = sessionStorage.getItem(FOCUS_KEY)
      sessionStorage.removeItem(FOCUS_KEY)
    } catch (_) {
      return
    }
    if (!target || !target.startsWith(location.pathname + '#')) return
    const pk = target.slice(location.pathname.length + 1)
    this.handles.find((handle) => handle.dataset.pk === pk)?.focus()
  },
}

export default ChangeListSortable
