// Initialize Baton, after reading baton-config from the template
(function ($, undefined) {
    $(document).ready(function () {
        Baton.init(JSON.parse(document.getElementById('baton-config').textContent));
    })
})(Baton.jQuery, undefined)
