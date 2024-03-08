from django.forms.widgets import ClearableFileInput


class BatonAiImageInput(ClearableFileInput):
    template_name = "baton/widgets/ai_image.html"
