AI
==

Starting from 4.0.0, the new AI functionalities are available:

- Automatic translations with django-modeltranslation
- Text corrections
- Text summarization
- Image generation

Automatic Translations
----------------------

In the configuration section you can specify if you want to enable the automatic translation with django-modeltranslation. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains fields that need to be translated, the ``Translate`` button will appear in the ``object tools`` position.

Clicking it all the empty fields that need a translations will be filled with the translation fetched.

All default fields and CKEDITOR fields are supported.

Corrections
-----------

In the configuration section you can specify if you want to enable the corrections feature. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains text fields (also CKEDITOR), an icon will appear near the label to trigger the AI correction.

When triggering the correction there are two possible results:

- the corrected text is the same as the original one: nothing happens, only a green check icon appears near the field
- the corrected text is different from the original one: a modal is shown with the diff between the original and the corrected text, and the user can decide to use the corrected text.

The default selectors are `textarea` and `input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])`, you can change them in the configuration:::

    ...
    'AI': {
        'ENABLE_CORRECTIONS': True,
        'CORRECTION_SELECTORS': ["textarea", "input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])"],
    },
    ...


There is another way to trigger the correction in cases the label is not visible: ctrl + left mouse click on the field.

Text Summarization
------------------

In your ``ModelAdmin`` classes you can define which fields can be summarized to create a content used to fill other model fields, look at the following example:::

    class MyModelAdmin(admin.ModelAdmin):
        # ...
        baton_summarize_fields = {
            "text_it": [{
                "target": "abstract_it",
                "words": 140,
                "useBulletedList": True,
                "language": "it",
            }, {
                "target": "meta_description_it",
                "words": 45,
                "useBulletedList": False,
            }],
        }

You have to specify the target field name. You can also optionally specify the follwing parameters:

- ``words``: number of words used in the summary (approximate, it will not be followed strictly)
- ``useBulletedList``: if the summary should be in a bulleted list
- ``language``: the language of the summary, default is your default language

The ``words`` and ``useBulletedList`` parameters can be edited int the UI when actually summarizing the text.

With this configuration, two (the number of targets) buttons will appear near the ``text_it`` field, each one opening a modal dialog with the configuration for the target field.
In this modal you can edit the ``words`` and ``useBulletedList`` parameters and perform the summarization that will be inserted in the target field.

Image Generation
----------------

Baton provides a new model field and a new image widget which can be used to generate images from text. The image field can be used as a normal image field, but also a new button will appear near it. 
The button will open a modal where you can set some options, describe the image you want and generate the image. You can then preview the image and if you like it you can save it in the 
file field with just one click.::

    from baton.fields import BatonAiImageField

    class MyModel(models.Model):
        image = BatonAiImageField(verbose_name=_("immagine"), upload_to="news/")

Stats
----------------

Baton provides a new widget which can be used to display stats about AI usage. Just include it in your admin index template:::

    {% load baton_tags %}
    {% baton_ai_stats %}

.. image:: images/baton-ai-stats.png
