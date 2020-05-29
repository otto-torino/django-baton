from django.contrib import admin
from .models import News, Category, Attachment, Video


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', )


class AttachmentsInline(admin.TabularInline):
    model = Attachment
    extra = 1


class VideosInline(admin.TabularInline):
    model = Video
    extra = 1


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'category', 'published', )
    inlines = [AttachmentsInline, VideosInline ]

    fieldsets = (
        ('Main', {
            'fields': ('category', 'date', 'title', 'content', ),
            'classes': ('baton-tabs-init', 'baton-tab-fs-flags', 'baton-tab-group-fs-attachments--inline-attachments', 'baton-tab-group-fs-videos--inline-videos'),
            'description': 'This is a description text'

        }),
        ('Flags', {
            'fields': ('share', 'published', ),
            'classes': ('tab-fs-flags', ),
            'description': 'Set sharing and publishing options'

        }),
        ('Attachments', {
            'fields': ('attachments_summary', ),
            'classes': ('tab-fs-attachments', ),
            'description': 'Add as many attachments as you want'
        }),
        ('Videos', {
            'fields': ('videos_summary', ),
            'classes': ('tab-fs-videos', ),
            'description': 'Add as many videos as you want'

        }),
    )
