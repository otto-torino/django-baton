from django.test import TestCase
from django.urls import reverse


class TestBatonUrls(TestCase):
    def test_can_reverse_app_list(self):
        self.assertEqual(reverse('baton-app-list-json'), '/baton/app-list-json/')

    def test_can_reverse_gravatar(self):
        self.assertEqual(reverse('baton-gravatar-json'), '/baton/gravatar/')
