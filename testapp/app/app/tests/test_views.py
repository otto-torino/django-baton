import json

from baton.views import GetAppListJsonView
from django.conf import settings
from django.contrib.auth.models import Permission, User
from django.test import TestCase
from django.urls import reverse


class TestBatonViews(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            "user", email="user@otto.to.it", password="user"
        )
        self.staff = User.objects.create_user(
            "staff", email="staff@otto.to.it", password="staff", is_staff=True
        )
        self.staff_inactive = User.objects.create_user(
            "staff_inactive",
            email="staff_inactive@otto.to.it",
            password="staff_inactive",
            is_active=False,
        )
        self.admin = User.objects.create_user(
            "admin",
            email="admin@otto.to.it",
            password="admin",
            is_staff=True,
            is_superuser=True,
        )

    def test_call_view_anonymous(self):
        response = self.client.get(reverse("baton-app-list-json"), follow=True)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")
        response = self.client.post(reverse("baton-app-list-json"), follow=False)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")

    def test_call_view_user_not_staff(self):
        self.client.login(username="user", password="user")
        response = self.client.get(reverse("baton-app-list-json"), follow=True)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")
        response = self.client.post(reverse("baton-app-list-json"), follow=False)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")

    def test_call_view_user_staff_inactive(self):
        self.client.login(username="staff_inactive", password="staff_inactive")
        response = self.client.get(reverse("baton-app-list-json"), follow=True)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")
        response = self.client.post(reverse("baton-app-list-json"), follow=False)
        self.assertRedirects(response, "/en/admin/login/?next=/baton/app-list-json/")

    def test_call_view_user_superuser(self):
        self.client.login(username="admin", password="admin")
        response = self.client.get(reverse("baton-app-list-json"))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 4)
        self.assertEqual(data[0].get("type"), "title")
        self.assertEqual(data[0].get("label"), "System")
        self.assertEqual(data[0].get("defaultOpen"), False)
        self.assertEqual(len(data[0].get("children")), 0)
        self.assertEqual(data[1].get("label"), "Authentication")
        self.assertEqual(len(data[1].get("children")), 2)
        self.assertEqual(data[1].get("children")[0].get("label"), "Users")
        self.assertEqual(data[1].get("children")[1].get("label"), "Groups")
        self.assertEqual(data[2].get("label"), "News")
        self.assertEqual(data[2].get("children")[0].get("label"), "Categories")
        self.assertEqual(data[2].get("children")[1].get("label"), "News")
        self.assertEqual(data[3].get("label"), "Tools")
        self.assertEqual(data[3].get("children")[1].get("label"), "Google search")

        with self.settings(BATON={}):  # dft menu
            response = self.client.get(reverse("baton-app-list-json"))
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(len(data), 3)
            self.assertEqual(data[0].get("type"), "app")
            self.assertEqual(data[0].get("label"), "Authentication and Authorization")
            self.assertEqual(data[0].get("children")[0].get("label"), "Groups")
            self.assertEqual(data[0].get("children")[1].get("label"), "Users")
            self.assertEqual(data[1].get("label"), "Baton")
            self.assertEqual(data[2].get("label"), "News")

    def test_call_view_user_staff(self):
        self.client.login(username="staff", password="staff")
        response = self.client.get(reverse("baton-app-list-json"))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 1)  # no permissions, see only free no perms voice
        self.assertEqual(data[0].get("type"), "title")
        self.assertEqual(data[0].get("label"), "Tools")

        p = Permission.objects.filter(codename="change_user")[0]
        self.staff.user_permissions.add(p)
        response = self.client.get(reverse("baton-app-list-json"))
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)  # no permissions
        self.assertEqual(data[1].get("children")[0].get("label"), "Users")

    def test_generate_image_view_disabled(self):
        self.client.login(username="admin", password="admin")
        baton = {**settings.BATON, "AI": {"ENABLE_IMAGE_GENERATION": False}}
        with self.settings(BATON=baton):
            response = self.client.post(
                reverse("baton-generate-image"),
                json.dumps({"prompt": "a cat", "format": 1}),
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.content)["success"], False)

    def test_ai_views_need_a_staff_member(self):
        for name in ("baton-summarize", "baton-vision", "baton-generate-image", "baton-correct"):
            url = reverse(name)
            for user in (None, "user"):
                self.client.logout()
                if user:
                    self.client.login(username=user, password=user)
                response = self.client.post(url, "{}", content_type="application/json")
                self.assertRedirects(
                    response, f"/en/admin/login/?next={url}", fetch_redirect_response=False
                )
