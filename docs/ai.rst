AI
==

Starting from 4.0.0, the new AI functionalities are available:

- Automatic translations with django-modeltranslation
- Text corrections
- Text summarization
- Tag suggestions
- Image generation
- Image vision (alt text generation)

You can choose which AI model to use for each functionality, see the Configuration section.

Automatic Translations
----------------------

In the configuration section you can specify if you want to enable the automatic translation with django-modeltranslation. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains fields that need to be translated, the ``Translate`` button will appear in the ``object tools`` position.

Clicking it all the empty fields that need a translations will be filled with the translation fetched.

All default fields and CKEditor fields are supported out of the box. Other rich-text editors (e.g. Editor.js via ``dj-editor-js``) plug in through editor adapters, see the Editor Adapters section below.

Corrections
-----------

In the configuration section you can specify if you want to enable the corrections feature. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains text fields (also CKEditor and Editor.js), an icon will appear near the label to trigger the AI correction.
See the Editor Adapters section below if you need to support other wysiwyg editors.

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

With this configuration, a button will appear under each target field (``abstract_it`` and ``meta_description_it``), also when the target lives in another tab than the source, each one opening a modal dialog with the configuration for that target field.
In this modal you can edit the ``words`` and ``useBulletedList`` parameters and perform the summarization that will be inserted in the target field.
If the source field is empty, the button shows an alert instead of the modal.

All default fields and CKEditor fields are supported out of the box. Other rich-text editors (e.g. Editor.js via ``dj-editor-js``) plug in through editor adapters, see the Editor Adapters section below.

Tag Suggestions
---------------

In your ``ModelAdmin`` classes you can define tag fields that can be completed with AI suggestions based on other fields in the same change form::

    class MyModelAdmin(admin.ModelAdmin):
        # ...
        baton_tag_suggestion_fields = {
            "tags": {
                "source_fields": ["title", "summary", "body"],
                "label_field": "name",
                "max_suggestions": 8,
                "allow_new": True,
            },
        }

The configured field must be a standard Django ``ManyToManyField``. Clicking the generated button sends the configured ``source_fields`` values and the existing tag labels to Baton AI. Existing tags are always preferred and are returned to the browser by id, so the form can select the original related objects instead of creating duplicates. New tag candidates are selectable in the confirmation modal; when selected, Baton creates the related tag objects server-side before adding them to the form.

You can optionally specify the following parameters:

- ``source_fields``: fields used as context for the suggestions
- ``label_field``: field used as tag label, defaulting to ``name``, ``title``, ``label`` or ``slug`` when available
- ``max_suggestions``: maximum number of suggestions, default is 8
- ``allow_new``: if new tag labels can be suggested, default is ``True``
- ``existing_limit``: maximum number of existing tags sent as candidates, default is 300
- ``preselect_min_confidence``: tag suggestions are always shown, but only those whose AI confidence is at least this value are preselected (checked) in the confirmation modal, default is ``0.8``. This avoids auto-selecting weakly related tags that the AI sometimes forces; it applies to both existing tags and new tag candidates.

Every suggestion in the confirmation modal also displays a colored badge with its AI confidence percentage: green for high confidence (``>= 80%``), yellow for medium (``50%`` to ``79%``) and red for low (``< 50%``).

Tag suggestions and new tags always use the project default language (``MODELTRANSLATION_DEFAULT_LANGUAGE``, or the first of ``LANGUAGES``). The language is not configurable per field. New tags are created with the default language label, which is also copied into every other language field so the tag is usable everywhere out of the box; the other languages can be edited or translated manually afterwards.

When ``django-modeltranslation`` is used on the edited model, ``source_fields`` can use the base field names (e.g. ``title``). Baton will try the exact form field first and then the localized variants for the default language and the other project languages (e.g. ``title_en``, ``title_it``).

When ``django-modeltranslation`` is used on the tag model, Baton looks for the default language label field first (e.g. ``name_en``), then falls back to the base label field and other translated values. New tags are created with the default language label copied into all language fields. Deduplication still happens on the tag record id and normalized labels, not only on the displayed string.

Image Generation
----------------

