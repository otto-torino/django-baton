import $ from 'jquery'
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
      $('<i class="material-symbols-outlined toggle-menu">close</i>')
        .appendTo(this.menu)
        .on('click', () => {
          $(document.body).removeClass('menu-open')
        })
    }
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
    const userInfo = $('<div />', { class: 'user-info' })
      .html('<div>' + $('#user-tools .dropdown-toggle').text() + '</div>')
      .appendTo(container)
    // gravatar
    if (this.gravatarEnabled) {
      // eslint-disable-next-line max-len
      const gravatarSpinner = $(
        '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>',
      )
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
    } else if (self.collapsableUserArea) {
      userInfo.prepend(expandUserArea)
    }
    const linksContainer = $('<div />', { class: 'user-links' }).appendTo(container)
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
  },
  removeUserTools: function () {
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
        .appendTo(li)
      // icon
      if (voice.icon) {
        $(`<i class="material-symbols-outlined">${voice.icon}</i>`).prependTo(a)
      }
      let subUl
      if (voice.children && voice.children.length) {
        subUl = $('<ul />', { class: 'depth-1' }).appendTo(li)
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
            $('<i />', { class: model.icon }).prependTo(a)
          }
          subLi.appendTo(subUl)
        })
      }
      li.appendTo(mainUl)
    })

    $('.has-children').on('click', function (evt) {
      evt.preventDefault()
      const self = this
      const p = $(this).parent()
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
  },
}

export default Menu
