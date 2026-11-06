import Translator from './i18n'

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
const value = (field) => {
  if (field.type === 'checkbox' || field.type === 'radio') return field.checked
  if (field.tagName === 'SELECT') return [...field.selectedOptions].map((option) => option.value).join('\n')
  return field.value
}

// A presentation of Django's existing forms: IDs, widget nodes, permissions
// and management fields stay intact, and saving belongs to the parent form.
class InlineGroup {
  constructor (group, options) {
    this.group = group
    this.options = options
    this.t = new Translator(document.documentElement.lang)
    this.rows = []
    this.dragged = null
    group.classList.add('baton-stacked')
    this.refresh()
    for (const event of ['input', 'change']) group.addEventListener(event, (event) => this.update(event.target.closest('.baton-stacked-row')))
    group.addEventListener('dragover', (event) => {
      const target = event.target.closest('.baton-stacked-row')
      if (!this.dragged || !this.rows.includes(target) || target === this.dragged) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      this.rows.forEach((row) => row.classList.toggle('is-drop-target', row === target))
    })
    group.addEventListener('drop', (event) => {
      const target = event.target.closest('.baton-stacked-row')
      if (!this.dragged || !this.rows.includes(target)) return
      event.preventDefault()
      this.move(this.dragged, this.rows.indexOf(target))
      this.endDrag()
    })
    group.closest('form')?.addEventListener('submit', () => this.saveOrder())
  }

  refresh () {
    this.rows = this.rows.filter((row) => row.isConnected)
    this.group.querySelectorAll('.inline-related:not(.empty-form)').forEach((row) => {
      if (row.closest('.js-inline-admin-formset') !== this.group || this.rows.includes(row)) return
      this.rows.push(row)
      this.decorate(row)
    })
    this.rows.forEach((row, index) => {
      // Moving iframe nodes reloads editors and can lose unsaved text. CSS
      // order changes their visual position without detaching any widget.
      row.style.order = index
      this.update(row)
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
    const original = row.querySelector(':scope > h3, :scope > h2')
    if (!original) return
    row.classList.add('baton-stacked-row')
    row.parentElement.classList.add('baton-inline-list')
    original.classList.add('baton-inline-original-heading')
    original.classList.remove('entry-collapsed')
    const label = original.querySelector('.inline_label')?.cloneNode(true)
    label?.querySelectorAll('a').forEach((link) => link.remove())
    const order = row.querySelector('input[type="number"][name$="-position"], input[type="number"][name$="-sort_order"], input[type="number"][name$="-order"]')
    row.batonInline = {
      name: row.classList.contains('has_original') ? label?.textContent.trim() : '',
      type: original.querySelector('b')?.textContent.replace(/:\s*$/, '').trim() || '',
      order: order && !order.disabled && !order.readOnly ? order : null,
      initial: new Map([...row.querySelectorAll('input,textarea,select')].map((field) => [field, value(field)])),
    }
    const header = element('div', 'baton-inline-header')
    const main = element('button', 'baton-inline-main')
    main.type = 'button'
    const title = element('span', 'baton-inline-title')
    title.append(element('strong', 'baton-inline-name'), element('span', 'baton-inline-badge', row.batonInline.type))
    main.append(title, element('span', 'baton-inline-summary'))
    main.addEventListener('click', () => this.expand(row, row.classList.contains('is-collapsed')))
    const glyph = icon('view_agenda')
    glyph.classList.add('baton-inline-icon')
    header.append(glyph, main)
    if (row.batonInline.order) {
      const handle = this.button('drag_indicator', 'inlineMove', 'baton-inline-handle')
      handle.draggable = true
      handle.addEventListener('dragstart', (event) => {
        this.dragged = row
        row.classList.add('is-dragging')
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', row.id)
      })
      handle.addEventListener('dragend', () => this.endDrag())
      handle.addEventListener('keydown', (event) => {
        if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault()
        this.move(row, this.rows.indexOf(row) + (event.key === 'ArrowUp' ? -1 : 1))
      })
      header.prepend(handle)
    }
    const toggle = this.button('expand_more', 'inlineEdit', 'baton-inline-toggle')
    toggle.addEventListener('click', () => this.expand(row, row.classList.contains('is-collapsed')))
    header.append(toggle)
    const deletion = row.querySelector('input[name$="-DELETE"]')
    const remove = row.querySelector('.inline-deletelink')
    const links = original.querySelectorAll('a:not(.inline-deletelink)')
    if (deletion || remove || links.length || row.batonInline.order) {
      const dropdown = element('div', 'dropdown')
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
      if (deletion || remove) {
        const button = action('inlineDelete', () => {
          if (deletion) {
            deletion.checked = !deletion.checked
            deletion.dispatchEvent(new Event('change', { bubbles: true }))
            if (deletion.checked) this.expand(row, false)
          } else if (remove.style.display !== 'none') {
            remove.click()
            this.refresh()
          }
        })
        button.classList.add('baton-inline-delete', 'text-danger')
      }
      dropdown.append(trigger, menu)
      header.append(dropdown)
    }
    row.prepend(header)
    const firstExpanded = this.group.querySelector('.expand-first') && this.rows.indexOf(row) === 0
    this.expand(row, Boolean(row.querySelector('.errors, .errorlist') || firstExpanded || !row.classList.contains('has_original')))
  }

  expand (row, expanded) {
    row.classList.toggle('is-collapsed', !expanded)
    row.querySelectorAll('.baton-inline-main, .baton-inline-toggle').forEach((button) => button.setAttribute('aria-expanded', String(expanded)))
    row.querySelector('.baton-inline-toggle .material-symbols-outlined').textContent = expanded ? 'expand_less' : 'expand_more'
  }

  update (row) {
    if (!row?.batonInline) return
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
    const deleted = row.querySelector('input[name$="-DELETE"]')?.checked || false
    row.classList.toggle('is-deleted', deleted)
    const deletion = row.querySelector('.baton-inline-delete')
    if (deletion) {
      deletion.textContent = this.t.get(deleted ? 'inlineRestore' : 'inlineDelete')
      deletion.disabled = Boolean(!row.querySelector('input[name$="-DELETE"]') && row.querySelector('.inline-deletelink')?.style.display === 'none')
    }
  }

  move (row, index) {
    if (index < 0 || index >= this.rows.length || this.rows.indexOf(row) === index) return
    this.rows.splice(this.rows.indexOf(row), 1)
    this.rows.splice(index, 0, row)
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

  endDrag () {
    this.dragged = null
    this.rows.forEach((row) => row.classList.remove('is-dragging', 'is-drop-target'))
  }
}

export default {
  init (options) {
    const groups = [...document.querySelectorAll('.js-inline-admin-formset[data-inline-type="stacked"]')].map((group) => new InlineGroup(group, options))
    for (const event of ['formset:added', 'formset:removed']) document.addEventListener(event, () => groups.forEach((group) => group.refresh()))
    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'editor-data-update') return
      groups.forEach((group) => group.rows.forEach((row) => {
        if ([...row.querySelectorAll('iframe')].some((frame) => frame.contentWindow === event.source)) group.update(row)
      }))
    })
  },
}
