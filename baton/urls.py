from django.urls import path

from .views import (
    GetAppListJsonView,
    GetGravatartUrlJsonView,
    SummarizeView,
    VisionView,
    TranslateView,
    GenerateImageView,
    CorrectView,
)

urlpatterns = [
    path("app-list-json/", GetAppListJsonView.as_view(), name="baton-app-list-json"),
    path("gravatar/", GetGravatartUrlJsonView.as_view(), name="baton-gravatar-json"),
    path("translate/", TranslateView.as_view(), name="baton-translate"),
    path("summarize/", SummarizeView.as_view(), name="baton-summarize"),
    path("vision/", VisionView.as_view(), name="baton-vision"),
    path("generate-image/", GenerateImageView.as_view(), name="baton-generate-image"),
    path("correct/", CorrectView.as_view(), name="baton-correct"),
]