Baton provides a new model field and a new image widget which can be used to generate images from text. The image field can be used as a normal image field, but also a new button will appear near it. 
The button will open a modal where you can set some options, describe the image you want and generate the image. You can then preview the image and if you like it you can save it in the 
file field with just one click.::

    from baton.fields import BatonAiImageField

    class MyModel(models.Model):
        image = BatonAiImageField(verbose_name=_("immagine"), upload_to="news/")


There is also another way to add the AI image generation functionality to a normal ImageField if you do not want to use the BatonAiImageField model field:::

    <script>
        Baton.AI.addImageGeneration('{{ widget.name }}');
    </script>


Image generation can be turned off with the ``ENABLE_IMAGE_GENERATION`` AI setting, ``True`` by default: the button disappears and the image generation endpoint refuses the requests, while ``BatonAiImageField`` keeps the alt text generation and the subject location::

    BATON = {
        # ...
        'AI': {
            'ENABLE_IMAGE_GENERATION': False,
        },
    }

Baton also integrates the functionality of `django-subject-imagefield <https://github.com/otto-torino/django-subject-imagefield>`_, so you can specify a `subject_location` field that will store the percentage coordinated of the subject of the image, and in editing mode a point will appear on the image preview in order to let you change this position::

    from baton.fields import BatonAiImageField

    class MyModel(models.Model):
        image = BatonAiImageField(verbose_name=_("immagine"), upload_to="news/", subject_location_field='subject_location')
        subject_location = models.CharField(max_length=7, default="50,50")

You can configure the width of the preview image through the settings ``IMAGE_PREVIEW_WIDTH`` which by default equals ``200``.

Check the ``django-subject-imagefield`` documentation for more details and properties.

Image Vision
------------

There are two ways to activate image vision functionality in Baton, both allow to generate an alt text for the image through the AI.

The first way is to just use the ``BatonAiImageField`` and define the ``alt_field`` attribute (an optionally ``alt_chars``, ``alt_language``)::

    from baton.fields import BatonAiImageField

    class MyModel(models.Model):
        image = BatonAiImageField(verbose_name=_("immagine"), upload_to="news/", alt_field="image_alt", alt_chars=20, alt_language="en")
        image_alt = models.CharField(max_length=40, blank=True)

This method will work only when images are inside inlines.

The second method consists in defining in the ``ModelAdmin`` classes which images can be described in order to generate an alt text, look at the following example::

    class MyModelAdmin(admin.ModelAdmin):
        # ...
        baton_vision_fields = {
            "#id_image": [{ # key must be a selector (useful for inlines)
                "target": "image_alt", # target should be the name of a field of the same model
                "chars": 80,
                "language": "en",
            }],
        }

You have to specify the target field name. You can also optionally specify the follwing parameters:

- ``chars``: max number of characters used in the alt description (approximate, it will not be followed strictly, default is 100)
- ``language``: the language of the summary, default is your default language

With this configuration, one (the number of targets) button will appear near the ``image`` field, clicking it the calculated image alt text will be inserted in the ``image_alt`` field.


Stats
----------------

Baton provides a new widget which can be used to display stats about AI usage. Just include it in your admin index template:::

    {% load baton_tags %}
    {% baton_ai_stats %}

.. image:: images/baton-ai-stats.png

Editor Adapters
----------------

Baton AI functionalities do their job inspecting fields, retrieving and setting their values. Native HTML inputs/textareas and fields managed by ``django-ckeditor`` are supported out of the box. Other rich-text editors plug in through **editor adapters**, and multiple editors can coexist on the same form (e.g. CKEditor *and* another editor).

.. note::
    Already using ``dj-editor-js`` (Editor.js for Django)? Nothing to configure, it ships its own adapter that self-registers. See the *Baton AI + Editor.js* section below.

An adapter is a plain object implementing the following contract:::

    const MyEditorAdapter = {
      name: 'my-editor',
      // Return the ids of the fields this editor manages
      getFields() { return Object.keys(window.MyEditor.instances) },
      // Return the field content (string), or undefined if not owned by this editor
      getValue(fieldId) { return window.MyEditor.instances[fieldId]?.getContent() },
      // Set the content; return true if handled, false if not owned
      setValue(fieldId, value) {
        const inst = window.MyEditor.instances[fieldId]
        if (!inst) return false
        inst.setContent(value)
        return true
      },
      // Render the "correct" checkmark icon near the field; return true if handled
      setCorrect(fieldId, icon) {
        const inst = window.MyEditor.instances[fieldId]
        if (!inst) return false
        Baton.jQuery(`#${fieldId}`).after(icon)
        return true
      },
    }

