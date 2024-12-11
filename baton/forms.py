from django.forms.fields import ImageField
from .widgets import BatonAiImageInput
from .config import get_config


class BatonAiImageFormField(ImageField):
    widget = BatonAiImageInput

    def __init__(self, subject_location_field=None, alt_field=None, alt_chars=20, alt_language='en', *args, **kwargs):
        self.subject_location_field = subject_location_field
        self.alt_field = alt_field
        self.alt_chars = alt_chars
        self.alt_language = alt_language
        return super().__init__(*args, **kwargs)

    def widget_attrs(self, widget):
        attrs = super().widget_attrs(widget)
        attrs['subject_location_field'] = self.subject_location_field
        attrs['alt_field'] = self.alt_field
        attrs['alt_chars'] = self.alt_chars
        attrs['alt_language'] = self.alt_language
        attrs['preview_width'] = get_config('IMAGE_PREVIEW_WIDTH')
        return attrs
