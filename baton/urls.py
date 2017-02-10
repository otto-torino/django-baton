from django.conf.urls import url

from .views import GetAppListJsonView


urlpatterns = [
    url(r'^app-list-json/$', GetAppListJsonView.as_view(),
        name='baton-app-list-json'),
]
