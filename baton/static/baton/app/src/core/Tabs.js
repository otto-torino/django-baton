import $ from 'jquery'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle'

const Tabs = {
    /**
     * Tabs component
     */
    init: function(Dispatcher) {
        this.Dispatcher = Dispatcher
        if (this.shouldRun()) {
            console.info('Baton:', 'generating tabs')
            this.main.attr('data-baton-tab', 'main-tab')
            this.createNav()
            this.createPanes()
            this.checkHash()
            this.showErrors()
            this.Dispatcher.emit('onTabsReady')
        }
    },
    shouldRun: function() {
        this.main = $('#content-main form .baton-tabs-init')
        return this.main.length === 1
    },
    createNav: function() {
        let self = this
        this.mainOrder = 0
        this.tabsEl = []
        this.domTabsEl = []
        const classes = this.main.attr('class')
        classes.split(' ').forEach((cl) => {
            if (/baton-tab-/.test(cl)) {
                this.tabsEl.push(cl.substring(10))
            }
            if (/order-/.test(cl)) {
                this.mainOrder = parseInt(cl.replace('order-', ''))
            }
        })

        let currentOrder = this.mainOrder ? 0 : this.mainOrder + 1

        this.nav = $('<ul />', { class: 'nav nav-tabs' })
        $('<li />', { class: 'nav-item' })
            .css('order', this.mainOrder)
            .append(
                $('<a />', {
                    class: 'nav-link' + (this.mainOrder === 0 ? ' active' : ''),
                    'data-bs-toggle': 'tab',
                    'data-bs-target': '#main-tab',
                    // href: '#main-tab'
                }).text(this.main.children('h2').hide().text()),
            )
            .appendTo(this.nav)

        this.tabsEl.forEach((el) => {
            let domEl
            if (/^group-/.test(el)) {
                domEl = $('<div />').attr('data-baton-tab', el)
                const items = el.substr(6).split('--')
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
            $('<li />', { class: 'nav-item ' })
                .css('order', currentOrder)
                .append(
                    $('<a />', {
                        class: 'nav-link ' + (currentOrder === 0 ? ' active' : ''),
                        'data-bs-toggle': 'tab',
                        'data-bs-target': '#' + el,
                        // href: '#' + el
                    }).text(domEl.find('h2:first-child').first().hide().text()),
                )
                .appendTo(this.nav)
            currentOrder += 1
            if (currentOrder === this.mainOrder) {
                currentOrder += 1
            }
        })

        this.main.before(this.nav)

        $('a[data-bs-toggle="tab"]').each(function(index, el) {
            el.addEventListener('shown.bs.tab', function(e) {
                self.Dispatcher.emit('onTabChanged')
                // add hash to stay in same tab when save and continue
                const hash = $(e.target).attr('data-bs-target')
                e.preventDefault()
                history.replaceState({}, '', hash)
                // window.location.replace(hash) // adding with replace won't add an history entry
                const tooltipTriggerList = [].slice.call($('[title]:not(iframe)'))
                tooltipTriggerList.map(function(tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl)
                })
            })
        })
    },
    createInlineEl: function(el, setDataTab = false) {
        let domEl
        if ($('#' + el.substring(7) + '_set-group').length) {
            // no related_name
            domEl = $('#' + el.substring(7) + '_set-group')
        } else {
            domEl = $('#' + el.substring(7) + '-group')
        }
        if (setDataTab) {
            domEl.attr('data-baton-tab', el)
        }
        return domEl
    },
    createFieldsetEl: function(el, setDataTab = false) {
        const domEl = $('.tab-' + el)
        if (setDataTab) {
            domEl.attr('data-baton-tab', el)
        }
        return domEl
    },
    createPanes: function() {
        const self = this
        this.tabContent = $('<div />', { class: 'tab-content' })
        this.tabMain = $('<div />', {
            class: 'tab-pane fade' + (this.mainOrder === 0 ? ' active show' : ''),
            id: 'main-tab',
        }).appendTo(this.tabContent)
        this.main
            .parent()
            .children(':not(.nav-tabs):not(.submit-row):not(.errornote):not(.tab-fs-none)')
            .each((_, el) => {
                $(el).appendTo(self.tabMain)
            })
        this.nav.after(this.tabContent)

        let currentOrder = this.mainOrder ? 0 : this.mainOrder + 1

        this.domTabsEl.forEach((el, index) => {
            const tabPane = $('<div />', {
                class: 'tab-pane' + (currentOrder === 0 ? ' active show' : ''),
                id: self.tabsEl[index],
            }).appendTo(this.tabContent)
            el.appendTo(tabPane)
            currentOrder += 1
            if (currentOrder === this.mainOrder) {
                currentOrder += 1
            }
        })
    },
    showErrors: function() {
        const els = [this.main, ...this.domTabsEl]
        for (let i = 0, len = els.length; i < len; i++) {
            const el = els[i]
            if (el.find('.form-row.errors, .errorlist').length) {
                const tab = new bootstrap.Tab(this.nav.find('a[data-bs-target="#' + el.attr('data-baton-tab') + '"]')[0])
                tab.show()
                break
            }
        }

        // move nonfield errors outside of tabs
        $('.errornote').after($('.errorlist.nonfield'))
    },
    checkHash: function() {
        if (location.hash && this.nav.find('a[data-bs-target="' + location.hash + '"]').length) {
            const tab = new bootstrap.Tab(this.nav.find('a[data-bs-target="' + location.hash + '"]')[0])
            tab.show()
        }
    },
}

export default Tabs
