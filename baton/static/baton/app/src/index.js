// jQuery is provided by webpack provider plugin
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'
import './styles/baton.scss'

import Dispatcher from 'js-event-dispatcher/dist/EventDispatcher'
import Navbar from './core/Navbar'
import Footer from './core/Footer'
import Menu from './core/Menu'
import ActionResult from './core/ActionResult'
import PasswordChange from './core/PasswordChange'
import Tabs from './core/Tabs'
import ChangeList from './core/ChangeList'
import ChangeForm from './core/ChangeForm'
import Login from './core/Login'
import AdminDocs from './core/AdminDocs'
import Modal from './core/Modal'
import Messages from './core/Messages'
import Translator from './core/i18n'
import AI from './core/AI'

window.Baton = {
  intialized: false,
  init: function (config) {
    console.info('Baton:', 'init')
    console.info('Baton:', `rev ${BATON_REVISION}`)

    this.initialized = true
    const page = this.detectPageHook ? this.detectPageHook(this.page) : this.page()
    $('body').addClass('page-' + page)

    // theme
    const theme = $('html').attr('data-bs-theme')
    if (!localStorage.getItem('baton-theme')) {
      localStorage.setItem('baton-theme', theme)
    }
    console.info('Baton:', 'theme: ' + theme)

    // toasts
    Messages.init(config)

    if (page !== 'login' && page !== 'logout' && !/_popup/.test(location.search)) {
      Navbar.init(config)
      Dispatcher.emit('onNavbarReady')
      Menu.init(config, Dispatcher)
    }
    if (page === 'login') {
      Login.init(config)
    } else if (page === 'logout' || page === 'password_change_success') {
      ActionResult.init()
    } else if (page === 'password_change') {
      PasswordChange.init()
    } else if (page === 'changelist') {
      ChangeList.init(config)
    } else if (page === 'add_form' || page === 'change_form') {
      ChangeForm.init(config, Dispatcher)
    } else if (page === 'admindocs') {
      AdminDocs.init()
    }
    Footer.init({
      remove: /_popup/.test(location.search),
    })

    // tabs
    if (page === 'add_form' || page === 'change_form') {
      Tabs.init(Dispatcher)
    }

    // AI
    AI.init(config, page)

    // tooltips
    setTimeout(this.loadTooltips, 1000) // wait a bit for tinymce

    console.info('Baton:', 'ready')
    $('.baton-startup-overlay').remove()
    document.body.className += ' baton-ready'

    if (config.menuAlwaysCollapsed) {
      document.body.className += ' menu-mobile'
    }
    Dispatcher.emit('onReady')
  },
  loadTooltips: function () {
    const tooltipTriggerList = [].slice.call($('[title]:not(iframe):not(option)'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  },
  page: function () {
    if (/^(\/[a-z]{2})?\/admin\/$/.test(location.pathname)) {
      return 'dashboard'
    } else if (/^(\/[a-z]{2})?\/admin\/doc\//.test(location.pathname)) {
      return 'admindocs'
    } else if (/^(\/[a-z]{2})?\/admin\/login\/$/.test(location.pathname)) {
      return 'login'
    } else if (/^(\/[a-z]{2})?\/admin\/logout\/$/.test(location.pathname)) {
      return 'logout'
    } else if (/^(\/[a-z]{2})?\/admin\/password_change\/$/.test(location.pathname)) {
      return 'password_change'
    } else if (/^(\/[a-z]{2})?\/admin\/password_change\/done\/$/.test(location.pathname)) {
      return 'password_change_success'
    } else if (/\/add\//.test(location.pathname)) {
      return 'add_form'
    } else if (/\/change\//.test(location.pathname)) {
      return 'change_form'
    } else if (document.getElementById('changelist')) {
      return 'changelist'
    } else if (
      document.getElementById('change-history') ||
      /^(\/[a-z]{2})?\/admin\/[^/]+\/[^/]+\/[^/]+\/history/.test(location.pathname)
    ) {
      return 'changehistory'
    } else {
      return 'default'
    }
  },
  Dispatcher: Dispatcher,
  Modal: Modal,
  jQuery: jQuery,
  AI: AI,
  T: new Translator(jQuery('html').attr('lang')),
}

window.bootstrap = bootstrap
