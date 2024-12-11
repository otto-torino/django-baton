from django.db import models

from django.db.models.fields.files import ImageFieldFile
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils.translation import get_language

from .forms import BatonAiImageFormField
from .widgets import BatonAiImageInput

class BatonAiImageFieldFile(ImageFieldFile):
    @property
    def subject_perc_position(self):
        if self.field.subject_location_field and getattr(
                self.instance, self.field.subject_location_field):
            (cX, cY) = getattr(self.instance,
                               self.field.subject_location_field).split(',')

            return {
                'x': int(cX),
                'y': int(cY)
            }
        return None

    @property
    def subject_position(self):
        perc = self.subject_perc_position
        if perc:
            return {
                'x': (self.width or 0) * perc.get('x', 0) // 100,
                'y': (self.height or 0) * perc.get('y', 0) // 100
            }
        return None

    @property
    def sorl(self):
        """ shortcut property to use with sorl-thumbnmail crop featur e"""
        position = self.subject_perc_position
        if position:
            x = position.get('x')
            y = position.get('y')
            # also need -0
            return '%s%% %s%%' % (x, y)
        return '50% 50%'

class BatonAiImageField(models.ImageField):
    attr_class = BatonAiImageFieldFile

    def __init__(self,
                 verbose_name=None,
                 name=None,
                 width_field=None,
                 height_field=None,
                 subject_location_field=None,
                 alt_field=None,
                 alt_chars=20,
                 alt_language=get_language(),
                 **kwargs):
        self.width_field, self.height_field = width_field, height_field
        self.subject_location_field = subject_location_field
        self.alt_field = alt_field
        self.alt_chars = alt_chars
        self.alt_language = alt_language
        super().__init__(verbose_name, name, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if self.alt_field:
            kwargs['alt_field'] = self.alt_field
            kwargs['alt_chars'] = self.alt_chars
            kwargs['alt_language'] = self.alt_language
        if self.subject_location_field:
            kwargs['subject_location_field'] = self.subject_location_field
        return name, path, args, kwargs

    def formfield(self, **kwargs):
        d = kwargs
        # override widget
        d.update({
            'widget': BatonAiImageInput,
            'form_class': BatonAiImageFormField,
            'alt_field': self.alt_field,
            'alt_chars': self.alt_chars,
            'alt_language': self.alt_language,
            'subject_location_field': self.subject_location_field,
            'help_text':_('Drag the circle or click on the image to set the image subject') if self.subject_location_field else d.get('help_text', ''),
        })
        return super().formfield(**d)
