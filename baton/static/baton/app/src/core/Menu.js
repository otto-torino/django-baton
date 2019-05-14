import $ from 'jquery'

let Menu = {
  /**
   * Menu component
   *
   * Adds a sidebar menu to the document
   */
  init: function (config, Dispatcher) {
    this.Dispatcher = Dispatcher
    this.appListUrl = config.api.app_list
    this.fixNodes()
    this.fetchData()
    this.setHeight()
  },
  fixNodes: function () {
    let container = $('<div/>', { 'class': 'container-fluid' })
    $('#footer').before(container)
    let row = $('<div/>', { 'class': 'row' })
      .appendTo(container)
    this.menu = $('<nav/>', { 'class': 'col-md-3 col-lg-2 sidebar-menu' })
      .appendTo(row)
    $('#content').addClass('col-md-9 col-lg-10')
      .prepend($('.breadcrumbs'))
      .appendTo(row)

    $('#content > h1').after($('.messagelist'))
    let title = $('<h1 />').text('Menu')
    $('<i/>', { 'class': 'fa fa-times' })
      .click(() => { $(document.body).removeClass('menu-open') })
      .appendTo(title)
    this.menu.append(title)
  },
  fetchData: function () {
    let self = this
    $.getJSON(this.appListUrl, function (data) {
      self.render(data)
      self.Dispatcher.emit('onMenuReady')
    })
    .fail(function (err) {
      console.error(err.responseText)
      self.menu.remove()
      $('#content').removeClass('col-md-9').removeClass('col-lg-10')
        .css('flex-grow', 1)
      self.Dispatcher.emit('onMenuError')
    })
  },
  setHeight: function () {
    let height = $(window).height() - $('#header').height() - 17 // nav padding and border
    this.menu.css('min-height', height + 'px')
    $('#content').css('padding-bottom', ($('#footer').height() + 20) + 'px')
  },
  render: function (data) {
    let self = this
    let mainUl = $('<ul/>', { 'class': 'depth-0' }).appendTo(self.menu)
    data.forEach((voice, index) => {
      let active = false
      if (voice.url) {
        let pathRexp = new RegExp(voice.url)
        active = pathRexp.test(location.pathname)
      }
      let li = $('<li />', { 'class': 'top-level ' + voice.type + (active ? ' active' : '') })
      let a = $('<' + (voice.url ? 'a' : 'span') + ' />', {
        href: voice.url || '#'
      }).text(voice.label).appendTo(li)
      // icon
      if (voice.icon) {
        $('<i />', { 'class': voice.icon }).prependTo(a)
      }
      let subUl
      if (voice.children && voice.children.length) {
        subUl = $('<ul />', { 'class': 'depth-1' }).appendTo(li)
        a.addClass('has-children')

        voice.children.forEach((model, i) => {
          let active = false
          if (model.url) {
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
          }).text(model.label).appendTo(subLi)
          // icon
          if (model.icon) {
            $('<i />', { 'class': model.icon }).prependTo(a)
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
      if (p.hasClass('open')) {
        p.removeClass('open')
        depth1.children('.nav-back').remove()
        depth0.css('overflow', 'auto')
      } else {
        if (p.hasClass('top-level')) {
          $('.top-level').removeClass('open')
          $('.top-level').find('.nav-back').remove()
        }
        p.addClass('open')
        let back = $('<li class="nav-item nav-back"><a href="#"><i class="fa fa-angle-double-left"></i> ' + // eslint-disable-line
                     $(this).text() + '</a></li>')
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
