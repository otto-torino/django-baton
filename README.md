# django-baton

![Version](https://img.shields.io/github/v/tag/otto-torino/django-baton?label=version)
[![Build status](https://app.travis-ci.com/otto-torino/django-baton.svg?token=fp5hqwJQgwHKLpsjsZ3L&branch=master)](https://travis-ci.com/github/otto-torino/django-baton)
[![Documentation Status](https://readthedocs.org/projects/django-baton/badge/?version=latest)](https://django-baton.readthedocs.io/en/latest/?badge=latest)
![License](https://img.shields.io/pypi/l/django-baton)
[![Downloads](https://pepy.tech/badge/django-baton)](https://pepy.tech/project/django-baton)

A cool, modern and responsive django admin application based on bootstrap 5, which brings AI in your admin panel.

Documentation: [readthedocs](http://django-baton.readthedocs.io/)

---
**Live Demo**

Now you can try django-baton using the new shining live demo!
Login with user `demo` and password `demo`

[https://django-baton.sqrt64.it/](https://django-baton.sqrt64.it/)

---
**Last changes**

Baton 4.2.0 introduces the use of computer vision to generate alt attributes for images.

Baton 4.0.* introduces a bunch of new AI functionalities!

- automatic translations with django-modeltranslation
- text summarization
- text corrections
- image generation

It also introduces themes, and makes it easier to customize the application, there is no need to recompile the js app unless you wanto to change primary and secondary colors or you need heavy customization.

---

![Screenshot](docs/images/baton-ai.gif)

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
    - [AI](#configuration-ai)
    - [Menu](#configuration-menu)
    - [Search Field](#configuration-search-field)
- [Baton AI](#baton-ai)
- [Page Detection](#page-detection)
- [Signals](#signals)
- [Js Utilities](#js-utilities)
- [Js Translations](#js-translations)
- [List Filters](#list-filters)
- [Changelist Includes](#changelist-includes)
- [Changelist Filters Includes](#changelist-filters-includes)
- [Changelist Row Attributes](#changelist-row-attributes)
- [Form Tabs](#form-tabs)
- [Form Includes](#form-includes)
- [Collapsable stacked inlines entries](#collapsable-stackedinline)
- [Themes & Customization](#customization)
- [Tests](#tests)
- [Contributing](#contributing)
- [Star History](#star_history)
- [Screenshots](#screenshots)

## <a name="features"></a>Features

Supports Django >= 2.1. For older versions of Django, please use django-baton@1.13.2.

This application was written with one concept in mind: overwrite as few django templates as possible.
Everything is styled through CSS and when required, JS is used.

- Based on Bootstrap 5 and FontAwesome Free 6
- Fully responsive
- AI functionalities: translations, corrections, summarizations, image description and generation (you need a subscription key)
- Custom and flexible sidebar menu
- Themes support
- Configurable search field
- Text input filters and dropdown list filters facilities
- Form tabs out of the box
- Easy way to include templates in the change form and change list pages
- Easy way to add attributes to change list table rows/cells
- Collapsable stacked inline entries
- Lazy loading of uploaded images
- Optional display of changelist filters in a modal
- Optional use of changelist filters as a form (combine some filters at once and perform the search action)
- Customization available by editing css vars and/or recompiling the js app provided
- IT translations provided

Baton is based on the following frontend technologies:

- Bootstrap 5
- FontAwesome 6

Flexbox is used to accomplish responsiveness. jQuery is used for DOM manipulations.

All JS, fonts and CSS are compiled, and produce a single JS file which is included in the `base_site` template.

A custom menu is provided, the menu is rendered through JS, and data is fetched in JSON format through an AJAX request.

## <a name="installation"></a>Installation

Install the last stable release

    $ pip install django-baton

or clone the repo inside your project

    $ git clone https://github.com/otto-torino/django-baton.git

Add `baton` and `baton.autodiscover` to your `INSTALLED_APPS`:

``` python
INSTALLED_APPS = (
    # ...
    'baton',
    'django.contrib.admin',
    # ... (place baton.autodiscover at the very end)
    'baton.autodiscover',
)
```

Run migrations

    $ python manage.py migrate

Replace `django.contrib.admin` in your project urls, and add baton urls:

``` python
# from django.contrib import admin
from baton.autodiscover import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('baton/', include('baton.urls')),

]
```

### Why two installed apps?

Well, first `baton` has to be placed before the `django.contrib.admin` app, because it overrides some templates and resets all CSS.
The `baton.autodiscover` entry is needed as the last installed app in order to register all applications for the admin.
I decided to create a custom `AdminSite` class, to allow the customization of some variables the Django way (`site_header`, `index_title`, ...). I think it's a good approach to customize these vars instead of overwriting the orignal templates. The problem is that when creating a custom AdminSite, you have to register all the apps manualy. I didn't like
that so I wrote this `autodiscover` module which automatically registers all the apps registered with the Django's default AdminSite. For this to work, all the apps must be already registered so this app should be the last in `INSTALLED_APPS`.

## <a name="configuration"></a>Configuration

The configuration dictionary must be defined inside your settings:

``` python
from baton.ai import AIModels

BATON = {
    'SITE_HEADER': 'Baton',
    'SITE_TITLE': 'Baton',
    'INDEX_TITLE': 'Site administration',
    'SUPPORT_HREF': 'https://github.com/otto-torino/django-baton/issues',
    'COPYRIGHT': 'copyright © 2020 <a href="https://www.otto.to.it">Otto srl</a>', # noqa
    'POWERED_BY': '<a href="https://www.otto.to.it">Otto srl</a>',
    'CONFIRM_UNSAVED_CHANGES': True,
    'SHOW_MULTIPART_UPLOADING': True,
    'ENABLE_IMAGES_PREVIEW': True,
    'CHANGELIST_FILTERS_IN_MODAL': True,
    'CHANGELIST_FILTERS_ALWAYS_OPEN': False,
    'CHANGELIST_FILTERS_FORM': True,
    'CHANGEFORM_FIXED_SUBMIT_ROW': True,
    'MENU_ALWAYS_COLLAPSED': False,
    'MENU_TITLE': 'Menu',
    'MESSAGES_TOASTS': False,
    'GRAVATAR_DEFAULT_IMG': 'retro',
    'GRAVATAR_ENABLED': True,
    'LOGIN_SPLASH': '/static/core/img/login-splash.png',
    'FORCE_THEME': None,
    'SEARCH_FIELD': {
        'label': 'Search contents...',
        'url': '/search/',
    },
    'BATON_CLIENT_ID': 'xxxxxxxxxxxxxxxxxxxx',
    'BATON_CLIENT_SECRET': 'xxxxxxxxxxxxxxxxxx',
    'AI': {
        "MODELS": "myapp.foo.bar", # alternative to the below for lines, a function which returns the models dictionary
        "IMAGES_MODEL": AIModels.BATON_DALL_E_3,
        "VISION_MODEL": AIModels.BATON_GPT_4O_MINI,
        "SUMMARIZATIONS_MODEL": AIModels.BATON_GPT_4O_MINI,
        "TRANSLATIONS_MODEL": AIModels.BATON_GPT_4O,
        'ENABLE_TRANSLATIONS': True,
        'ENABLE_CORRECTIONS': True,
        'CORRECTION_SELECTORS': ["textarea", "input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])"],
        "CORRECTIONS_MODEL": AIModels.BATON_GPT_3_5_TURBO,
    },
    'MENU': (
        { 'type': 'title', 'label': 'main', 'apps': ('auth', ) },
        {
            'type': 'app',
            'name': 'auth',
            'label': 'Authentication',
            'icon': 'fa fa-lock',
            'models': (
                {
                    'name': 'user',
                    'label': 'Users'
                },
                {
                    'name': 'group',
                    'label': 'Groups'
                },
            )
        },
        { 'type': 'title', 'label': 'Contents', 'apps': ('flatpages', ) },
        { 'type': 'model', 'label': 'Pages', 'name': 'flatpage', 'app': 'flatpages' },
        { 'type': 'free', 'label': 'Custom Link', 'url': 'http://www.google.it', 'perms': ('flatpages.add_flatpage', 'auth.change_user') },
        { 'type': 'free', 'label': 'My parent voice', 'default_open': True, 'children': [
            { 'type': 'model', 'label': 'A Model', 'name': 'mymodelname', 'app': 'myapp' },
            { 'type': 'free', 'label': 'Another custom link', 'url': 'http://www.google.it' },
        ] },
    )
}
```

- `SITE_HEADER`, `COPYRIGHT` and `POWERED_BY` are marked as safe, so you can include html (i.e. img tags and links).
- `SUPPORT_HREF` is the URL of the support link. For instance, you can use `mailto:info@blabla.com`.
- `CONFIRM_UNSAVED_CHANGES`: if set to `True` a confirmation modal appears when leaving a change form or add form with unsaved changes.
The check of a dirty form relies on the jQuery serialize method, so it's not 100% safe. Disabled inputs, particular widgets (ckeditor) can not be detected.
Default value is `True`.
- `SHOW_MULTIPART_UPLOADING`: if set to `True` an overlay with a spinner appears when submitting a `multipart/form-data` form.
- `ENABLE_IMAGES_PREVIEW`: if set to `True` a preview is displayed above all input file fields which contain images. You can control how the preview is displayed by overriding the class `.baton-image-preview`. By default, previews are 100px height and have a box shadow on "hover".
- `CHANGELIST_FILTERS_IN_MODAL`: if set to `True` the changelist filters are opened in a centered modal above the document, useful when you set many filters. By default, its value is `False` and the changelist filters appears from the right side of the changelist table.
- `CHANGELIST_FILTERS_ALWAYS_OPEN`: if set to `True` the changelist filters are opened by default. By default, its value is `False` and the changelist filters can be expanded clicking a toggle button. This option is considered only if `CHANGELIST_FILTERS_IN_MODAL` is `False`.
- `CHANGELIST_FILTERS_FORM`: if set to `True` the changelist filters are treated as in a form, you can set many of them and then press a filter button. With such option all standard filters are displayed as dropdowns.
- `CHANGEFORM_FIXED_SUBMIT_ROW`: if set to `True` the submit row in the changeform is fixed at the bottom on large screens.
- `COLLAPSABLE_USER_AREA`: if set to `True` the sidebar user area is collapsed and can be expanded to show links.
- `MENU_ALWAYS_COLLAPSED`: if set to `True` the menu is hidden at page load, and the navbar toggler is always visible, just click it to show the sidebar menu.
- `MENU_TITLE`: the menu title shown in the sidebar. If an empty string, the menu title is hidden and takes no space on larger screens, the default menu voice will still be visible in the mobile menu.
- `MESSAGES_TOASTS`: you can decide to show all or specific level admin messages in toasts. Set it to `True` to show all message in toasts. set it to `['warning', 'error']` to show only warning and error messages in toasts.
- `GRAVATAR_DEFAULT_IMG`: the default gravatar image displayed if the user email is not associated to any gravatar image. Possible values: 404, mp, identicon, monsterid, wavatar, retro, robohash, blank (see [http://en.gravatar.com/site/implement/images/](http://en.gravatar.com/site/implement/images/)).
- `GRAVATAR_ENABLED`: should a gravatar image be shown for the user in the menu? Defaults to `True`.
- `LOGIN_SPLASH`: an image used as body background in the login page. The image is centered and covers the whole viewport.
- `FORCE_THEME`: You can force the light or dark theme, and the theme toggle disappears from the user area. Defaults to `None`
- `BATON_CLIENT_ID`: The client ID of your baton subscription (unleashes AI functionalities). Defaults to `None`
- `BATON_CLIENT_SECRET`: The client secret of your baton subscription (unleashes AI functionalities). Defaults to `None`

`AI`, `MENU` and `SEARCH_FIELD` configurations in detail:

### <a name="configuration-ai"></a>AI

Django Baton can provide you AI assistance in the admin interface: translations, summarizations, corrections and image generation. You can choose which model to use for each functionality, please note that different models have different prices, see [Baton site](https://www.baton.sqrt64.it). 

Django Baton supports native fields (input, textarea) and ckeditor (django-ckeditor package) by default, but provides hooks you can use to add support to any other wysiwyg editor, read more in the [AI](#baton-ai) section.

#### Available models

You can configure your preferred model for each functionality, you may choose between the following:

```
class AIModels:
    BATON_GPT_3_5_TURBO = "gpt-3.5-turbo" # translations, summarizations and corrections
    BATON_GPT_4_TURBO = 'gpt-4-turbo' # translations, summarizations and corrections
    BATON_GPT_4O = 'gpt-4o' # translations, summarizations and corrections
    BATON_GPT_4O_MINI = 'gpt-4o-mini' # translations, summarizations, image vision and corrections
    BATON_DALL_E_3 = 'dall-e-3' # images
```

We currently support just the `dall-e-3` model for images generation and the `gpt-4o-mini` model for image vision.

You can set the models used with  a simple configuration:

```
    'AI': {
        # ...
        "IMAGES_MODEL": AIModels.BATON_DALL_E_3,
        "VISION_MODEL": AIModels.BATON_GPT_4O_MINI,
        "SUMMARIZATIONS_MODEL": AIModels.BATON_GPT_4O_MINI,
        "TRANSLATIONS_MODEL": AIModels.BATON_GPT_4O,
        # ...
    },
```

Or you can set the path to the function which returns the models dictionary:

```
    # config
    'AI': {
        # ...
        "MODELS": "myapp.foo.bar",
        # ...
    },

    # myapp/foo.py
    from baton.ai import AIModels
    def bar():
        return {
            "IMAGES_MODEL": AIModels.BATON_DALL_E_3,
            "VISION_MODEL": AIModels.BATON_GPT_4O_MINI,
            "SUMMARIZATIONS_MODEL": AIModels.BATON_GPT_4O_MINI,
            "TRANSLATIONS_MODEL": AIModels.BATON_GPT_4O,
        }
```

If you don't set any of the models, the default models (`BATON_GPT_4O_MINI` and `BATON_DALL_E_3`) will be used.

#### Translations

> Note: It may happen that the AI does not translate in the right language. Also it tries to preserve HTML but not always it works. Check the contents before submitting.

The translations feature is designed to work with the [django-modeltranslation](https://github.com/deschler/django-modeltranslation) package.    

If enabled, it will add a `Translate` button in every change form page. This button will trigger a request to the `baton` main site which will return all the translations needed in the page.    
Baton will then fill in the fields with the translations.

> Important! Translate many long texts at once can be slow, so be sure to increase the timeout threshold in your web server configuration! The translate request is performed to the django application which then calls the external translation service, so if you have a small timeout it may happen that the request to the external translation service goes on and you're charged for it but the application closes the request with a 502 error!

In order to use this feature, you need to set the `BATON_CLIENT_ID` and `BATON_CLIENT_SECRET` keys in the configuration dictionary. In order to obtain these keys you must create an account at [Baton](https://baton.sqrt64.it). Please visit the site for more information and pricing.

```
    ...
    'BATON_CLIENT_ID': 'xxxxxxxxxxxxxxxxxxxx',
    'BATON_CLIENT_SECRET': 'xxxxxxxxxxxxxxxxxx',
    'AI': {
        'ENABLE_TRANSLATIONS': True,
        'TRANSLATIONS_MODEL': AIModels.BATON_GPT_4O, # default AIModels.BATON_GPT_4O_MINI
    },
    ...
```

#### Corrections

You can also enable the AI corrections feature:

```
    ...
    'AI': {
        'ENABLE_CORRECTIONS': True,
        'CORRECTIONS_MODEL': AIModels.BATON_GPT_4O, # default AIModels.BATON_GPT_4O_MINI
        'CORRECTION_SELECTORS': ["textarea", "input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])"],
    },
    ...
```

In this case near the labels of all fields which satisfy one provided selector, and all ckeditor fields, will appear an icon to trigger the AI correction.
If the corrected text is the same as the original one, a check icon will appear near the field, otherwise a modal is open, showing
the diff between the original and the corrected text. At that point you can decide to use the corrected text just by pressing the confirm button.

The default selectors are `textarea` and `input[type=text]:not(.vDateField):not([name=username]):not([name*=subject_location])`.

There is another way to trigger the correction in cases the label is not visible: ctrl + left mouse click on the field.

![Corrections](docs/images/ai-corrections.png)

#### Summarizations, image vision and generation

These functionalities are described in detail in the [AI](#baton-ai) section.

### <a name="configuration-menu"></a>MENU

Currently four kind of items are supported: _title_, _app_, _model_ and _free_.

Title and free voices can have children, which follow the following rules:

- children items' children are ignored (do not place an app voice as a child)

Items with children (title, app, free) can specify a `default_open` key to expand the submenu by default.

If you don't define a MENU key in the configuration dictionary, the default MENU is shown.

#### Title

Like __MAIN__ and __CONTENTS__ in the screenshot, it represents a menu section. You should set a label and optionally apps or perms key, used for visualization purposes.

If the title voice should act as a section title for a group of apps, you'd want to specify these apps, because if the user can't operate over them, then the voice is not shown.
You can also define some perms (OR condition), like this:

    { 'type': 'title', 'label': 'main', 'perms': ('auth.add_user', ) },

Title items can have children and so you can specify the _default_open_ key.

#### App

You must specify the _type_ and _name_ keys. Optionally, an _icon_ key (you can use FontAwesome classes which are included by default), a _default_open_ key and a _models_ key.
If you don't define the _models_ key, the default app models are listed under your app.

> **_NOTE:_**  app name should be lowercase

#### Model

You must specify the _type_, _name_ and _app_ keys. Optionally, an icon key.

> **_NOTE:_**  model name should be lowercase

#### Free

You can specify free items. You must define a _url_ and if you want some visibility permissions (OR clause). Free items can have children and so you can specify the _default_open_ key. Free items also accept a _re_ property, which specifies a regular expression used to decide whether to highlight the voice or not (the regular expression is evaluated against the document location pathname).

	{
	    'type': 'free',
	    'label': 'Categories',
	    'url': '/admin/news/category/',
	    're': '^/admin/news/category/(\d*)?'
	}

### <a name="configuration-search-field"></a>SEARCH FIELD

With Baton you can optionally configure a search field in the sidebar above the menu.

![Search field](docs/images/search-field.png)

With this functionality, you can configure a sidebar input search field with autocomplete functionality that can let you surf easily and quickly to any page you desire.

```
'SEARCH_FIELD': {
    'label': 'Label shown as placeholder',
    'url': '/api/path/',
},
```

The autocomplete field will call a custom api at every keyup event. Such api receives the `text` param in the querystring and  should return a json response including the search results in the form:

```
{
    length: 2,
    data: [
        { label: 'My result #1', icon: 'fa fa-edit', url: '/admin/myapp/mymodel/1/change' },
        // ...
    ]
}
```
You should provide the results length and the data as an array of objects which must contain the `label` and `url` keys. The `icon` key is optional and is treated as css class given to an `i` element.

Let's see an example:

```
@staff_member_required
def admin_search(request):
    text = request.GET.get('text', None)
    res = []
    news = News.objects.all()
    if text:
        news = news.filter(title__icontains=text)
    for n in news:
        res.append({
            'label': str(n) + ' edit',
            'url': '/admin/news/news/%d/change' % n.id,
            'icon': 'fa fa-edit',
        })
    if text.lower() in 'Lucio Dalla Wikipedia'.lower():
        res.append({
            'label': 'Lucio Dalla Wikipedia',
            'url': 'https://www.google.com',
            'icon': 'fab fa-wikipedia-w'
        })
    return JsonResponse({
        'length': len(res),
        'data': res
    })
```

You can move between the results using the keyboard up and down arrows, and you can browse to the voice url pressing Enter.

## <a name="baton-ai"></a>Baton AI

Starting from 4.0.0, the new AI functionalities are available:

- Automatic translations with django-modeltranslation
- Text corrections
- Text summarization
- Image generation

You can choose which AI model to use for each functionality, see [AI configuration](#configuration-ai)

### <a name="ai-translations"></a>Automatic Translations

In the configuration section you can specify if you want to enable the automatic translation with django-modeltranslation. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains fields that need to be translated, the `Translate` button will appear in the `object tools` position.

Clicking it all the empty fields that need a translations will be filled with the translation fetched.

All default fields and CKEDITOR fields are supported, see AI Hooks section below if you need to support other wysiwyg editors.

### <a name="ai-corrections"></a>Corrections

In the configuration section you can specify if you want to enable the corrections feature. If you enable it, the functionality will be activated sitewide.
In every add/change form page which contains text fields (also CKEDITOR), an icon will appear near the label to trigger the AI correction.
See AI Hooks section below if you need to support other wysiwyg editors.

When triggergin the correction there are two possible results:

- the corrected text is the same as the original one: nothing happens, only a green check icon appears near the field
- the corrected text is different from the original one: a modal is shown with the diff between the original and the corrected text, and the user can decide to use the corrected text.

### <a name="ai-summarization"></a>Text Summarization

In your `ModelAdmin` classes you can define which fields can be summarized to create a content used to fill other model fields, look at the following example:

``` python
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
```

You have to specify the target field name. You can also optionally specify the follwing parameters:

- `words`: number of words used in the summary (approximate, it will not be followed strictly)
- `useBulletedList`: if the summary should be in a bulleted list
- `language`: the language of the summary, default is your default language

The `words` and `useBulletedList` parameters can be edited int the UI when actually summarizing the text.

With this configuration, two (the number of targets) buttons will appear near the `text_it` field, each one opening a modal dialog with the configuration for the target field.
In this modal you can edit the `words` and `useBulletedList` parameters and perform the summarization that will be inserted in the target field.

All default fields and CKEDITOR fields are supported, see AI Hooks section below if you need to support other wysiwyg editors.

### <a name="ai-vision"></a>Image vision

In your `ModelAdmin` classes you can define which images can be described in order to generate an alt text, look at the following example:

``` python
class MyModelAdmin(admin.ModelAdmin):
    # ...
    baton_vision_fields = {
        "image": [{
            "target": "image_alt",
            "chars": 80,
            "language": "en",
        }],
    }
```

You have to specify the target field name. You can also optionally specify the follwing parameters:

- `chars`: max number of characters used in the alt description (approximate, it will not be followed strictly, default is 100)
- `language`: the language of the summary, default is your default language

With this configuration, one (the number of targets) button will appear near the `image` field, clicking it the calculated image alt text will be inserted in the `image_alt` field.

### <a name="ai-image-generation"></a>Image Generation

Baton provides a new model field and a new image widget which can be used to generate images from text. The image field can be used as a normal image field, but also a new button will appear near it. 
The button will open a modal where you can set some options, describe the image you want and generate the image. You can then preview the image and if you like it you can save it in the 
file field with just one click.

``` python
from baton.fields import BatonAiImageField

class MyModel(models.Model):
    image = BatonAiImageField(verbose_name=_("immagine"), upload_to="news/")
```

There is also another way to add the AI image generation functionality to a normal ImageField if you do not want to use the BatonAiImageField model field:

``` html
<script>
    Baton.AI.addImageGeneration('{{ widget.name }}');
</script>
```

### <a name="ai-stats"></a>Stats widget

Baton provides a new widget which can be used to display stats about AI usage. Just include it in your admin index template:

``` HTML
{% load baton_tags %}

{% baton_ai_stats %}
```

![Modal](docs/images/baton-ai-stats.png)

### <a name="ai-hooks"></a>AI Hooks

Baton AI functionalities do their job inspecting fields, retrieving and setting their values. WYSIWYG editors use javascript to sync with the native fields (like a textarea), and every editor behaves differently. Django Baton comes with support for [django-ckeditor](https://github.com/django-ckeditor/django-ckeditor), but in the next future this will change because the package is almost deprecated.

Nevertheless, you can add your own hooks to support every other WYSIWYG editor you desire. When doing this you need to define the following functions, for example in your `admin/base_site.html` template:

``` html
    <!-- admin/base_site.html -->
    <script src="{% static 'baton/app/dist/baton.min.js' %}"></script>
    <script>
        (function () {
            // Get a list of fieldIds of all the editor managed fields, should return an array of ids
            Baton.AI.getEditorFieldsHook = function () {
              // i.e. for tinyMCE
              return window.tinyMCE ? window.tinyMCE.get().map((f) => f.id) : []
            }

            // Given a field id return the field value and null or undefined if field id is not an editor field
            Baton.AI.getEditorFieldValueHook = function (fieldId) {
              // i.e. for tinyMCE
              return window.tinyMCE ? window.tinyMCE.get(fieldId).getContent() : null
            }

            // Given a field id and a new value should set the editor field value if it exists and return true
            // should return false if the field is not an editor field
            Baton.AI.setEditorFieldValueHook = function (fieldId, value) {
              // i.e. for tinyMCE
              if (window.tinyMCE && window.tinyMCE.get(fieldId)) {
                window.tinyMCE.get(fieldId).setContent(value)
                return true
              }
              return false
            }

            // Given a field id should render the given checkmark icon to indicate the field is correct if it exists and return true,
            // should return false if the field is not an editor field
            Baton.AI.setEditorFieldCorrectHook = function (fieldId, icon) {
              // i.e. for tinyMCE
              if (window.tinyMCE && window.tinyMCE.get(fieldId)) {
                Baton.jQuery(`#${fieldId}`).parent().after(icon) // this uses jQuery
                return true
              }
              return false
            }
        })()
    </script>
    <script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>
```

## <a name="page-detection"></a>Page Detection

Baton triggers some of its functionalities basing upon the current page. For example, it will trigger the tab functionality only when the current page is an add form or change form page.

Baton understands which page is currently displayed performing some basic regular expressions against the location pathname.
There may be cases in which you'd like to serve such contents at different and custom urls, in such cases you need a way to tell Baton which kind of page is tied to that url.

For this reason you can inject your custom hook, a javascript function which should return the page type and that receives as first argument the Baton's default function to use as fallback, i.e.

``` html
<!-- admin/base_site.html -->
{{ conf | json_script:"baton-config" }}
<script src="{% static 'baton/app/dist/baton.min.js' %}"></script>
<script>
    (function () {
        Baton.detectPageHook = fn => /newschange/.test(location.pathname) ? 'change_form' : fn()
    })()
</script>
<script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>
```

In this case we tell Baton that when the location pathname includes the string `newschange`, then the page should be considered a `change_form`, otherwise we let Baton guess the page type.

So, in order to hook into the Baton page detection system, just define a `Baton.detectPageHook` function which receives the default function as first argument and should return the page type.

The available page types are the following: `dashboard`, `admindocs`, `login`, `logout`, `passowrd_change`, `password_change_success`, `add_form`, `change_form`, `changelist`, `filer`, `default`.

## <a name="signals"></a>Signals

Baton provides a dispatcher that can be used to register function that will be called when some events occurr.
Currently, Baton emits five types of events:

- `onNavbarReady`: dispatched when the navbar is fully rendered
- `onMenuReady`: dispatched when the menu is fully rendered (probably the last event fired, since the menu contents are retrieved async)
- `onTabsReady`: dispatched when the changeform tabs are fully rendered
- `onTabChanged`: dispatched when the current changeform tab is changed
- `onMenuError`: dispatched if the request sent to retrieve menu contents fails
- `onReady`: dispatched when Baton JS has finished its sync job

To use these, just override the baton `admin/base_site.html` template and register your listeners **before** calling `Baton.init`, i.e.

``` html
<!-- ... -->
<script>
    (function ($, undefined) {
        // init listeners
        Baton.Dispatcher.register('onReady', function () { console.log('BATON IS READY') })
        Baton.Dispatcher.register('onMenuReady', function () { console.log('BATON MENU IS READY') })
        Baton.Dispatcher.register('onNavbarReady', function () { console.log('BATON NAVBAR IS READY') })
        // end listeners
    })(jQuery, undefined)
</script>
<script src="{% static 'baton/js_snippets/init_baton.js' %}"></script>
<!-- ... -->
```

## <a name="js-utilities"></a>Js Utilities

Baton comes with a number of exported js modules you can use to enhance your admin application.

### Dispatcher

Baton Dispatcher singleton module lets you subscribe to events and dispatch them, making use of the Mediator pattern.

Example:

``` javascript

// register a callback tied to the event
Baton.Dispatcher.register('myAppLoaded', function (evtName, s) { console.log('COOL ' + s) })

// emit the event
Baton.Dispatcher.emit('myAppLoaded', 'STUFF!')
```

### Modal

Baton Modal class lets you insert some content on a bootstrap modal without dealing with all the markup.

![Modal](docs/images/modals.png)

Usage:

``` javascript
// modal configuration:
//
// let config = {
//     title: 'My modal title',
//     subtitle: 'My subtitle', // optional
//     content: '<p>my html content</p>', // alternative to url
//     url: '/my/url', // url used to perform an ajax request, the response is put inside the modal body. Alternative to content.
//     hideFooter: false, // optional
//     showBackBtn: false, // show a back button near the close icon, optional
//     backBtnCb: function () {}, // back button click callback (useful to have a multi step modal), optional
//     actionBtnLabel: 'save', // action button label, default 'save', optional
//     actionBtnCb: null, // action button callback, optional
//     onUrlLoaded: function () {}, // callback called when the ajax request has completed, optional
//     size: 'lg', // modal size: sm, md, lg, xl, optional
//     onClose: function () {} // callback called when the modal is closed, optional
// }
//
// constructs a new modal instance
// let myModal = new Baton.Modal(config)

let myModal = new Baton.Modal({
    title: 'My modal title',
    content: '<p>my html content</p>',
    size: 'lg'
})

myModal.open();
myModal.close();

myModal.update({
    title: 'Step 2',
    content: '<p>cool</p>'
})
myModal.toggle();
```

## <a name="js-translations"></a>Js Translations

There are some circustamces in which Baton will print to screen some js message. Baton detects the user locale and will localize such messages, but it comes with just `en` and `it` translations provided.

> Baton retrieves the current user locale from the `lang` attribute of the `html` tag.

However you can provide or add your own translations by attaching an object to the `Baton` namespace:

``` javascript
// these are the default translations, you can just edit the one you need, or add some locales. Baton engine will always
// pick up your custom translation first, if it finds them.
// you can define the object before Baton.init in the base_site template
Baton.translations = {
  unsavedChangesAlert: 'You have some unsaved changes.',
  uploading: 'Uploading...',
  filter: 'Filter',
  close: 'Close',
  save: 'Save',
  search: 'Search',
  cannotCopyToClipboardMessage: 'Cannot copy to clipboard, please do it manually: Ctrl+C, Enter',
  retrieveDataError: 'There was an error retrieving the data',
  lightTheme: 'Light theme',
  darkTheme: 'Dark theme'
}
```

If Baton can't find the translations for the user locale, it will default to `en`. Keep in mind that Baton will use `en` translations for all `en-xx` locales, but of course you can specify your custom translations!

## <a name="list-filters"></a>List Filters

![List Filters](docs/images/filters.png)

### Input Text Filters

Taken from this [medium article](https://medium.com/@hakibenita/how-to-add-a-text-filter-to-django-admin-5d1db93772d8)

Baton defines a custom InputFilter class that you can use to create text input filters and use them as any other `list_filters`, for example:

``` python

# your app admin

from baton.admin import InputFilter

class IdFilter(InputFilter):
    parameter_name = 'id'
    title = 'id'
 
    def queryset(self, request, queryset):
        if self.value() is not None:
            search_term = self.value()
            return queryset.filter(
                id=search_term
            )


class MyModelAdmin(admin.ModelAdmin):
    list_filters = (
        'my_field',
        IdFilter,
        'my_other_field',
    )

```

### Dropdown Filters

Taken from the github app [django-admin-list-filter-dropdown](https://github.com/mrts/django-admin-list-filter-dropdown)

Baton provides a dropdown form of the following list filters:

| Django admin filter name   | Baton name                  |
| -------------------------- | --------------------------- |
| SimpleListFilter           | SimpleDropdownFilter        |
| AllValuesFieldListFilter   | DropdownFilter              |
| ChoicesFieldListFilter     | ChoicesDropdownFilter       |
| RelatedFieldListFilter     | RelatedDropdownFilter       |
| RelatedOnlyFieldListFilter | RelatedOnlyDropdownFilter   |

The dropdown is visible only if the filter contains at least three options, otherwise the default template is used.

Usage:
```
from baton.admin import DropdownFilter, RelatedDropdownFilter, ChoicesDropdownFilter

class MyModelAdmin(admin.ModelAdmin):
    # ...
    list_filter = (
        # for ordinary fields
        ('a_charfield', DropdownFilter),
        # for choice fields
        ('a_choicefield', ChoiceDropdownFilter),
        # for related fields
        ('a_foreignkey_field', RelatedDropdownFilter),
    )
```

### Multiple choice Filters

Baton defines a custom MultipleChoiceListFilter class that you can use to filter on multiple options, for example:

``` python
# your app admin

from baton.admin import MultipleChoiceListFilter

class StatusListFilter(MultipleChoiceListFilter):
    title = 'Status'
    parameter_name = 'status__in'

    def lookups(self, request, model_admin):
        return News.Status.choices


class MyModelAdmin(admin.ModelAdmin):
    list_filters = (
        'my_field',
        StatusListFilter,
        'my_other_field',
    )
```

## <a name="changelist-includes"></a>Changelist Includes

> In order for this feature to work, the user browser must support html template tags.

Baton lets you include templates directly inside the change list page, in any position you desire. It's as simple as specifying the template path and the position of the template:

```python
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    #...
    baton_cl_includes = [
        ('news/admin_include_top.html', 'top', ),
        ('news/admin_include_below.html', 'below', )
    ]
```

In this case, Baton will place the content of the `admin_include_top.html` template at the top of the changelist section (above the search field), and the content of the `admin_include_below.html` below the changelist form.

![Baton changelist includes](docs/images/baton-cl-includes.png)

You can specify the following positions:

|Position|Description|
|:--------|:-----------|
|`top`| the template is placed inside the changelist form, at the top|
|`bottom`| the template is placed inside the changelist form, at the bottom|
|`above`| the template is placed above the changelist form|
|`below`| the template is placed below the changelist form|

And, of course, you can access the all the changelist view context variables inside your template.

## <a name="changelist-filters-includes"></a>Changelist Filters Includes

> In order for this feature to work, the user browser must support html template tags.

Baton lets you include templates directly inside the change list filter container, at the top or the bottom. It's as simple as specifying the template path and the position of the template:

```python
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    #...
    baton_cl_filters_includes = [
        ('news/admin_filters_include_top.html', 'top', ),
        ('news/admin_filters_include_bottom.html', 'bottom', )
    ]
```

![Baton changelist filters includes](docs/images/baton-cl-filters-includes.png)

You can specify the following positions:

|Position|Description|
|:--------|:-----------|
|`top`| the template is placed inside the changelist filter container, at the top|
|`bottom`| the template is placed inside the changelist filter container, at the bottom|

And, of course, you can access the all the changelist view context variables inside your template.

## <a name="changelist-row-attributes"></a>Changelist Row Attributes

> In order for this feature to work, the user browser must support html template tags.

With Baton you can add every kind of html attribute (including css classes) to any element in the changelist table (cell, rows, ...)

![Baton changelist row attributes](docs/images/baton-cl-row-attributes.png)

It's a bit tricky, let's see how:

1. Add a `baton_cl_rows_attributes` function to your `ModelAdmin` class, which takes `request` and `cl` (changelist view) as parameters.
2. Return a json dictionary where the keys are used to match an element and the values specifies the attributes and other rules to select the element.

Better to see an example:

``` javascript
class NewsModelAdmin(admin.ModelAdmin):
    # ...

    def get_category(self, instance):
        return mark_safe('<span class="span-category-id-%d">%s</span>' % (instance.id, str(instance.category)))
    get_category.short_description = 'category'

    def baton_cl_rows_attributes(self, request, cl):
        data = {}
        for news in cl.queryset.filter(category__id=2):
            data[news.id] = {
                'class': 'table-info',
            }
        data[news.id] = {
            'class': 'table-success',
            'data-lol': 'lol',
            'title': 'A fantasctic tooltip!',
            'selector': '.span-category-id-%d' % 1,
            'getParent': 'td',
        }
        return json.dumps(data)
```

In such case we're returning a dictionary with possibly many keys (each key is an id of a news instance).

The first kind of dictionary elements will add a `table-info` class to the `tr` (rows) containing the news respecting the rule `category__id=2`

The second kind of element instead uses some more options to customize the element selection: you can specify a css selector, and you can specify if Baton should then take one of its parents, and in such case you can give a parent selector also.
In the example provided Baton will add the class `table-success`, `data-attribute` and the `title` attribute to the cell which contains the element `.span-category-id-1`.

So these are the rules:

- the default `selector` is `#result_list tr input[name=_selected_action][value=' + key + ']`, meaning that it can work only if the model is editable (you have the checkox inputs for selecting a row), and selects the row of the instance identified by `key`. If you use a custom selector the dictionary `key` is unuseful.
- the default `getParent` is `tr`. You can change it at you will, or set it to `False`, in such case the element to which apply the given attributes will be the one specified by `selector`.
- Every other key different from `selector` and `getParent` will be considered an attribute and added to the element.

## <a name="form-tabs"></a>Form tabs

![Tabs](docs/images/tabs.png)

How much I loved django-suit form tabs? Too much. So, this was a feature I couldn't live without.

There are three types of tabs:

- **fieldset tab**: a tab containing a fieldset
- **inline tab**: a tab containing an inline
- **group tab**: a tab which can contain fieldsets and inlines in the order you specify

Tabs' titles are retrieved automatically. For fieldset and inline tabs, it's the fieldset's title and the inline related verbose name plural.
For group tabs the first title is taken (either of an inline or fieldset section).

Using group tabs you can mix inlines with fields just by splitting fields into fieldsets and arranging them in your preferred order.

Let's see how to define tabs in your admin forms (everything is done through js, no templatetags or templates overriden):

``` python
class AttributeInline(admin.StackedInline):
    model = Attribute
    extra = 1

class FeatureInline(admin.StackedInline):
    model = Feature
    extra = 1

class ItemAdmin(admin.ModelAdmin):
    list_display = ('label', 'description', 'main_feature', )
    inlines = [AttributeInline, FeatureInline, ]

    fieldsets = (
        ('Main', {
            'fields': ('label', ),
            'classes': ('order-0', 'baton-tabs-init', 'baton-tab-inline-attribute', 'baton-tab-fs-content', 'baton-tab-group-fs-tech--inline-feature', ),
            'description': 'This is a description text'

        }),
        ('Content', {
            'fields': ('text', ),
            'classes': ('tab-fs-content', ),
            'description': 'This is another description text'

        }),
        ('Tech', {
            'fields': ('main_feature', ),
            'classes': ('tab-fs-tech', ),
            'description': 'This is another description text'

        }),
    )
```

As you can see these are the rules:

- Inline classes remain the same, no action needed
- On the first fieldset, define a `baton-tabs-init` class which enables tabs
- On the first fieldset, you can add an `order-[NUMBER]` class, which will be used to determined in which position to place the first fieldset. The order starts from 0, and if omitted, the first fieldset has order 0. If you assign for example the class `order-2` to the first fieldset, then the first fieldset will be the third tab, while all other tabs will respect the order of declaration.
- For every inline you want to put in a separate tab, add a class `baton-tab-inline-MODELNAME` or `baton-tab-inline-RELATEDNAME` if you've specified a related name in the model foreign key field
- For every fieldset you want to put in a separate tab, add a class `baton-tab-fs-CUSTOMNAME`, and add a class `tab-fs-CUSTOMNAME` on the fieldset
- For every group you want to put in a separate tab, add a class `baton-tab-group-ITEMS`, where items can be inlines (`inline-RELATEDNAME`) and/or fieldsets (`fs-CUSTOMNAME`) separated by a double hypen `--`. Also add a class `tab-fs-CUSTOMNAME` on the fieldset items.
- Tabs order respects the defined classes order
- Fieldsets without a specified tab will be added to the main tab. If you want the fieldset to instead display outside of any tabs, add a class `tab-fs-none` to the fieldset. The fieldset will then always be visible regardless of the current tab.

Other features:

- When a field has an error, the first tab containing errors is opened automatically
- You can open a tab on page load just by adding an hash to the url, i.e. `#inline-feature`, `#fs-content`, `#group-fs-tech--inline-feature`

## [Form Includes](#form-includes)

> In order for this feature to work, the user browser must support html template tags.

Baton lets you include templates directly inside the change form page near a field, in any position you desire. It's as simple as specifying the template path, the field name used as anchor and the position of the template:

```python
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    #...
    baton_form_includes = [
        ('news/admin_datetime_include.html', 'datetime', 'top', ),
        ('news/admin_content_include.html', 'content', 'above', )
    ]
```

In this case, Baton will place the content of the `admin_datetime_include.html` template at the top of the datetime field row, and the content of the `admin_content_include.html` above the content field row.

![Baton form includes](docs/images/baton-form-includes.png)

You can specify the following positions:

|Position|Description|
|:--------|:-----------|
|`top`| the template is placed inside the form row, at the top|
|`bottom`| the template is placed inside the form row, at the bottom|
|`above`| the template is placed above the form row|
|`below`| the template is placed below the form row|
|`right`| the template is placed inline at the input field right side|

And, of course, you can access the `{{ original }}` object variable inside your template.

It works seamlessly with the tab facility, if you include content related to a field inside one tab, then the content will be placed in the same tab.

Baton lets also include templates in the object tools top bar in the change form page, keep in mind that suche templates are injected inside an `ul` tag. The template can be inserted on the left or the right:

```python
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    #...
    baton_form_object_tools_include = ('news/object_tools_include.html', 'left', )
```

![Baton form object tools includes](docs/images/baton_form_object_tools_include.png)

## <a name="collapsable-stackedinline"></a>Collapsable stacked inlines entries

![Screenshot](docs/images/collapsable_stackedinline.png)

Baton lets you collapse single stacked inline entries, just add a `collapse-entry` class to the inline, with or without the entire collapse class:

```
class VideosInline(admin.StackedInline):
    model = Video
    extra = 1
    classes = ('collapse-entry', )  # or ('collapse', 'collapse-entry', )
```

And if you want the first entry to be initially expanded, add also the `expand-first` class:

```
class VideosInline(admin.StackedInline):
    model = Video
    extra = 1
    classes = ('collapse-entry', 'expand-first', )
```

## <a name="customization"></a>Themes & Customization

It's easy to customize the appeareance of __baton__.
You can override all the css variables, just create a `baton/css/root.css` file (see [here](https://github.com/otto-torino/django-baton/tree/master/baton/static/baton/css/root.css)) and serve it from an app listed before baton in `INSTALLED_APPS`.

You can also create themes directly from the admin site, just surf to `/admin/baton/batontheme/`. There can be only one active theme, if present, the saved content is used instead of the `root.css` file. So just copy the content of that file in the field and change the colors you want. Be aware that the theme content is considered safe and injected into the page as is, so be carefull.

If you need heavy customization or you need to customize the `primary` and `secondary` colors, you can edit and recompile the JS app which resides in `baton/static/baton/app`.

![Customization](docs/images/customization.png)

Make the changes you want, re-compile, get the compiled JS file, place it in the static folder of your main app,
and place your main app (ROOTAPP) before __baton__ in the `INSTALLED_APPS`.

So:

    $ git clone https://github.com/otto-torino/django-baton.git
    $ cd django-baton/baton/static/baton/app/
    $ npm install
    $ vim src/styles/_variables.scss
    $ npm run compile
    $ cp dist/baton.min.js ROOTAPP/static/baton/app/dist/

If you want to test your live changes, just start the webpack dev server:

    $ cd django-baton/baton/static/baton/app/
    $ npm run dev

And inside the `base_site.html` template, make these changes:

    <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> comment the compiled src and uncomment the webpack served src -->
    <script src="http://localhost:8080/static/baton/app/dist/baton.min.js"></script>

Now while you make your changes to the JS app (CSS included), webpack will update the bundle automatically, so just refresh the page and you'll see your changes.

## <a name="tests"></a>Tests

Starting from the release 1.7.1, django baton is provided with a set of unit and e2e tests. Testing baton is not so easy, because it almost do all the stuff with css rules and by manipulating the DOM. So the e2e tests are performed using selenium and inspecting the test application inside a real browser. In order to have them run properly, you need to have the test application running on `localhost:8000`.

## <a name="development"></a>Development

Start the test app (login admin:admin):

    $ cd testapp
    $ python3 -m venv .virtualenv
    $ cd app
    $ pip install -r requirements.txt
    $ python manage.py runserver

Switch the baton js path in `base_site.html`

    <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> comment the compiled src and uncomment the webpack served src -->
    <script src="http://localhost:8080/static/baton/app/dist/baton.min.js"></script>

Start the js app in watch mode

    $ cd baton/static/baton/app
    $ npm install
    $ npm run dev

Now you'll see live all your changes in the testapp.

### Commands

Install `invoke` and `sphinx_rtd_theme`

    $ pip install invoke sphinx_rtd_theme

Now you can generate the documentation in order to check it. Inside the root dir:

    $ invoke docs

## <a name="contributing"></a>Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md)

## <a name="star_history"></a>Star History

[![Star History Chart](https://api.star-history.com/svg?repos=otto-torino/django-baton&type=Date)](https://star-history.com/#otto-torino/django-baton&Date)

## <a name="screenshots"></a>Screenshots

![Screenshot](docs/screenshots/mobile_mix.jpg)

![Screenshot](docs/screenshots/mobile_mix2.png)

![Screenshot](docs/screenshots/tablet.png)

![Screenshot](docs/screenshots/splash-login.png)

![Screenshot](docs/screenshots/index-no-analytics.png)

![Screenshot](docs/screenshots/changelist-lg.png)

![Screenshot](docs/screenshots/changeform-error.png)

![Screenshot](docs/screenshots/filters-modal.png)

![Screenshot](docs/screenshots/filters-form.png)

![Screenshot](docs/screenshots/menu-collapsed.png)

