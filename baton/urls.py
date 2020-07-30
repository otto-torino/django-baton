from django.conf.urls import url

from .views import GetAppListJsonView, GetGravatartUrlJsonView


urlpatterns = [
    url(r'^app-list-json/$', GetAppListJsonView.as_view(),
        name='baton-app-list-json'),
    url(r'^gravatar/$', GetGravatartUrlJsonView.as_view(),
        name='baton-gravatar-json'),
]
