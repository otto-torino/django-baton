from modeltranslation.translator import TranslationOptions, register
from .models import News

@register(News)
class NewsTranslationOptions(TranslationOptions):
    fields = (
        "title",
        "content",
        "body",
        "attachments_summary",
        "videos_summary",
    )
