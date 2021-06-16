import $ from 'jquery'
import Translator from './i18n'

let Menu = {
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
    this.alwaysCollapsed = $('#header').hasClass('menu-always-collapsed')
    this.fixNodes()
    this.brandingClone = $('#branding').clone()
    this.manageBrandingUserTools()
    this.manageSearchField()
    this.fetchData()
    this.setHeight()
    let self = this
    $(window).on('resize', function () {
      self.setHeight()
      self.manageBrandingUserTools()
    })
  },
  fixNodes: function () {
    let container = $('<div/>', { class: 'container-fluid' })
    $('#footer').before(container)
    let row = $('<div/>', { class: 'row' }).appendTo(container)
    this.menu = $('<nav/>', { class: 'col-lg-2 sidebar-menu' }).appendTo(row)
    $('#content')
      .addClass('col-lg-10')
      .prepend($('.breadcrumbs'))
      .appendTo(row)

    $('#content > h1').after($('.messagelist'))

    let title = $('<h1 />', { class: 'd-block d-lg-none' }).text(
      this.menuTitle ? this.menuTitle : 'Menu'
    )
    $('<i/>', { class: 'fa fa-times' })
      .click(() => {
        $(document.body).removeClass('menu-open')
      })
      .appendTo(title)
    this.menu.append(title)

    if (this.alwaysCollapsed) {
      let close = $('<i />', { class: 'fa fa-times toggle-menu' })
        .appendTo(this.menu)
        .click(() => {
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
  manageSearchField () {
    // unset
    if (!this.searchField || !this.searchField.url) {
      return
    }

    let container = $('<div />', { class: 'search-field-tool' })

    let field = $('<input />', {
      class: 'form-control form-control-sm',
      type: 'text',
      list: 'admin-search-datalist',
      placeholder: this.searchField.label || this.t('search')
    })
    let dataList = $('<div />', { id: 'admin-search-datalist' }).on('mouseover', e => {
      if ($(e.target).hasClass('datalist-option') || $(e.target).parent('.datalist-option').length) {
        dataList.find('.datalist-option').removeClass('selected')
        let item = $(e.target).hasClass('datalist-option') ? $(e.target) : $(e.target).parent('.datalist-option')
        item.addClass('selected')
      }
    })

    let navigateDataList = code => {
      let target
      let active = dataList.find('.datalist-option.selected').first()
      if (!active.length) {
        target = dataList.find('.datalist-option')[code === 40 ? 'first' : 'last']()
      } else {
        if (code === 40) {
          let next = active.next()
          target = next.length ? next : dataList.find('.datalist-option').first()
        } else {
          let prev = active.prev()
          target = prev.length ? prev : dataList.find('.datalist-option').last()
        }
      }
      if (target) {
        active.removeClass('selected')
        $(target).addClass('selected')
        target[0].scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        })
      }
    }

    field.on('blur', e => setTimeout(() => dataList.hide(), 150))
    field.on('focus', e => dataList.show())
    field.on('keyup', e => {
      var code = e.keyCode || e.which

      if (code === 13) {
        // goto url if there is an active voice
        let active = dataList.find('.datalist-option.selected').first()
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

        container.addClass('loading')
        $.getJSON(this.searchField.url, { text: $(field).val() })
          .done(data => {
            container.removeClass('loading')
            dataList.empty()
            data.data.forEach((r, index) => dataList.append(`
              <div class="datalist-option${index === 0 ? ' selected' : ''}" onclick="location.href='${r.url}'" data-url="${r.url}"><a href="${r.url}">${r.label}</a>${r.icon ? `<i onclick="location.href='${r.url}'" class="${r.icon}"></i>` : ''}</div>`)
            )
          })
          .fail((jqxhr, textStatus, err) => {
            console.log(err)
            container.removeClass('loading')
            dataList.empty()
          })
      }
    })

    $('#user-tools-sidebar').after(container.append([field, dataList]))
  },
  renderUserTools: function () {
    let self = this
    let container = $('<div />', { id: 'user-tools-sidebar' })
    let expandUserArea = $('<i />', {'class': 'fa fa-angle-down user-area-toggler'}).on('click', function () {
      $(this).toggleClass('fa-angle-up')
      container.toggleClass('collapsed')
    })
    if (this.collapsableUserArea) {
      container.addClass('collapsed')
    }
    container.insertAfter('#user-tools')
    let userInfo = $('<div />', { class: 'user-info' })
      .html(
        '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div><div>' +
          $('#user-tools .dropdown-toggle').text() +
          '</div>'
      )
      .appendTo(container)
    // gravatar
    $.getJSON(this.gravatarUrl, function (data) {
      let img = $('<img />', {
        class: 'gravatar-icon',
        src: 'https://www.gravatar.com/avatar/{hash}?s=50&d={default}'
          .replace('{hash}', data.hash)
          .replace('{default}', self.gravatarDefaultImg)
      })
      userInfo.find('.spinner-border').replaceWith(img)
      if (self.collapsableUserArea) {
        img.after(expandUserArea)
      }
    }).fail(function (err) {
      console.error(err.responseText)
      let img = $('<img />', {
        class: 'gravatar-icon',
        src: 'https://www.gravatar.com/avatar/{hash}?s=50&d={default}'
          .replace('{hash}', '')
          .replace('{default}', self.gravatarDefaultImg)
      })
      userInfo.find('.spinner-border').replaceWith(img)
      if (self.collapsableUserArea) {
        img.after(expandUserArea)
      }
    })
    let linksContainer = $('<div />', { class: 'user-links' }).appendTo(
      container
    )
    $('#user-tools .dropdown-menu a').each(function (index, el) {
      let cls = 'view-site'
      if (/password_change/.test($(el).attr('href'))) {
        cls = 'password'
      } else if (/logout/.test($(el).attr('href'))) {
        cls = 'logout'
      }
      let text = $(el).text()
      let clone = $(el)
        .clone()
        .html('')
        .attr('class', cls)
        .attr('title', text)
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
    let self = this
    $.getJSON(this.appListUrl, function (data) {
      self.render(data)
      self.Dispatcher.emit('onMenuReady')
    }).fail(function (err) {
      console.error(err.responseText)
      self.menu.remove()
      $('#content')
        .removeClass('col-md-9')
        .removeClass('col-lg-10')
        .css('flex-grow', 1)
      self.Dispatcher.emit('onMenuError')
    })
  },
  setHeight: function () {
    let height = $(window).height() - $('#header').height() - 19 // nav padding and border
    this.menu.css('min-height', height + 'px')
    $('#content').css('padding-bottom', $('#footer').height() + 20 + 'px')
  },
  render: function (data) {
    let self = this
    let mainUl = $('<ul/>', { class: 'depth-0' }).appendTo(self.menu)
    data.forEach((voice, index) => {
      let active = false
      if (voice.type === 'free') {
        if (voice.re) {
          let re = new RegExp(voice.re)
          active = re.test(location.pathname)
        } else {
          active = location.pathname === voice.url
        }
      } else {
        if (voice.url) {
          let pathRexp = new RegExp(voice.url)
          active = pathRexp.test(location.pathname)
        }
      }
      let li = $('<li />', {
        class:
          'top-level ' +
          voice.type +
          (voice.defaultOpen ? ' default-open' : '') +
          (active ? ' active' : '')
      })
      let a = $('<' + (voice.url ? 'a' : 'span') + ' />', {
        href: voice.url || '#'
      })
        .text(voice.label)
        .appendTo(li)
      // icon
      if (voice.icon) {
        $('<i />', { class: voice.icon }).prependTo(a)
      }
      let subUl
      if (voice.children && voice.children.length) {
        subUl = $('<ul />', { class: 'depth-1' }).appendTo(li)
        a.addClass('has-children')

        voice.children.forEach((model, i) => {
          let active = false
          if (model.type === 'free') {
            if (model.re) {
              let re = new RegExp(model.re)
              active = re.test(location.pathname)
            } else {
              active = location.pathname === model.url
            }
          } else if (model.url) {
            let pathRexp = new RegExp(model.url)
            active = pathRexp.test(location.pathname)
          }
          let subLi = $('<li />')
          if (active) {
            subLi.addClass('active')
            li.addClass('with-active')
          }
          let a = $('<a />', {
            href: model.url
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
      let self = this
      let p = $(this).parent()
      let depth0 = $('.depth-0')
      let depth1 = p.children('ul')
      if (
        p.hasClass('open') ||
        (p.hasClass('default-open') && !$('body').hasClass('menu-open'))
      ) {
        p.removeClass('open default-open')
        depth1.children('.nav-back').remove()
        depth0.css('overflow', 'auto')
      } else {
        if (p.hasClass('top-level')) {
          $('.top-level').removeClass('open')
          $('.top-level')
            .find('.nav-back')
            .remove()
        }
        p.addClass('open')
        let back = $(
          '<li class="nav-item nav-back"><a href="#"><i class="fa fa-angle-double-left"></i> ' + // eslint-disable-line
            $(this).text() +
            '</a></li>'
        )
        back.on('click', function () {
          $(self).trigger('click')
        })
        depth1.prepend(back)
        depth0.css('overflow', 'hidden')
        depth0.scrollTop(0) // return to top
      }
    })
  }
}

export default Menu
