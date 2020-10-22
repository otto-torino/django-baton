from google.auth.transport.requests import Request
from django import template
from django.core.exceptions import ImproperlyConfigured
from google.oauth2 import service_account

from ..config import get_config

register = template.Library()


@register.simple_tag
def baton_config(key):
    return get_config(key)


@register.inclusion_tag('baton/analytics.html', takes_context=True)
def analytics(context, next=None):

    analytics_settings = get_config('ANALYTICS')

    if not analytics_settings['CREDENTIALS']:
        raise ImproperlyConfigured(
            'Analytics service account json path missing')  # noqa

    if not analytics_settings['VIEW_ID']:
        raise ImproperlyConfigured('Analytics view id missing')

    # The scope for the OAuth2 request.
    SCOPES = [
        'https://www.googleapis.com/auth/analytics.readonly',
    ]
    # The location of the key file with the key data.
    SERVICE_ACCOUNT_FILE = analytics_settings['CREDENTIALS']

    _credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES, )
    _credentials.refresh(Request())

    # Construct a credentials objects from the key data and OAuth2 scope.
    # _credentials = SignedJwtAssertionCredentials(
    #     _key_data['client_email'], _key_data['private_key'], SCOPE)

    return {
        'token': _credentials.token,
        'view_id': analytics_settings['VIEW_ID']
    }


@register.inclusion_tag('baton/footer.html', takes_context=True)
def footer(context):
    user = context['user']
    return {
        'user': user,
        'support_href': get_config('SUPPORT_HREF'),
        'site_title': get_config('SITE_TITLE'),
        'copyright': get_config('COPYRIGHT'),
        'powered_by': get_config('POWERED_BY'),
    }
