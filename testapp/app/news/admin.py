from django.contrib import admin
from baton.admin import InputFilter
from .models import News, Category, Attachment, Video


class TitleFilter(InputFilter):
    parameter_name = 'title'
    title = 'title'

    def queryset(self, request, queryset):
        if self.value() is not None:
            search_term = self.value()
            return queryset.filter(
                title__icontains=search_term
            )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', )


class AttachmentsInline(admin.TabularInline):
    model = Attachment
    extra = 1

class VideosInline(admin.StackedInline):
    model = Video
    extra = 1
    classes = ('collapse-entry', )


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'category', 'published', )
    list_filter = (TitleFilter, )
    inlines = [AttachmentsInline, VideosInline]

    fieldsets = (
        ('Dates', {
            'fields': ('date', 'datetime', ),
            'classes': ('order-1', 'baton-tabs-init', 'baton-tab-fs-main', 'baton-tab-fs-flags', 'baton-tab-group-fs-attachments--inline-attachments', 'baton-tab-group-fs-videos--inline-videos'),
            'description': 'This is a description text'

        }),
        ('Main', {
            'fields': ('category', 'title', 'image', 'content', ),
            'classes': ('tab-fs-main', ),
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
