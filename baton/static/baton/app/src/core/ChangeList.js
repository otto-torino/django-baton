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
    if (this._filtersDiv.length) {
      const self = this
      setTimeout(function () {
        self.activate()
      }, 200) // select2
      this.fixRangeFilter()
    }
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
    const qs = []

    // any multiple choice list? These cause a page reload on click, but at least we keep the values
    // issue #292
    const urlParams = new URLSearchParams(window.location.search)
    const params = Object.fromEntries(urlParams.entries())
    Object.keys(params).forEach((key) => {
      if (/__in$/.test(key)) {
        qs.push(`${key}=${params[key]}`)
      }
    })

    const dropdowns = wrapper.find('select')
    const textInputs = wrapper.find('input').not('[type=hidden]')

    dropdowns
      .toArray()
      .map((el) => self.getDropdownValue(el))
      .filter((v) => v !== null)
      .forEach((v) => qs.push(v))

    textInputs.each((_, el) => (el.value !== '' ? qs.push(`${el.name}=${el.value}`) : null))

    // console.log(location.pathname + (qs.length ? '?' + qs.filter(q => q !== '').join('&') : ''), qs)
    location.href = location.pathname + (qs.length ? '?' + qs.filter((q) => q !== '').join('&') : '')
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
