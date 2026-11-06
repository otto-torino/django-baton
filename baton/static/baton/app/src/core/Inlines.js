import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'
import Sortable from 'sortablejs'
import Translator from './i18n'

const ORDER_FIELDS = ['position', 'sort_order', 'order']
  .map((name) => 'input[type="number"][name$="-' + name + '"]').join(', ')

const element = (tag, className, text) => {
  const node = document.createElement(tag)
  node.className = className
  if (text) node.textContent = text
  return node
}
const icon = (name) => {
  const node = element('span', 'material-symbols-outlined', name)
  node.setAttribute('aria-hidden', 'true')
  return node
}
const text = (value) => {
  if (!value) return ''
  try {
    const data = JSON.parse(value)
    if (Array.isArray(data.blocks)) value = data.blocks.map((block) => block.data?.text || block.data?.caption || '').filter(Boolean).join(' · ')
  } catch (_) { /* ordinary text */ }
  return new DOMParser().parseFromString(value, 'text/html').body.textContent.replace(/\s+/g, ' ').trim()
}
// the submit row fixed at the bottom of the window covers the end of the page
const coveredBottom = () => {
  const bar = [...document.querySelectorAll('.submit-row')].find((row) => getComputedStyle(row).position === 'fixed')
  return bar ? bar.getBoundingClientRect().height : 0
}
const value = (field) => {
  if (field.type === 'checkbox' || field.type === 'radio') return field.checked
  if (field.tagName === 'SELECT') return [...field.selectedOptions].map((option) => option.value).join('\n')
  return field.value
}

// A presentation of Django's existing forms: IDs, widget nodes, permissions
// and management fields stay intact, and saving belongs to the parent form.
// Stacked and tabular inlines share the rows' actions and their ordering; a
// stacked row gets a header with a summary that opens its form, a tabular one
// keeps its cells.
class InlineGroup {
  constructor (group, options) {
    this.group = group
    this.options = options
    this.tabular = group.dataset.inlineType === 'tabular'
    this.t = new Translator(document.documentElement.lang)
    this.rows = []
    this.sortable = null
    group.classList.add(this.tabular ? 'baton-tabular' : 'baton-stacked')
    // collapse-entry closes the saved rows, as it always did; without it they
    // start open
    this.collapsible = !this.tabular && Boolean(group.querySelector('.collapse-entry'))
    this.refresh()
    for (const event of ['input', 'change']) group.addEventListener(event, (event) => this.update(event.target.closest('.baton-inline-row')))
    group.closest('form')?.addEventListener('submit', () => this.saveOrder())
  }

  refresh () {
    // the rows in the order of the page, which a drag changes
    const selector = this.tabular ? 'tr.form-row:not(.empty-form)' : '.inline-related:not(.empty-form)'
    this.rows = [...this.group.querySelectorAll(selector)]
      .filter((row) => row.closest('.js-inline-admin-formset') === this.group)
    this.rows.forEach((row) => {
      if (!row.batonInline) this.decorate(row)
      this.update(row)
    })
    if (this.tabular) this.fixTable()
    this.initSortable()
  }

  // Dragged with SortableJS, from the handle: the row moves in the page, so
  // its widgets in iframes reload, see the docs.
  initSortable () {
    const list = this.rows.find((row) => row.batonInline?.order)?.parentElement
    if (this.sortable || !list) return
    this.sortable = new Sortable(list, {
      handle: '.baton-inline-handle',
      draggable: '.baton-inline-row',
      animation: 150,
      swapThreshold: 0.65,
      easing: 'cubic-bezier(1, 0, 0, 1)',
      // the rows only change places among themselves, never with the errors
      // or the "add another" button
      onMove: (event) => event.related.classList.contains('baton-inline-row'),
      // the editors in iframes would take the drag events while a row passes
      onStart: () => this.group.classList.add('is-sorting'),
      onEnd: (event) => {
        this.group.classList.remove('is-sorting')
        this.placeErrors()
        this.refresh()
        this.saveOrder()
        event.item.querySelector('.baton-inline-handle')?.focus()
      },
    })
  }

