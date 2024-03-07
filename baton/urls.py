from django.urls import path

from .views import GetAppListJsonView, GetGravatartUrlJsonView, TranslateView, SummarizeView


urlpatterns = [
    path('app-list-json/', GetAppListJsonView.as_view(),
        name='baton-app-list-json'),
    path('gravatar/', GetGravatartUrlJsonView.as_view(),
        name='baton-gravatar-json'),
    path('translate/', TranslateView.as_view(),
        name='baton-translate'),
    path('summarize/', SummarizeView.as_view(),
        name='baton-summarize'),
]
