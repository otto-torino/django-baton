from django.db import models
from .widgets import BatonAiImageInput

class BatonAiImageField(models.ImageField):
    def formfield(self, **kwargs):
        d = kwargs
        # override widget
        d.update({
            'widget': BatonAiImageInput,
        })
        return super(BatonAiImageField, self).formfield(**d)
