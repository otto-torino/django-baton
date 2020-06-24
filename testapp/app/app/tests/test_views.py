import json

from baton.views import GetAppListJsonView
from django.contrib.auth.models import Permission, User
from django.test import TestCase
from django.urls import reverse


class TestBatonViews(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            'user', email='user@otto.to.it', password='user')
        self.staff = User.objects.create_user(
            'staff', email='staff@otto.to.it', password='staff', is_staff=True)
        self.staff_inactive = User.objects.create_user(
            'staff_inactive',
            email='staff_inactive@otto.to.it',
            password='staff_inactive',
            is_active=False)
        self.admin = User.objects.create_user(
            'admin',
            email='admin@otto.to.it',
            password='admin',
            is_staff=True,
            is_superuser=True)

    def test_call_view_anonymous(self):
        response = self.client.get(reverse('baton-app-list-json'), follow=True)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')
        response = self.client.post(
            reverse('baton-app-list-json'), follow=False)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')

    def test_call_view_user_not_staff(self):
        self.client.login(username='user', password='user')
        response = self.client.get(reverse('baton-app-list-json'), follow=True)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')
        response = self.client.post(
            reverse('baton-app-list-json'), follow=False)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')

    def test_call_view_user_staff_inactive(self):
        self.client.login(username='staff_inactive', password='staff_inactive')
        response = self.client.get(reverse('baton-app-list-json'), follow=True)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')
        response = self.client.post(
            reverse('baton-app-list-json'), follow=False)
        self.assertRedirects(response,
                             '/admin/login/?next=/baton/app-list-json/')

    def test_call_view_user_superuser(self):
        self.client.login(username='admin', password='admin')
        response = self.client.get(reverse('baton-app-list-json'))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 6)
        self.assertEqual(data[0].get('type'), 'title')
        self.assertEqual(data[0].get('label'), 'System')
        self.assertEqual(data[0].get('icon'), None)
        self.assertEqual(data[0].get('defaultOpen'), False)
        self.assertEqual(len(data[0].get('children')), 0)
        self.assertEqual(data[1].get('label'), 'Authentication')
        self.assertEqual(len(data[1].get('children')), 2)
        self.assertEqual(data[1].get('children')[0].get('label'), 'Users')
        self.assertEqual(data[1].get('children')[1].get('label'), 'Groups')
        self.assertEqual(data[3].get('label'), 'File explorer')
        self.assertEqual(data[3].get('children')[0].get('label'), 'Folders')
        self.assertEqual(data[3].get('children')[1].get('label'), 'Thumbnail options')
        self.assertEqual(data[4].get('label'), 'News')
        self.assertEqual(data[4].get('children')[1].get('label'), 'News')
        self.assertEqual(data[5].get('label'), 'Tools')
        self.assertEqual(data[5].get('children')[1].get('label'), 'Google search')

        with self.settings(BATON={}):  # dft menu
            response = self.client.get(reverse('baton-app-list-json'))
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(len(data), 3)
            self.assertEqual(data[0].get('type'), 'app')
            self.assertEqual(data[0].get('label'),
                             'Authentication and Authorization')
            self.assertEqual(data[0].get('children')[0].get('label'), 'Groups')
            self.assertEqual(data[0].get('children')[1].get('label'), 'Users')
            self.assertEqual(data[1].get('label'),
                             'Filer')
            self.assertEqual(data[2].get('label'),
                             'News')

    def test_call_view_user_staff(self):
        self.client.login(username='staff', password='staff')
        response = self.client.get(reverse('baton-app-list-json'))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data),
                         1)  # no permissions, see only free no perms voice
        self.assertEqual(data[0].get('type'), 'title')
        self.assertEqual(data[0].get('label'), 'Tools')

        p = Permission.objects.filter(codename='change_user')[0]
        self.staff.user_permissions.add(p)
        response = self.client.get(reverse('baton-app-list-json'))
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)  # no permissions
        self.assertEqual(data[1].get('children')[0].get('label'),
                         'Users')
