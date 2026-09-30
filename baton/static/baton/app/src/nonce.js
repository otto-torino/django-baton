// With a Content Security Policy based on nonces, the styles style-loader
// injects need one too: use the nonce of the script tag loading this bundle,
// empty when the page has no CSP. Imported first, before any style.
// eslint-disable-next-line no-undef, camelcase
__webpack_nonce__ = (document.currentScript && document.currentScript.nonce) || undefined
