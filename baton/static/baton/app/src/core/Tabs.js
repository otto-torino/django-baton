import $ from 'jquery'

let Tabs = {
  /**
   * Tabs component
   */
  init: function (Dispatcher) {
    this.Dispatcher = Dispatcher
    if (this.shouldRun()) {
      console.info('Baton:', 'generating tabs')
      this.main.attr('data-baton-tab', 'main')
      this.createNav()
      this.createPanes()
      this.checkHash()
      this.showErrors()
      this.Dispatcher.emit('onTabsReady')
    }
  },
  shouldRun: function () {
    this.main = $('#content-main form .baton-tabs-init')
    return this.main.length === 1
  },
  createNav: function () {
    this.mainOrder = 0
    this.tabsEl = []
    this.domTabsEl = []
    let classes = this.main.attr('class')
    classes.split(' ').forEach((cl) => {
      if (/baton-tab-/.test(cl)) {
        this.tabsEl.push(cl.substring(10))
      }
      if (/order-/.test(cl)) {
        this.mainOrder = parseInt(cl.replace('order-', ''))
      }
    })

    let currentOrder = this.mainOrder ? 0 : this.mainOrder + 1

    this.nav = $('<ul />', { 'class': 'nav nav-tabs' })
    $('<li />', { 'class': 'nav-item' })
      .css('order', this.mainOrder)
      .append($('<a />', {
        'class': 'nav-link' + (this.mainOrder === 0 ? ' active' : ''),
        'data-toggle': 'tab',
        href: '#main-tab'
      }).text(this.main.children('h2').hide().text()).on('click', function () {
        location.hash = $(this).attr('href')
      }))
      .appendTo(this.nav)

    this.tabsEl.forEach((el) => {
      let domEl
      if (/^group-/.test(el)) {
        domEl = $('<div />').attr('data-baton-tab', el)
        let items = el.substr(6).split('--')
        items.forEach((item) => {
          let e
          if (/^inline-/.test(item)) {
            e = this.createInlineEl(item)
          } else {
            e = this.createFieldsetEl(item)
          }
          domEl.append(e)
        })
      } else if (/^inline-/.test(el)) {
        domEl = this.createInlineEl(el, true)
      } else {
        domEl = this.createFieldsetEl(el, true)
      }
      this.domTabsEl.push(domEl)
      $('<li />', { 'class': 'nav-item' })
        .css('order', currentOrder)
        .append($('<a />', {
          'class': 'nav-link' + (currentOrder === 0 ? ' active' : ''),
          'data-toggle': 'tab',
          href: '#' + el
        }).text(domEl.find('h2:first-child').first().hide().text()).on('click', function () {
          location.hash = $(this).attr('href')
        }))
        .appendTo(this.nav)
      currentOrder += 1
      if (currentOrder === this.mainOrder) {
        currentOrder += 1
      }
    })

    this.main.before(this.nav)

    // do not preserve hash if pressing save and add another
    $('input[name="_addanother"]').on('click', function () {
      location.hash = ''
    })
  },
  createInlineEl: function (el, setDataTab = false) {
    let domEl
    if ($('#' + el.substring(7) + '_set-group').length) { // no related_name
      domEl = $('#' + el.substring(7) + '_set-group')
    } else {
      domEl = $('#' + el.substring(7) + '-group')
    }
    if (setDataTab) {
      domEl.attr('data-baton-tab', el)
    }
    return domEl
  },
  createFieldsetEl: function (el, setDataTab = false) {
    let domEl = $('.tab-' + el)
    if (setDataTab) {
      domEl.attr('data-baton-tab', el)
    }
    return domEl
  },
  createPanes: function () {
    let self = this
    this.tabContent = $('<div />', { 'class': 'tab-content' })
    this.tabMain = $('<div />', {
      'class': 'tab-pane' + (this.mainOrder === 0 ? ' active' : ''),
      'id': 'main-tab'
    }).appendTo(this.tabContent)
    this.main.parent().children(':not(.nav-tabs):not(.submit-row):not(.errornote):not(.tab-fs-none)')
      .each((index, el) => {
        $(el).appendTo(self.tabMain)
      })
    this.nav.after(this.tabContent)

    let currentOrder = this.mainOrder ? 0 : this.mainOrder + 1

    this.domTabsEl.forEach((el, index) => {
      let tabPane = $('<div />', {
        'class': 'tab-pane' + (currentOrder === 0 ? ' active' : ''),
        'id': self.tabsEl[index]
      }).appendTo(this.tabContent)
      el.appendTo(tabPane)
      currentOrder += 1
      if (currentOrder === this.mainOrder) {
        currentOrder += 1
      }
    })
  },
  showErrors: function () {
    let els = [this.main, ...this.domTabsEl]

    for (let i = 0, len = els.length; i < len; i++) {
      let el = els[i]
      if (el.find('.form-row.errors, .errorlist').length) {
        this.nav.find('a[href="#' + el.attr('data-baton-tab') + '"]').trigger('click')
        break
      }
    }
  },
  checkHash: function () {
    if (location.hash) {
      this.nav.find('a[href="' + location.hash + '"]').trigger('click')
    }
  }
}

export default Tabs