Register it in your ``admin/base_site.html``, **after** ``baton.min.js`` and **before** ``init_baton.js``:::

    <script src="{% static 'baton/app/dist/baton.min.js' %}"></script>
    <script>
      Baton.AI.registerEditorAdapter(MyEditorAdapter)
    </script>
    <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>

Registered adapters are consulted before the built-in CKEditor adapter, which is consulted last as a fallback.

AI Hooks (legacy)
-----------------

.. note::
    The single-override ``*Hook`` functions below are still supported for backward compatibility, but the editor adapter API above is recommended for new code. When defined, the legacy hooks are wrapped as a highest-priority adapter that falls through to any registered adapters and to CKEditor, so they coexist with the adapter API.

Place these hook definitions in your ``admin/base_site.html`` template, before the ``{% static 'baton/js_snippets/init_baton.js' %}`` script tag:::

    <!-- admin/base_site.html -->
    <script src="{% static 'baton/app/dist/baton.min.js' %}"></script>
    <script>
        (function () {
            // Get a list of fieldIds of all the editor managed fields, should return an array of ids
            Baton.AI.getEditorFieldsHook = function () {
              // i.e. for ckeditor
              return window.CKEDITOR ? Object.keys(window.CKEDITOR.instances) : []
            }

            // Given a field id return the field value and null or undefined if field id is not an editor field
            Baton.AI.getEditorFieldValueHook = function (fieldId) {
              // i.e. for ckeditor
              return window.CKEDITOR?.instances[fieldId]?.getData()
            }

            // Given a field id and a new value should set the editor field value if it exists and return true
            // should return false if the field is not an editor field
            Baton.AI.setEditorFieldValueHook = function (fieldId, value) {
              // i.e. for ckeditor
              if (window.CKEDITOR?.instances[fieldId]) {
                window.CKEDITOR.instances[fieldId].setData(value)
                return true
              }
              return false
            }

            // Given a field id should render the given checkmark icon to indicate the field is correct if it exists and return true,
            // should return false if the field is not an editor field
            Baton.AI.setEditorFieldCorrectHook = function (fieldId, icon) {
              // i.e. for ckeditor
              if (window.CKEDITOR?.instances[fieldId]) {
                $(`#${fieldId}`).parent('.django-ckeditor-widget').after(icon) // this uses jQuery
                return true
              }
              return false
            }
        })()
    </script>
    <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>

Baton AI + Editor.js
--------------------

`Editor.js for Django <https://github.com/otto-torino/django-editor-js>`_ (the ``dj-editor-js`` package on PyPI, version 0.2.0+) integrates with Baton AI **out of the box, zero-config**. It ships an editor adapter that self-registers on ``Baton.AI``, so translation, summarization and correction work on Editor.js fields, coexisting with CKEditor and native fields on the same form.

There is nothing to add to ``admin/base_site.html``: the adapter is loaded automatically via the widget's ``Media``. Just make sure both apps are installed and the AI credentials are configured:::

    INSTALLED_APPS = [
        "baton",
        "editor_js",
        # ...
        "baton.autodiscover",
    ]

    BATON = {
        "BATON_CLIENT_ID": os.getenv("BATON_CLIENT_ID"),
        "BATON_CLIENT_SECRET": os.getenv("BATON_CLIENT_SECRET"),
        "AI": {
            "ENABLE_TRANSLATIONS": True,
            "ENABLE_CORRECTIONS": True,
        },
    }

Then use an ``EditorJSField`` on your model (translatable via ``django-modeltranslation``, or as a summarization target) and the AI buttons appear as for any other field. Under the hood the adapter converts Editor.js' block JSON to/from HTML so the AI sees clean prose; non-text blocks (images, tables, embeds, ...) are not sent to the AI.
