// jQuery is provided by webpack provider plugin
import 'bootstrap/dist/js/bootstrap'
import './styles/baton.scss'

import Dispatcher from 'js-event-dispatcher/dist/EventDispatcher'
import Navbar from 'core/Navbar'
import Footer from 'core/Footer'
import Menu from 'core/Menu'
import ActionResult from 'core/ActionResult'
import PasswordChange from 'core/PasswordChange'
import Analytics from 'core/Analytics'
import Tabs from 'core/Tabs'
import ChangeList from 'core/ChangeList'
import ChangeForm from 'core/ChangeForm'
import Filer from 'core/Filer'

window.Baton = {
  intialized: false,
  init: function (config) {
    console.info('Baton:', 'init')
    this.initialized = true
    let page = this.page()

    Navbar.init()
    Dispatcher.emit('onNavbarReady')
    if (page !== 'login' && !/_popup/.test(location.search)) {
      Menu.init(config, Dispatcher)
    }
    if (page === 'logout' || page === 'password_change_success') {
      ActionResult.init()
    } else if (page === 'password_change') {
      PasswordChange.init()
    } else if (page === 'changelist') {
      ChangeList.init()
    } else if (page === 'add_form' || page === 'change_form') {
      ChangeForm.init({
        confirmUnsavedChanges: config.confirmUnsavedChanges,
        showMultipartUploading: config.showMultipartUploading
      })
    } else if (page === 'filer') {
      Filer.init()
    }
    Footer.init({
      remove: /_popup/.test(location.search)
    })

    // tabs
    if (page === 'add_form' || page === 'change_form') {
      Tabs.init()
    }
    console.info('Baton:', 'ready')
    document.body.className += ' baton-ready'
    Dispatcher.emit('onReady')
  },
  page: function () {
    if (/^(\/[a-z]{2})?\/admin\/$/.test(location.pathname)) {
      return 'dashboard'
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
    } else if (/\/filer\//.test(location.pathname)) {
      return 'filer'
    }
  },
  Analytics: Analytics,
  Dispatcher: Dispatcher
}
window.jQuery = jQuery
