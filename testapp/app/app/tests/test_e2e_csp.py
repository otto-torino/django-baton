"""Baton under a Content Security Policy based on nonces (Django >= 6.0)."""

import copy
from unittest import skipUnless

import django
from django.conf import settings
from django.test import override_settings

from .test_e2e_layout import admin_change_path
from .utils import PlaywrightTestCase

RECORD_VIOLATIONS = """
window.__cspViolations = [];
document.addEventListener('securitypolicyviolation', function (e) {
    window.__cspViolations.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline') + ' ' + (e.sourceFile || '').split('/').pop() + ':' + e.lineNumber);
});
"""


def csp_settings():
    if django.VERSION < (6, 0):
        return {}
    from django.utils.csp import CSP

    templates = copy.deepcopy(settings.TEMPLATES)
    templates[0]["OPTIONS"]["context_processors"].append(
        "django.template.context_processors.csp"
    )
    return {
        "MIDDLEWARE": [
            *settings.MIDDLEWARE,
            "django.middleware.csp.ContentSecurityPolicyMiddleware",
            # the nonce where django-admin-rangefilter looks for it
            "app.csp.RequestCspNonceMiddleware",
        ],
        "TEMPLATES": templates,
        "SECURE_CSP": {
            "default-src": [CSP.SELF],
            "script-src": [CSP.SELF, CSP.NONCE],
            "style-src": [CSP.SELF, CSP.NONCE, "https://fonts.googleapis.com"],
            "style-src-attr": [CSP.UNSAFE_INLINE],
            "font-src": [CSP.SELF, "https://fonts.gstatic.com"],
            "img-src": [CSP.SELF, "data:", "https:"],
        },
    }


@skipUnless(django.VERSION >= (6, 0), "Django's CSP support needs Django >= 6.0")
@override_settings(**csp_settings())
class TestBatonCsp(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.context.add_init_script(RECORD_VIOLATIONS)

    def test_pages_render_without_violations(self):
        self.login("/admin/")
        pages = (
            "/admin/",
            admin_change_path(),
            # the filters of django-admin-rangefilter
            "/admin/news/news/",
            # the AI image input and the Editor.js iframes of dj-editor-js
            "/admin/news/news/1/change/",
            "/admin/news/news/add/",
        )
        for path in pages:
            self.page.goto(self.url(path))
            self.wait_baton_ready()
            self.assertTrue(self.page.url.endswith(path), self.page.url)

            # the styles injected by baton.min.js carry the nonce too
            background = self.page.evaluate(
                "getComputedStyle(document.querySelector('#content')).backgroundColor"
            )
            self.assertNotEqual(background, "rgba(0, 0, 0, 0)", path)
            # the frames too, once their content has loaded
            self.page.wait_for_load_state("load")
            for frame in self.page.frames:
                self.assertEqual(
                    frame.evaluate("window.__cspViolations || []"), [], f"{path} {frame.url}"
                )
