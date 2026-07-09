import $ from 'jquery'
import Translator from './i18n'
import Modal from './Modal'
import breakpoints from './Breakpoints'

const ChangeList = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this._filtersDiv = $('#changelist-filter')
    this.t = new Translator($('html').attr('lang'))
    this.filtersForm = opts.changelistFiltersForm
    this.filtersInModal = opts.changelistFiltersInModal
    this.filtersAlwaysOpen = opts.changelistFiltersAlwaysOpen
    this.initTemplates()
    this.wrapToplinks()
    this.enhancePagination()
    this.initColumnsVisibility()
    this.initPageSize()
    if (this._filtersDiv.length) {
      const self = this
      setTimeout(function () {
        self.activate()
      }, 200) // select2
      this.fixRangeFilter()
    }
  },
  enhancePagination: function () {
    const paginator = $('.paginator')
    const currentPageEl = paginator.find('.this-page')
    if (!paginator.length || !currentPageEl.length) {
      return
    }

    const currentPage = parseInt(currentPageEl.text())
    const pageLinks = paginator.children('a:not(.showall), span')
    const lastPage = parseInt(pageLinks.last().text())

    const buildNavLink = function (page, icon) {
      const url = new URL(location.href)
      url.searchParams.set('p', page)
      return $('<a />', { class: 'paginator-nav', href: url.href }).html(
        '<i class="material-symbols-outlined">' + icon + '</i>'
      )
    }

    if (currentPage > 1) {
      pageLinks.first().before(buildNavLink(currentPage - 1, 'chevron_left'))
    }
    if (currentPage < lastPage) {
      pageLinks.last().after(buildNavLink(currentPage + 1, 'chevron_right'))
    }
  },
  initPageSize: function () {
    const choicesEl = document.getElementById('baton-page-size-choices')
    const currentEl = document.getElementById('baton-page-size-current')
    const canShowAllEl = document.getElementById('baton-page-size-can-show-all')
    const showAllEl = document.getElementById('baton-page-size-show-all')
    const paginator = $('.paginator')
    if (!choicesEl || !currentEl || !canShowAllEl || !showAllEl || !paginator.length) {
      return
    }

    let choices
    let current
    let canShowAll
    let showAll
    try {
      choices = JSON.parse(choicesEl.textContent)
      current = JSON.parse(currentEl.textContent)
      canShowAll = JSON.parse(canShowAllEl.textContent)
      showAll = JSON.parse(showAllEl.textContent)
    } catch (e) {
      return
    }

    if (!Array.isArray(choices) || !choices.length) {
      return
    }

    const select = $('<select />', { class: 'paginator-page-size' }).on('change', function () {
      const url = new URL(location.href)
      url.searchParams.delete('p')
      if (this.value === 'all') {
        url.searchParams.delete('ps')
        url.searchParams.set('all', '')
      } else {
        url.searchParams.set('ps', this.value)
        url.searchParams.delete('all')
      }
      location.href = url.href
    })

    choices.forEach((choice) => {
      select.append($('<option />', { value: choice, selected: !showAll && choice === current }).text(choice))
    })
    if (canShowAll) {
      select.append($('<option />', { value: 'all', selected: showAll }).text(this.t.get('showAll')))
      paginator.children('.showall').remove()
    }

    const wrapper = $('<label />', { class: 'paginator-page-size-wrapper' })
      .append($('<span />').text(this.t.get('rowsPerPage')))
      .append(select)

    paginator.prepend(wrapper)
  },
  initColumnsVisibility: function () {
    const table = $('#result_list')
    if (!table.length) {
      return
    }

    const storageKey = 'baton-hidden-columns:' + location.pathname
    let hidden
    try {
      hidden = JSON.parse(localStorage.getItem(storageKey)) || []
    } catch (e) {
      hidden = []
    }

    const applyHidden = function (key, isHidden) {
      $('#result_list .column-' + key + ', #result_list .field-' + key).toggleClass('col-hidden', isHidden)
    }

    const firstRow = table.find('tbody tr').first()
    const columns = []
    table.find('thead th').each(function () {
      const match = /(?:^|\s)column-(\S+)/.exec($(this).attr('class') || '')
      if (!match) {
        return
      }
      const key = match[1]
      const isLinkColumn = firstRow.find('.field-' + key).first().children('a').length > 0
      if (!isLinkColumn) {
        columns.push({ key: key, label: $(this).find('.text').text().trim() })
      }
    })

    if (!columns.length) {
      return
    }

    hidden.forEach((key) => applyHidden(key, true))

    const list = $('<div />', { class: 'columns-toggle-list' })
    columns.forEach((col) => {
      const id = 'column-toggle-' + col.key
      const checkbox = $('<input />', { type: 'checkbox', id: id })
        .prop('checked', hidden.indexOf(col.key) === -1)
        .on('change', function () {
          const isHidden = !this.checked
          applyHidden(col.key, isHidden)
          hidden = isHidden ? hidden.concat(col.key) : hidden.filter((k) => k !== col.key)
          localStorage.setItem(storageKey, JSON.stringify(hidden))
        })
      list.append(
        $('<label />', { class: 'columns-toggle-item', for: id }).append(checkbox).append($('<span />').text(col.label))
      )
    })

    const modal = new Modal({
      title: this.t.get('columns'),
      content: list,
      size: 'sm',
      hideFooter: true,
    })

    const activeActions = $('#changelist-form > .actions').length !== 0
    const toggler = $('<a />', {
      class: 'changelist-columns-toggler' + (activeActions ? ' with-actions' : ''),
    })
      .html('<i class="material-symbols-outlined">view_column</i> <span>' + this.t.get('columns') + '</span>')
      .on('click', () => modal.open())

    $('#changelist-form').prepend(toggler)
  },
  wrapToplinks: function () {
    const toplinks = $('.changelist-form-container .toplinks')
    if (toplinks.length && !toplinks.parent().hasClass('xfull')) {
      toplinks.wrap($('<div />', { class: 'xfull' }))
    }
  },
  activate: function () {
    if ($('.changelist-form-container').length) {
      // django >= 3.1
      $('#changelist-filter').appendTo($('.changelist-form-container'))
    }
    let isModal = false
    if (this.filtersAlwaysOpen) {
      $(document.body).addClass('changelist-filter-active changelist-filter-always-open')
    } else {
      // filters active?
      const _activeFilters = /__[^=]+=/.test(location.search)
      // actions ?
      const _activeActions = $('#changelist-form > .actions').length !== 0
      const _changelistForm = $('#changelist-form')
      const _filtersToggler = $('<a />', {
        class:
          'changelist-filter-toggler' + (_activeFilters ? ' active' : '') + (_activeActions ? ' with-actions' : ''),
      }).html('<i class="material-symbols-outlined">filter_alt</i> <span>' + this.t.get('filter') + '</span>')

      if (this.filtersInModal || parseInt($(window).width()) < breakpoints.lg) {
        const self = this
        isModal = true
        // wait for filters used js to exec
        $('#changelist-filter').prop('id', 'changelist-filter-modal')
        const titleEl = $('#changelist-filter-modal > h2')
        const title = titleEl.html()
        titleEl.remove()
        const content = $('#changelist-filter-modal')
        // remove from dom
        this.modal = new Modal({
          title,
          content,
          size: 'md',
          hideFooter: !this.filtersForm,
          actionBtnLabel: this.t.get('filter'),
          actionBtnCb: function () {
            self.filter(content)
          },
        })
        _filtersToggler.on('click', () => {
          self.modal.open()
        })
      } else {
        _filtersToggler.on('click', () => {
          $(document.body).toggleClass('changelist-filter-active')
          if (parseInt(this._filtersDiv.css('max-width')) === 100) {
            // diff between mobile and lg
            $('html,body').animate({
              scrollTop: this._filtersDiv.offset().top,
            })
          }
        })
      }
      _changelistForm.prepend(_filtersToggler)
    }

    if (!isModal && this.filtersForm) {
      // add filters button
      const btn = $('<a />', { class: 'btn btn-primary' })
        .html(this.t.get('filter'))
        .on('click', () => this.filter($('#changelist-filter')))
      $('#changelist-filter').append($('<div />', { class: 'text-center mb-3' }).append(btn))
    }

    if (/_popup=1/.test(location.href)) {
      $('#changelist-form .results').css('padding-top', '78px')
    }
  },
  getDropdownValue: function (dropdown) {
    const items = $(dropdown).find('option').attr('value').substr(1).split('&')
    const values = $(dropdown)
      .val()
      .substr(1)
      .split('&')
      .filter((item) => items.indexOf(item) === -1)
    return values.length ? values.join('&') : null
  },
  filter: function (wrapper) {
    const self = this

    // any multiple choice list? These cause a page reload on click, but at least we keep the values
    // issue #292
    const newUrl = new URL(location.href)

    const dropdowns = wrapper.find('select')
    const textInputs = wrapper.find('input').not('[type=hidden]')

    const dropdownValues = dropdowns
      .toArray()
      .map((el) => self.getDropdownValue(el))
      .filter((v) => v !== null)
      .map((v) => v.split('='))

    const textInputValues = textInputs.toArray().map((el) => [el.name, el.value])

    for (const [name, value] of [...textInputValues, ...dropdownValues]) {
      if (name && value && String(value).length) {
        newUrl.searchParams.set(name, String(value))
      }
    }

    location.href = newUrl.href
  },
  initTemplates: function () {
    const positionMap = {
      above: 'before',
      below: 'after',
      top: 'prepend',
      bottom: 'append',
    }

    $('template[data-type=include]').each(function (index, template) {
      const position = positionMap[$(template).attr('data-position')]
      if (position !== undefined) {
        const el = $('#changelist-form')
        el[position]($(template).html())
      } else {
        console.error('Baton: wrong changelist include position detected')
      }
    })

    $('template[data-type=filters-include]').each(function (_, template) {
      const position = positionMap[$(template).attr('data-position')]
      if (position !== undefined && position !== 'before' && position !== 'after') {
        if (position === 'prepend' && $('#changelist-filter-clear').length) {
          $('#changelist-filter-clear').after($(template).html())
        } else if (position === 'prepend' && $('#changelist-filter > h2').length) {
          $('#changelist-filter > h2').after($(template).html())
        } else {
          const el = $('#changelist-filter')
          el[position]($(template).html())
        }
      } else {
        console.error('Baton: wrong changelist filters include position detected')
      }
    })

    $('template#template-cl-object-tools').each(function (_, template) {
      const position = $(template).attr('data-position') === 'right' ? 'append' : 'prepend'
      const el = $('ul.object-tools')
      el[position]($(template).html())
    })

    $('template[data-type=attributes]').each(function (_, template) {
      try {
        const data = JSON.parse($(template).html())

        for (const key in data) {
          // eslint-disable-next-line no-prototype-builtins
          if (data.hasOwnProperty(key)) {
            let selector
            let getParent = 'tr'
            if (data[key].selector) {
              selector = data[key].selector
              delete data[key].selector
            } else {
              selector = '#result_list tr input[name=_selected_action][value=' + key + ']'
            }
            if (data[key].getParent !== undefined) {
              getParent = data[key].getParent
              delete data[key].getParent
            }

            const el = getParent ? $(selector).parents(getParent) : $(selector)
            el.attr(data[key])
          }
        }
      } catch (e) {
        console.error(e)
      }
    })
  },
  fixRangeFilter: function () {
    if (this.filtersForm) {
      $('.admindatefilter .controls').remove()
      $('.admindatefilter form').onSubmit = function () {
        return false
      }
    }
  },
}

export default ChangeList
