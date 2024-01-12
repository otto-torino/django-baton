from django import forms
from django_select2 import forms as s2forms

from . import models


class UserWidget(s2forms.ModelSelect2Widget):
    search_fields = [
        "username__icontains",
        "email__icontains",
    ]


class ActivityForm(forms.ModelForm):
    class Meta:
        model = models.Activity
        fields = "__all__"
        widgets = {
            "user": UserWidget,
        }
