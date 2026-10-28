import $ from 'jquery'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'
import Breakpoints from './Breakpoints'
import Translator from './i18n'

const Menu = {
  /**
   * Menu component
   *
   * Adds a sidebar menu to the document
   */
  init: function (config, Dispatcher) {
    this.Dispatcher = Dispatcher
    this.t = new Translator($('html').attr('lang'))
    this.collapsableUserArea = config.collapsableUserArea
    this.menuTitle = config.menuTitle
    this.searchField = config.searchField
    this.appListUrl = config.api.app_list
    this.gravatarUrl = config.api.gravatar
    this.gravatarDefaultImg = config.gravatarDefaultImg
    this.gravatarEnabled = config.gravatarEnabled
    this.alwaysCollapsed = $('#header').hasClass('menu-always-collapsed')
    this.fixNodes()
    if (!this.alwaysCollapsed) {
      this.manageCollapse()
    }
    this.brandingClone = $('#branding').clone()
    this.manageBrandingUserTools()
    this.addThemeToggle(config)
    this.searchTimeout = null
    this.manageSearchField()
    this.fetchData()
    this.setHeight()
    const self = this
    $(window).on('resize', function () {
      self.setHeight()
      self.manageBrandingUserTools()
      self.addThemeToggle(config)
    })
  },
  fixNodes: function () {
    const container = $('<div/>', { class: 'container-fluid' })
    $('#footer').before(container)
    const row = $('<div/>', { class: 'row' }).appendTo(container)
    this.menu = $('<nav/>', { class: 'col-lg-3 col-xl-2 sidebar-menu' }).appendTo(row)
    $('#content').addClass('col-lg-9 col-xl-10').prepend($('.breadcrumbs')).appendTo(row)

    $('#content > h1').after($('.messagelist'))

    const title = $('<h1 />', { class: 'd-flex align-items-center justify-content-between d-lg-none' }).text(
      this.menuTitle ? this.menuTitle : 'Menu',
    )
    $('<i class="material-symbols-outlined toggle-menu" style="font-size: 36px; line-height: 36px;">close</i>')
      .on('click', () => {
        $(document.body).removeClass('menu-open')
      })
      .appendTo(title)
    this.menu.append(title)

    if (this.alwaysCollapsed) {
      $('<i class="material-symbols-outlined toggle-menu toggle-menu-ac">close</i>')
        .appendTo(this.menu)
        .on('click', () => {
          $(document.body).removeClass('menu-open')
        })
    }
  },
  manageCollapse: function () {
    // desktop only: the sidebar can be reduced to the voices icons
    this.collapseToggle = $('<a />', { class: 'menu-collapse-toggle d-none d-lg-flex', href: '#' })
      .on('click', (e) => {
        e.preventDefault()
        this.setCollapsed(!$(document.body).hasClass('menu-collapsed'))
      })
      .appendTo(this.menu)
    this.setCollapsed(localStorage.getItem('baton-menu-collapsed') === 'true')

    // the submenus and the user links of a collapsed sidebar open as a flyout next to it
    this.menu.on('mouseenter', '.depth-0 > li, #user-tools-sidebar', (e) => {
      if (this.isCollapsed() && $(e.currentTarget).children('.depth-1, .menu-group, .user-links').length) {
        this.openFlyout($(e.currentTarget))
      }
    })
    this.menu.on('mouseleave', '.depth-0 > li, #user-tools-sidebar', (e) => {
      this.closeFlyouts($(e.currentTarget))
    })
    // touch devices have no hover, the user links open clicking the avatar
    this.menu.on('click', '#user-tools-sidebar .user-info', (e) => {
      if (this.isCollapsed()) {
        this.openFlyout($(e.currentTarget).parent())
      }
    })
    $(document).on('click', (e) => {
      if (!$(e.target).closest('.flyout').length) {
        this.closeFlyouts()
      }
    })
    // the labels tooltips are bound to the collapsed sidebar, which exists only on desktop
    this.menu[0].addEventListener('show.bs.tooltip', (e) => {
      if (!this.isCollapsed() && $(e.target).is(this.collapsedTooltipsSelector)) {
        e.preventDefault()
      }
    })
    // the flyout is fixed positioned, so it would lose its voice on scroll
    $(window).on('scroll resize', () => this.closeFlyouts())
  },
  collapsedTooltipsSelector: '.menu-collapse-toggle, .depth-0 > li > a:not(.has-children)',
  isCollapsed: function () {
    return $(document.body).hasClass('menu-collapsed') && parseInt($(window).width()) >= Breakpoints.lg
  },
  setCollapsed: function (collapsed) {
    const label = this.t.get(collapsed ? 'expandMenu' : 'collapseMenu')
    $(document.body).toggleClass('menu-collapsed', collapsed)
    this.collapseToggle
      .html(
        `<i class="material-symbols-outlined">${collapsed ? 'left_panel_open' : 'left_panel_close'}</i>` +
          `<span>${label}</span>`,
      )
      .attr('aria-label', label)
      .attr('aria-expanded', collapsed ? 'false' : 'true')
      .attr('data-label', label)
    localStorage.setItem('baton-menu-collapsed', collapsed ? 'true' : 'false')
    this.closeFlyouts()
    this.updateCollapsedTooltips()
  },
  updateCollapsedTooltips: function () {
    // when only the icons are visible, the labels are shown as tooltips
    const collapsed = $(document.body).hasClass('menu-collapsed')
    this.menu.find(this.collapsedTooltipsSelector).each(function (_, el) {
      const tooltip = bootstrap.Tooltip.getInstance(el)
      if (tooltip) {
        tooltip.dispose()
      }
      if (collapsed) {
        new bootstrap.Tooltip(el, { title: $(el).attr('data-label'), placement: 'right', trigger: 'hover' }) // eslint-disable-line no-new
      }
    })
  },
  openFlyout: function (el) {
    this.closeFlyouts()
    const panel = el.children('.depth-1, .menu-group, .user-links')
    el.addClass('flyout')
    // adjacent to the element, so that the pointer can move into it without leaving the element
    const rect = el[0].getBoundingClientRect()
    const top = Math.max(0, Math.min(rect.top, $(window).height() - panel.outerHeight()))
    panel.css({ left: rect.right + 'px', top: top + 'px' })
  },
  closeFlyouts: function (el) {
    const flyouts = el ? el.filter('.flyout') : this.menu.find('.flyout')
    // the language dropdown would be still open the next time the flyout opens.
    // Its toggle has also a tooltip, and bootstrap keeps only one instance per element,
    // so the dropdown is closed through its toggle
    flyouts.find('[data-bs-toggle="dropdown"][aria-expanded="true"]').each(function (_, el) {
      el.click()
    })
    flyouts.removeClass('flyout')
  },
  manageBrandingUserTools: function () {
    if (parseInt($(window).width()) >= 992) {
      // move user tools
      this.menu.prepend($('#user-tools'))
      if (this.alwaysCollapsed) {
        // copy branding
        this.menu.prepend(this.brandingClone)
      } else {
        // move branding
        this.menu.prepend($('#branding'))
      }
      if ($('#user-tools-sidebar').length === 0) {
        this.renderUserTools()
      }
    } else {
      $('#header').append($('#user-tools'))
      if (this.alwaysCollapsed) {
        this.menu.find('#branding').remove()
      } else {
        $('#header .navbar-toggler').after($('#branding'))
      }
      if ($('#user-tools-sidebar').length === 0) {
        this.removeUserTools()
      }
    }
  },
  addThemeToggle(config) {
    let self = this
    if (!config.forceTheme) {
      const currentTheme = $('html').attr('data-bs-theme')
      const themeToggler = $('<a />', {
        class: currentTheme === 'dark' ? 'theme-light theme-link-toggler' : 'theme-dark theme-link-toggler',
      })
        .css('cursor', 'pointer')
        .attr('title', self.t.get(currentTheme === 'dark' ? 'lightTheme' : 'darkTheme'))
        .on('click', function () {
          const currentTheme = $('html').attr('data-bs-theme')
          $('html').attr('data-theme', currentTheme === 'dark' ? 'light' : 'dark')
          $('html').attr('data-bs-theme', currentTheme === 'dark' ? 'light' : 'dark')
          $(this)
            .removeClass(currentTheme === 'dark' ? 'theme-light' : 'theme-dark')
            .addClass(currentTheme === 'dark' ? 'theme-dark' : 'theme-light')
          $(this).attr('title', self.t.get(currentTheme === 'dark' ? 'darkTheme' : 'lightTheme'))
          $(this).attr('data-bs-original-title', self.t.get(currentTheme === 'dark' ? 'darkTheme' : 'lightTheme'))
          localStorage.setItem('baton-theme', currentTheme === 'dark' ? 'light' : 'dark')
        })
      if ($('.user-links').find('.theme-link-toggler').length === 0) {
        $('.user-links').prepend(themeToggler)
      }
    }
  },
  manageSearchField() {
    // unset
    if (!this.searchField || !this.searchField.url) {
      return
    }

    const container = $('<div />', { class: 'search-field-tool' })

    const field = $('<input />', {
      class: 'form-control',
      type: 'text',
      list: 'admin-search-datalist',
      placeholder: this.searchField.label || this.t('search'),
    })
    const dataList = $('<div />', { id: 'admin-search-datalist' }).on('mouseover', (e) => {
      if ($(e.target).hasClass('datalist-option') || $(e.target).parent('.datalist-option').length) {
        dataList.find('.datalist-option').removeClass('selected')
        const item = $(e.target).hasClass('datalist-option') ? $(e.target) : $(e.target).parent('.datalist-option')
        item.addClass('selected')
      }
    })

    const navigateDataList = (code) => {
      let target
      const active = dataList.find('.datalist-option.selected').first()
      if (!active.length) {
        target = dataList.find('.datalist-option')[code === 40 ? 'first' : 'last']()
      } else {
        if (code === 40) {
          const next = active.next()
          target = next.length ? next : dataList.find('.datalist-option').first()
        } else {
          const prev = active.prev()
          target = prev.length ? prev : dataList.find('.datalist-option').last()
        }
      }
      if (target) {
        active.removeClass('selected')
        $(target).addClass('selected')
        target[0].scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest',
        })
      }
    }

    const keyUpHandler = (e) => {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      const code = e.keyCode || e.which

      if (code === 13) {
        // goto url if there is an active voice
        const active = dataList.find('.datalist-option.selected').first()
        if (active.length) {
          location.href = active.attr('data-url')
        }
        return
      }

      if ([40, 38].indexOf(code) !== -1) {
        // move
        navigateDataList(code)
      } else {
        // search
        if ($(field).val().length < 1) {
          dataList.empty()
          return
        }

        const debounced = () => {
          container.addClass('loading')
          $.getJSON(this.searchField.url, { text: $(field).val() })
            .done((data) => {
              container.removeClass('loading')
              dataList.empty()
              data.data.forEach(
                (r, index) =>
                  dataList.append(`
                    <div class="datalist-option${index === 0 ? ' selected' : ''}" onclick="location.href='${r.url}'" data-url="${r.url}">
                        <a href="${r.url}">${r.label}</a>${r.icon ? `<i class="material-symbols-outlined" onclick="location.href='${r.url}'">${r.icon}</i>` : ''}
                    </div>`), // eslint-disable-line
              )
            })
            .fail((jqxhr, textStatus, err) => {
              console.log(err)
              container.removeClass('loading')
              dataList.empty()
            })
        }

        this.searchTimeout = setTimeout(debounced, 300)
      }
    }
    field.on('keyup', keyUpHandler)
    field.on('blur', (_) => setTimeout(() => dataList.hide(), 250))
    field.on('focus', (_) => dataList.show())
    container.on('click', (_) => {
      if (this.isCollapsed()) {
        this.setCollapsed(false)
        field.trigger('focus')
      }
    })

    $('#user-tools-sidebar').after(container.append([field, dataList]))
  },
  renderUserTools: function () {
    const self = this
    const container = $('<div />', { id: 'user-tools-sidebar' })
    const expandUserArea = $('<i class="material-symbols-outlined user-area-toggler">keyboard_arrow_down</i>').on(
      'click',
      function () {
        const t = $(this).text()
        $(this)
          .text(t === 'keyboard_arrow_down' ? 'keyboard_arrow_up' : 'keyboard_arrow_down')
          .css('margin-bottom', t === 'keyboard_arrow_down' ? '1rem' : '0')
        container.toggleClass('collapsed')
      },
    )
    if (this.collapsableUserArea) {
      container.addClass('collapsed')
    }
    container.insertAfter('#user-tools')
    const username = $('#user-tools .dropdown-toggle').text()
    const userInfo = $('<div />', { class: 'user-info' })
      .html('<div>' + username + '</div>')
      .appendTo(container)
    // gravatar
    if (this.gravatarEnabled) {
      // eslint-disable-next-line max-len
      const gravatarSpinner = $('<div class="spinner-border text-primary" role="status"></div>')
      userInfo.prepend(gravatarSpinner)
      $.getJSON(this.gravatarUrl, function (data) {
        const img = $('<img />', {
          class: 'gravatar-icon',
          src: 'https://www.gravatar.com/avatar/{hash}?s=50&d={default}'
            .replace('{hash}', data.hash)
            .replace('{default}', self.gravatarDefaultImg),
        })
        gravatarSpinner.replaceWith(img)
        if (self.collapsableUserArea) {
          img.after(expandUserArea)
        }
      }).fail(function (err) {
        console.error(err.responseText)
        const img = $('<img />', {
          class: 'gravatar-icon',
          src: 'https://www.gravatar.com/avatar/{hash}?s=50&d={default}'
            .replace('{hash}', '')
            .replace('{default}', self.gravatarDefaultImg),
        })
        gravatarSpinner.replaceWith(img)
        if (self.collapsableUserArea) {
          img.after(expandUserArea)
        }
      })
    } else {
      // shown in place of the gravatar when the sidebar is collapsed
      userInfo.prepend('<i class="material-symbols-outlined user-icon">account_circle</i>')
      if (self.collapsableUserArea) {
        userInfo.prepend(expandUserArea)
      }
    }
    const linksContainer = $('<div />', { class: 'user-links' }).attr('data-label', username).appendTo(container)
    $('#user-tools .dropdown-menu a:not(.dropdown-item-theme)').each(function (_, el) {
      let cls = 'view-site'
      if (/password_change/.test($(el).attr('href'))) {
        cls = 'password'
      } else if (/logout/.test($(el).attr('href')) || $(el).attr('data-item') === 'logout') {
        cls = 'logout'
      }
      const text = $(el).text()
      const clone = $(el).clone(true, true).html('').attr('class', cls).attr('title', text)
      if (cls === 'view-site') {
        clone.attr('target', '_blank')
      }
      linksContainer.append(clone)
    })
    this.renderLanguageSwitcher(linksContainer)
  },
  renderLanguageSwitcher: function (linksContainer) {
    const self = this
    const form = $('form[data-baton-language-switcher]')
    if (form.length === 0) {
      return
    }
    const select = form.find('select')
    const options = select.find('option')
    if (options.length < 2) {
      return
    }
    // the raw form is replaced by the sidebar dropdown, it stays in the dom as submit target
    // remove d-flex (display:flex !important) so the inline display:none from hide() wins
    form.removeClass('d-flex').hide()
    const wrapper = $('<div />', { class: 'dropdown language-switcher' })
    const toggle = $('<a />', {
      class: 'language',
      href: '#',
      title: self.t.get('language'),
    }).attr('data-bs-toggle', 'dropdown')
    const menu = $('<div />', { class: 'dropdown-menu' })
    options.each(function () {
      const code = $(this).attr('value')
      $('<a />', {
        class: 'dropdown-item' + ($(this).is(':selected') ? ' active' : ''),
        href: '#',
      })
        .text($(this).text())
        .on('click', function (e) {
          e.preventDefault()
          select.val(code)
          form[0].submit()
        })
        .appendTo(menu)
    })
    wrapper.append([toggle, menu])
    linksContainer.append(wrapper)
  },
  removeUserTools: function () {
    // on mobile the sidebar dropdown is gone, restore the raw language form in the header
    $('form[data-baton-language-switcher]').addClass('d-flex').show()
    $('#user-tools-sidebar').remove()
  },
  fetchData: function () {
    const self = this
    $.getJSON(this.appListUrl, function (data) {
      self.render(data)
      self.Dispatcher.emit('onMenuReady')
    }).fail(function (err) {
      console.error(err.responseText)
      self.menu.remove()
      $('#content').removeClass('col-md-9').removeClass('col-lg-10').css('flex-grow', 1)
      self.Dispatcher.emit('onMenuError')
    })
  },
  setHeight: function () {
    const height = $(window).height() - $('#header').height() - 19 // nav padding and border
    this.menu.css('min-height', height + 'px')
    $('#content').css('padding-bottom', $('.site-footer').height() + 20 + 'px')
  },
  render: function (data) {
    const self = this
    const mainUl = $('<ul/>', { class: 'depth-0' }).appendTo(self.menu)
    data.forEach((voice, _) => {
      let active = false
      if (voice.type === 'free') {
        if (voice.re) {
          const re = new RegExp(voice.re)
          active = re.test(location.pathname)
        } else {
          active = location.pathname === voice.url
        }
      } else {
        if (voice.url) {
          const pathRexp = new RegExp(voice.url)
          active = pathRexp.test(location.pathname)
        }
      }
      const li = $('<li />', {
        class: 'top-level ' + voice.type + (voice.defaultOpen ? ' default-open' : '') + (active ? ' active' : ''),
      })
      const a = $('<' + (voice.url ? 'a' : 'span') + ' />', {
        href: voice.url || '#',
      })
        .text(voice.label)
        .attr('data-label', voice.label)
        .appendTo(li)
      // icon
      if (voice.icon) {
        $(`<i class="material-symbols-outlined">${voice.icon}</i>`).prependTo(a)
      } else {
        // shown in place of the icon when the sidebar is collapsed
        $('<i />', { class: 'voice-initial' }).text(voice.label.trim().charAt(0)).prependTo(a)
      }
      let subUl
      if (voice.children && voice.children.length) {
        subUl = $('<ul />', { class: 'depth-1' }).attr('data-label', voice.label).appendTo(li)
        a.addClass('has-children')

        voice.children.forEach((model, _) => {
          let active = false
          if (model.type === 'free') {
            if (model.re) {
              const re = new RegExp(model.re)
              active = re.test(location.pathname)
            } else {
              active = location.pathname === model.url
            }
          } else if (model.url) {
            const pathRexp = new RegExp(model.url)
            active = pathRexp.test(location.pathname)
          }
          const subLi = $('<li />')
          if (active) {
            subLi.addClass('active')
            li.addClass('with-active')
          }
          const a = $('<a />', {
            href: model.url,
          })
            .text(model.label)
            .appendTo(subLi)
          // icon
          if (model.icon) {
            $(`<i class="material-symbols-outlined">${model.icon}</i>`).prependTo(a)
          }
          subLi.appendTo(subUl)
        })
      }
      li.appendTo(mainUl)
    })

    // the voices following a title without children belong to it: when the sidebar is collapsed
    // only the title icon is shown, and its voices open in the title flyout
    mainUl.children('.title').each(function () {
      const title = $(this)
      const voices = title.nextUntil('.title')
      if (title.children('.depth-1').length || !voices.length) {
        return
      }
      const group = $('<ul />', { class: 'menu-group' }).attr('data-label', title.children('span').attr('data-label'))
      voices.addClass('grouped').each(function () {
        const voice = $(this)
        const link = voice.children('a, span').first()
        const groupLink = $(link.is('a') ? '<a />' : '<span />', { href: link.attr('href') }).text(link.attr('data-label'))
        if (voice.children('.depth-1').length) {
          $('<li />', { class: 'menu-group-label' }).append(groupLink).appendTo(group)
          voice.find('.depth-1 > li').clone().addClass('menu-group-child').appendTo(group)
        } else {
          $('<li />', { class: voice.hasClass('active') ? 'active' : '' })
            .append(groupLink)
            .appendTo(group)
        }
        if (voice.is('.active, .with-active')) {
          title.addClass('group-active')
        }
      })
      title.addClass('has-group').append(group)
    })

    const menu = this
    // touch devices have no hover, the flyout opens on click and closes clicking outside
    mainUl
      .children('.has-group')
      .children('span')
      .on('click', function () {
        if (menu.isCollapsed()) {
          menu.openFlyout($(this).parent())
        }
      })
    $('.has-children').on('click', function (evt) {
      evt.preventDefault()
      const p = $(this).parent()
      if (menu.isCollapsed()) {
        // touch devices have no hover, the flyout opens on click and closes clicking outside
        menu.openFlyout(p)
        return
      }
      const self = this
      const depth0 = $('.depth-0')
      const depth1 = p.children('ul')
      if (p.hasClass('open') || (p.hasClass('default-open') && !$('body').hasClass('menu-open'))) {
        p.removeClass('open default-open')
        depth1.children('.nav-back').remove()
        depth0.css('overflow', 'auto')
      } else {
        if (p.hasClass('top-level')) {
          $('.top-level').removeClass('open')
          $('.top-level').find('.nav-back').remove()
        }
        p.addClass('open')
        const justText = $(this).clone()
        justText.find('i').remove()
        const back = $(
          '<li class="nav-item nav-back"><a href="#"><i class="material-symbols-outlined">keyboard_double_arrow_left</i> ' + // eslint-disable-line
            justText.text() +
            '</a></li>',
        )
        back.on('click', function () {
          $(self).trigger('click')
        })
        depth1.prepend(back)
        depth0.css('overflow', 'hidden')
        depth0.scrollTop(0) // return to top
      }
    })

    if (this.collapseToggle) {
      this.updateCollapsedTooltips()
    }
  },
}

export default Menu
