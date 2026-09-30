"""Compatibility between Django's Content Security Policy and django-csp."""

from django.middleware.csp import get_nonce


class RequestCspNonceMiddleware:
    """Expose the nonce of Django >= 6.0 as ``request.csp_nonce``.

    That is where the apps written for django-csp look for it, like the
    templates of django-admin-rangefilter: without it they render an empty
    nonce, which the policy refuses. Place it after
    ``django.middleware.csp.ContentSecurityPolicyMiddleware``.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # the lazy nonce: it is generated, and sent in the header, only if used
        request.csp_nonce = get_nonce(request)
        return self.get_response(request)