  button (symbol, label, className) {
    const button = element('button', 'btn baton-inline-action ' + className)
    button.type = 'button'
    button.setAttribute('aria-label', this.t.get(label))
    button.append(icon(symbol))
    return button
  }

  decorate (row) {
    const original = this.tabular
      ? row.querySelector(':scope > td.original')
      : row.querySelector(':scope > h3, :scope > h2')
    if (!original) return
    row.classList.add('baton-inline-row', this.tabular ? 'baton-tabular-row' : 'baton-stacked-row')
    if (!this.tabular) row.parentElement.classList.add('baton-inline-list')
    original.classList.add('baton-inline-original-heading')
    const label = (this.tabular ? original.querySelector(':scope > p') : original.querySelector('.inline_label'))?.cloneNode(true)
    label?.querySelectorAll('a').forEach((link) => link.remove())
    const order = row.querySelector(ORDER_FIELDS)
    const previous = row.previousElementSibling
    row.batonInline = {
      name: row.classList.contains('has_original') ? label?.textContent.replace(/\s+/g, ' ').trim() : '',
      type: original.querySelector('b')?.textContent.replace(/:\s*$/, '').trim() || '',
      order: order && !order.disabled && !order.readOnly ? order : null,
      // the errors of a tabular row are a row of their own, which moves with it
      errors: previous?.classList.contains('row-form-errors') ? previous : null,
      initial: new Map([...row.querySelectorAll('input,textarea,select')].map((field) => [field, value(field)])),
    }
    const links = [...original.querySelectorAll(this.tabular ? ':scope > p a' : 'a:not(.inline-deletelink)')]
    const handle = row.batonInline.order ? this.handle(row) : null
    // the handle and the menu set the order: its field is hidden, unless it
    // shows an error
    const orderBox = row.batonInline.order && (this.tabular
      ? row.batonInline.order.closest('td')
      : row.batonInline.order.closest('.fieldBox') || row.batonInline.order.closest('.form-row'))
    if (orderBox && !orderBox.querySelector('.errorlist')) orderBox.classList.add('baton-inline-order-cell')
    const menu = this.menu(row, links)
    if (this.tabular) this.decorateTabular(row, original, handle, menu)
    else this.decorateStacked(row, original, handle, menu)
  }

  decorateStacked (row, original, handle, menu) {
    original.classList.remove('entry-collapsed')
    const header = element('div', 'baton-inline-header')
    const main = element('button', 'baton-inline-main')
    main.type = 'button'
    const title = element('span', 'baton-inline-title')
    // no badge of the model: every row of an inline is one, named by its tab
    title.append(element('strong', 'baton-inline-name'))
    main.append(title, element('span', 'baton-inline-summary'))
    main.addEventListener('click', () => this.expand(row, row.classList.contains('is-collapsed')))
    const glyph = icon('view_agenda')
    glyph.classList.add('baton-inline-icon')
    header.append(glyph, main)
    if (handle) header.prepend(handle)
    const toggle = this.button('expand_more', 'inlineEdit', 'baton-inline-toggle')
    toggle.addEventListener('click', () => this.expand(row, row.classList.contains('is-collapsed')))
    header.append(toggle)
    if (menu) header.append(menu)
    row.prepend(header)
    const firstExpanded = this.group.querySelector('.expand-first') && this.rows.indexOf(row) === 0
    this.expand(row, Boolean(!this.collapsible || row.querySelector('.errors, .errorlist') || firstExpanded || !row.classList.contains('has_original')))
  }

  // The first cell holds the handle and the name of a saved row, the last one
  // the menu, in place of the "Delete?" checkbox and the remove button
  decorateTabular (row, original, handle, menu) {
    if (handle) original.prepend(handle)
    if (row.batonInline.name) original.append(element('span', 'baton-inline-name', row.batonInline.name))
    let actions = row.querySelector(':scope > td.delete')
    if (!actions) {
      actions = element('td', 'delete')
      row.append(actions)
    }
    actions.classList.add('baton-inline-actions')
    if (menu) actions.append(menu)
  }

