from baton.config import default_config, get_config
from django.test import TestCase


class TestBatonConfig(TestCase):
    def test_default_config(self):
        self.assertEqual(default_config["SITE_TITLE"], "Baton")
        self.assertEqual(default_config["INDEX_TITLE"], "Site administration")
        self.assertEqual(default_config["CONFIRM_UNSAVED_CHANGES"], True)
        self.assertEqual(default_config["SHOW_MULTIPART_UPLOADING"], True)
        self.assertEqual(default_config["ENABLE_IMAGES_PREVIEW"], True)
        self.assertEqual(default_config["CHANGELIST_FILTERS_IN_MODAL"], True)

    def test_get_config(self):
        self.assertEqual(get_config("SITE_HEADER"), "Baton Test App")
        self.assertEqual(get_config("SITE_TITLE"), "Baton Test App")
        self.assertEqual(get_config("INDEX_TITLE"), "Baton administration")
        self.assertEqual(get_config("CONFIRM_UNSAVED_CHANGES"), False)
        self.assertEqual(get_config("SHOW_MULTIPART_UPLOADING"), True)
        self.assertEqual(get_config("ENABLE_IMAGES_PREVIEW"), True)
        self.assertEqual(get_config("CHANGELIST_FILTERS_IN_MODAL"), True)
        self.assertEqual(len(get_config("MENU")), 4)
        self.assertEqual(get_config("MENU")[0]["type"], "title")
        self.assertEqual(get_config("SUPPORT_HREF"), "mailto:mail@otto.to.it")
        self.assertEqual(get_config("POWERED_BY"), "Otto srl")
        self.assertEqual(
            get_config("COPYRIGHT"),
            'Copyright © 2026 <a href="https://www.otto.srl">Otto srl</a>',
        )


class TestRetiredAIModels(TestCase):
    def test_a_retired_model_gets_its_replacement_with_a_warning(self):
        from baton.ai import AIModels
        from baton.templatetags.baton_tags import get_ai_models

        config = {
            "SUMMARIZATIONS_MODEL": AIModels.BATON_GPT_3_5_TURBO,
            "CORRECTIONS_MODEL": AIModels.BATON_GPT_4_TURBO,
            "TRANSLATIONS_MODEL": AIModels.BATON_GPT_4O,
        }

        with self.assertWarnsRegex(UserWarning, "gpt-3.5-turbo was retired"):
            models = get_ai_models(config)

        self.assertEqual(models["SUMMARIZATIONS_MODEL"], AIModels.BATON_GPT_4O_MINI)
        self.assertEqual(models["CORRECTIONS_MODEL"], AIModels.BATON_GPT_4O_MINI)
        self.assertEqual(models["TRANSLATIONS_MODEL"], AIModels.BATON_GPT_4O)
        self.assertNotIn(AIModels.BATON_GPT_3_5_TURBO, AIModels.text_models)
