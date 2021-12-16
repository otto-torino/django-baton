from django.urls import path

from .views import GetAppListJsonView, GetGravatartUrlJsonView


urlpatterns = [
    path('app-list-json/', GetAppListJsonView.as_view(),
        name='baton-app-list-json'),
    path('gravatar/', GetGravatartUrlJsonView.as_view(),
        name='baton-gravatar-json'),
]
