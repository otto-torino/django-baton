from django.db import models
from django.utils.translation import gettext_lazy as _

class BatonTheme(models.Model):
    name = models.CharField(_("Name"), max_length=255)
    theme = models.TextField(_("Theme"))
    active = models.BooleanField(_("Active"), default=False)

    def __str__(self):
        return self.name

    # override save, only one theme can be active
    def save(self, *args, **kwargs):
        if self.active:
            self.__class__.objects.exclude(pk=self.pk).update(active=False)
        super(BatonTheme, self).save(*args, **kwargs)
