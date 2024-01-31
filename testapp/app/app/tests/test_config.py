from baton.config import default_config, get_config
from django.test import TestCase


class TestBatonConfig(TestCase):
    def test_default_config(self):
        self.assertEqual(default_config['SITE_TITLE'], 'Baton')
        self.assertEqual(default_config['INDEX_TITLE'], 'Site administration')
        self.assertEqual(default_config['CONFIRM_UNSAVED_CHANGES'], True)
        self.assertEqual(default_config['SHOW_MULTIPART_UPLOADING'], True)
        self.assertEqual(default_config['ENABLE_IMAGES_PREVIEW'], True)
        self.assertEqual(default_config['CHANGELIST_FILTERS_IN_MODAL'], False)

    def test_get_config(self):
        self.assertEqual(get_config('SITE_HEADER'), 'Baton Test App')
        self.assertEqual(get_config('SITE_TITLE'), 'Baton Test App')
        self.assertEqual(get_config('INDEX_TITLE'), 'Baton administration')
        self.assertEqual(get_config('CONFIRM_UNSAVED_CHANGES'), False)
        self.assertEqual(get_config('SHOW_MULTIPART_UPLOADING'), True)
        self.assertEqual(get_config('ENABLE_IMAGES_PREVIEW'), True)
        self.assertEqual(get_config('CHANGELIST_FILTERS_IN_MODAL'), True)
        self.assertEqual(len(get_config('MENU')), 4)
        self.assertEqual(get_config('MENU')[0]['type'], 'title')
        self.assertEqual(get_config('SUPPORT_HREF'), 'mailto:mail@otto.to.it')
        self.assertEqual(get_config('POWERED_BY'), 'Otto srl')
        self.assertEqual(get_config('COPYRIGHT'), 'copyright © 2024 <a href="https://www.otto.to.it">Otto srl</a>')
