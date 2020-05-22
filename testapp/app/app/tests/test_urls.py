from django.test import TestCase
from django.urls import reverse


class TestBatonUrls(TestCase):
    def test_can_reverse_dump_data(self):
        self.assertEqual(reverse('baton-app-list-json'), '/baton/app-list-json/')
