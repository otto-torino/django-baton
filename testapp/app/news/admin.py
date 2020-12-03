from django.contrib import admin
from baton.admin import InputFilter, RelatedDropdownFilter
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
    classes = ('collapse-entry', 'expand-first', )


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'date',
        'category',
        'published',
    )
    list_filter = (
        TitleFilter,
        ('category', RelatedDropdownFilter, ),
        'date',
    )
    inlines = [AttachmentsInline, VideosInline]
    date_hierarchy = 'date'

    fieldsets = (
        ('Dates', {
            'fields': ('date', 'datetime', ),
            'classes': ('order-1', 'baton-tabs-init', 'baton-tab-fs-main', 'baton-tab-fs-flags', 'baton-tab-group-fs-attachments--inline-attachments', 'baton-tab-group-fs-videos--inline-videos'),
            'description': 'This is a description text'

        }),
        ('Main', {
            'fields': (('category', 'title'), 'link', 'content', ),
            'classes': ('tab-fs-main', ),
            'description': 'This is a description text'

        }),
        ('Media', {
            'fields': ('image', ),
            'classes': ('collapse', ),
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

    baton_form_includes = [
        ('news/admin_datetime_include.html', 'datetime', 'top', ),
        ('news/admin_content_include.html', 'content', 'above', ),
        ('news/admin_title_include.html', 'title', 'right', ),
    ]
