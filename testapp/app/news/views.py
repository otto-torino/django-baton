from django.shortcuts import render
from .admin import NewsAdmin
from .models import News
from baton.autodiscover import admin

# Create your views here.

def news_change_view(request, id):
    return NewsAdmin(News, admin.site).change_view(request, str(id))
