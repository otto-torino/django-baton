Js Utilities
==================

Baton comes with a number of exported js modules you can use to enhance your admin application.

Dispatcher
----------

Baton Dispatcher singleton module lets you subscribe to event and dispatch them, making use of the Mediator pattern.

Example: ::

    // register a callback tied to the event
    Baton.Dispatcher.register('myAppLoaded', function (evtName, s) { console.log('COOL ' + s) })

    // emit the event
    Baton.Dispatcher.emit('myAppLoaded', 'STUFF!')

Modal
-----

Baton Modal class lets you insert some content on a bootstrap modal without dealing with all the markup.

Usage: ::

    // modal configuration:
    //
    // let config = {
    //     title: 'My modal title',
    //     subtitle: 'My subtitle', // optional
    //     content: '<p>my html content</p>', // alternative to url
    //     url: '/my/url', // url used to perform an ajax request, the response is put inside the modal body. Alternative to content.
    //     hideFooter: false, // optional
    //     showBackBtn: false, // show a back button near the close icon, optional
    //     backBtnCb: function () {}, // back button click callback (useful to have a multi step modal), optional
    //     actionBtnLabel: 'save', // action button label, default 'save', optional
    //     actionBtnCb: null, // action button callback, optional
    //     onUrlLoaded: function () {}, // callback called when the ajax request has completed, optional
    //     size: 'lg', // modal size: sm, md, lg, xl, optional
    //     onClose: function () {} // callback called when the modal is closed, optional
    // }
    //
    // constructs a new modal instance
    // let myModal = new Baton.Modal(config)

    let myModal = new Baton.Modal({
        title: 'My modal title',
        content: '<p>my html content</p>',
        size: 'lg'
    })

    myModal.open();
    myModal.close();

    myModal.update({
        title: 'Step 2',
        content: '<p>cool</p>'
    })
    myModal.toggle();
    ```