  handle (row) {
    const handle = this.button('drag_indicator', 'inlineMove', 'baton-inline-handle')
    handle.addEventListener('keydown', (event) => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      this.move(row, this.rows.indexOf(row) + (event.key === 'ArrowUp' ? -1 : 1))
    })
    return handle
  }

  // Django adds the remove button of the unsaved rows on its own, before or
  // after this script, so the menu looks for it when it is used
  menu (row, links) {
    const deletion = row.querySelector('input[name$="-DELETE"]')
    const isNew = !row.classList.contains('has_original')
    if (!deletion && !isNew && !links.length && !row.batonInline.order) return null
    const dropdown = element('div', 'dropdown baton-inline-dropdown')
    const trigger = this.button('more_vert', 'inlineActions', 'baton-inline-menu')
    trigger.setAttribute('data-bs-toggle', 'dropdown')
    trigger.setAttribute('aria-expanded', 'false')
    const menu = element('ul', 'dropdown-menu dropdown-menu-end')
    const action = (label, callback) => {
      const item = element('li', '')
      const button = element('button', 'dropdown-item', this.t.get(label))
      button.type = 'button'
      button.addEventListener('click', callback)
      item.append(button)
      menu.append(item)
      return button
    }
    if (row.batonInline.order) {
      action('inlineMoveUp', () => this.move(row, this.rows.indexOf(row) - 1))
      action('inlineMoveDown', () => this.move(row, this.rows.indexOf(row) + 1))
    }
    links.forEach((link) => {
      const item = element('li', '')
      const copy = link.cloneNode(true)
      copy.className = 'dropdown-item'
      item.append(copy)
      menu.append(item)
    })
    if (deletion || isNew) {
      const button = action('inlineDelete', () => {
        const remove = row.querySelector('.inline-deletelink')
        if (deletion) {
          deletion.checked = !deletion.checked
          deletion.dispatchEvent(new Event('change', { bubbles: true }))
          if (deletion.checked && !this.tabular) this.expand(row, false)
        } else if (remove && remove.style.display !== 'none') {
          remove.click()
          this.refresh()
        }
      })
      button.classList.add('baton-inline-delete', 'text-danger')
    }
    dropdown.append(trigger, menu)
    bootstrap.Dropdown.getOrCreateInstance(trigger, {
      // measured at each opening: the menu opens upwards rather than under
      // the submit row
      popperConfig: (config) => {
        const padding = { top: 8, bottom: coveredBottom() + 8 }
        return {
          ...config,
          // a tabular inline scrolls sideways, and would clip it
          ...(this.tabular ? { strategy: 'fixed' } : {}),
          modifiers: [...config.modifiers, { name: 'flip', options: { padding } }, { name: 'preventOverflow', options: { padding } }],
        }
      },
    })
    // the state of the remove button may have changed since the last update
    dropdown.addEventListener('show.bs.dropdown', () => this.update(row))
    return dropdown
  }

  expand (row, expanded) {
    row.classList.toggle('is-collapsed', !expanded)
    row.querySelectorAll('.baton-inline-main, .baton-inline-toggle').forEach((button) => button.setAttribute('aria-expanded', String(expanded)))
    row.querySelector('.baton-inline-toggle .material-symbols-outlined').textContent = expanded ? 'expand_less' : 'expand_more'
  }

  update (row) {
    if (!row?.batonInline) return
    if (!this.tabular) this.summarize(row)
    const deletion = row.querySelector('input[name$="-DELETE"]')
    const deleted = deletion?.checked || false
    row.classList.toggle('is-deleted', deleted)
    const button = row.querySelector('.baton-inline-delete')
    if (button) {
      button.textContent = this.t.get(deleted ? 'inlineRestore' : 'inlineDelete')
      const remove = row.querySelector('.inline-deletelink')
      button.disabled = !deletion && (!remove || remove.style.display === 'none')
    }
  }

  summarize (row) {
    const fields = [...row.querySelectorAll('input[type="text"],input[type="email"],input[type="url"],textarea,select')]
      .filter((field) => !field.name.endsWith('-subject_location'))
      .filter((field) => !this.options.otherLanguages?.some((language) => language !== this.options.defaultLanguage && field.name.endsWith('_' + language)))
    const values = fields.map((field) => field.tagName === 'SELECT'
      ? (field.value ? [...field.selectedOptions].map((option) => option.textContent).join(', ') : '')
      : text(field.value)).filter(Boolean)
    const name = row.batonInline.name || values[0]?.split(' · ')[0] || row.batonInline.type + ' ' + (this.rows.indexOf(row) + 1)
    row.querySelector('.baton-inline-name').textContent = name
    const summaries = [...new Set(values.map((value) => value === name ? '' : value.startsWith(name + ' · ') ? value.slice(name.length + 3) : value).filter(Boolean))]
    const summary = row.querySelector('.baton-inline-summary')
    summary.textContent = summaries.slice(0, 3).join(' · ')
    summary.hidden = !summary.textContent
  }

  // The header of the column of the menu, and the cells that span the table,
  // as many as its columns: a row may have gained the cell of the menu
  fixTable () {
    const head = this.group.querySelector('thead tr')
    if (!head) return
    const columns = Math.max(...this.rows.map((row) => row.children.length), 0)
    if (columns > head.children.length) head.append(element('th', ''))
    const last = head.lastElementChild
    if (!last.classList.contains('baton-inline-actions')) {
      last.classList.add('baton-inline-actions')
      last.replaceChildren(element('span', 'visually-hidden', this.t.get('inlineActions')))
    }
    const name = this.rows.find((row) => row.batonInline?.order)?.batonInline.order.name.split('-').pop()
    if (name) head.querySelector('.column-' + name)?.classList.add('baton-inline-order-cell')
    this.group.querySelectorAll('tbody > tr:not(.baton-inline-row) > td[colspan]').forEach((cell) => { cell.colSpan = head.children.length })
  }

  // each row of errors back in front of its row, wherever a row was dropped
  placeErrors () {
    this.group.querySelectorAll('.baton-inline-row').forEach((row) => {
      if (row.batonInline?.errors) row.before(row.batonInline.errors)
    })
  }

  move (row, index) {
    const from = this.rows.indexOf(row)
    if (index < 0 || index >= this.rows.length || from === index) return
    const target = this.rows[index]
    if (index > from) target.after(row)
    else target.before(row)
    this.placeErrors()
    this.refresh()
    this.saveOrder()
    row.querySelector('.baton-inline-handle')?.focus()
  }

  saveOrder () {
    let position = 0
    this.rows.forEach((row) => {
      const field = row.batonInline?.order
      if (!field || row.querySelector('input[name$="-DELETE"]')?.checked) return
      // Do not turn an untouched extra form into a new record by assigning
      // it a position. Only saved rows and edited extras participate.
      const changed = row.classList.contains('has_original') || [...row.querySelectorAll('input,textarea,select')].some((input) => {
        return input !== field && input.name && !input.name.endsWith('-DELETE') && input.type !== 'hidden' && value(input) !== row.batonInline.initial.get(input)
      })
      field.value = changed ? position++ : row.batonInline.initial.get(field)
    })
  }
}

export default {
  init (options) {
    const groups = [...document.querySelectorAll('.js-inline-admin-formset[data-inline-type="stacked"], .js-inline-admin-formset[data-inline-type="tabular"]')]
      .map((group) => new InlineGroup(group, options))
    for (const event of ['formset:added', 'formset:removed']) document.addEventListener(event, () => groups.forEach((group) => group.refresh()))
    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'editor-data-update') return
      groups.forEach((group) => group.rows.forEach((row) => {
        if ([...row.querySelectorAll('iframe')].some((frame) => frame.contentWindow === event.source)) group.update(row)
      }))
    })
  },
}
