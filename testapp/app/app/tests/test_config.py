from django.test import TestCase
from baton.config import default_config, get_config


class TestBatonConfig(TestCase):
    def test_default_config(self):
        self.assertEqual(default_config['SITE_TITLE'], 'Baton')
        self.assertEqual(default_config['INDEX_TITLE'], 'Site administration')
        self.assertEqual(default_config['CONFIRM_UNSAVED_CHANGES'], True)
        self.assertEqual(default_config['SHOW_MULTIPART_UPLOADING'], True)
        self.assertEqual(default_config['ENABLE_IMAGES_PREVIEW'], True)
        self.assertEqual(default_config['CHANGELIST_FILTERS_IN_MODAL'], False)

    def test_get_config(self):
        self.assertEqual(get_config('INDEX_TITLE'), 'Baton administration')
        self.assertEqual(get_config('CONFIRM_UNSAVED_CHANGES'), False)
        self.assertEqual(get_config('SHOW_MULTIPART_UPLOADING'), True)
        self.assertEqual(get_config('ENABLE_IMAGES_PREVIEW'), True)
        self.assertEqual(get_config('CHANGELIST_FILTERS_IN_MODAL'), True)
        self.assertEqual(len(get_config('MENU')), 4)
        self.assertEqual(get_config('MENU')[0]['type'], 'title')
