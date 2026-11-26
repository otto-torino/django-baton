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


class TestBatonSortable(TestCase):
    """The changelist of the categories, ordered by dragging (BatonSortableMixin)."""

    def setUp(self):
        from django.utils import translation
        from news.models import Category

        # the admin is under the language prefix: the URLs without a request take
        # LANGUAGE_CODE, which is not one of the languages
        translation.activate("en")
        self.addCleanup(translation.deactivate)
        self.Category = Category
        self.admin = User.objects.create_user(
            "admin", password="admin", is_staff=True, is_superuser=True
        )
        self.client.login(username="admin", password="admin")
        self.url = reverse("admin:news_category_baton_reorder")
        self.a, self.b, self.c, self.d = (
            Category.objects.create(name=name, position=i)
            for i, name in enumerate("abcd", start=1)
        )

    def names(self):
        return "".join(self.Category.objects.values_list("name", flat=True))

    def reorder(self, *objects):
        return self.client.post(
            self.url,
            json.dumps({"order": [obj.pk for obj in objects]}),
            content_type="application/json",
        )

    def test_reorder_all(self):
        response = self.reorder(self.c, self.a, self.d, self.b)
        self.assertEqual(response.json(), {"ok": True})
        self.assertEqual(self.names(), "cadb")
        self.assertEqual(
            list(self.Category.objects.values_list("position", flat=True)), [1, 2, 3, 4]
        )

    def test_reorder_subset_keeps_the_other_rows(self):
        # a filtered list or a page: b and d swap their places, a and c stay
        self.reorder(self.d, self.b)
        self.assertEqual(self.names(), "adcb")

    def test_duplicated_positions_are_renumbered(self):
        self.Category.objects.update(position=1)
        self.reorder(self.b, self.a)
        self.assertEqual(self.names(), "bacd")
        self.assertEqual(
            list(self.Category.objects.values_list("position", flat=True)), [1, 2, 3, 4]
        )

    def test_invalid_orders(self):
        for body in ("nope", '{"order": "1"}', '{"order": []}', '{"other": [1]}'):
            with self.subTest(body=body):
                response = self.client.post(self.url, body, content_type="application/json")
                self.assertEqual(response.status_code, 400)
        self.assertEqual(self.reorder(self.a, self.a).status_code, 400)
        response = self.client.post(
            self.url, json.dumps({"order": [self.a.pk, 999]}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.names(), "abcd")

    def test_only_post(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)

    def test_permission(self):
        staff = User.objects.create_user("staff", password="staff", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="view_category"))
        self.client.login(username="staff", password="staff")
        self.assertEqual(self.reorder(self.b, self.a).status_code, 403)
        self.assertEqual(self.names(), "abcd")

    def test_changelist_config(self):
        changelist = reverse("admin:news_category_changelist")
        response = self.client.get(changelist)
        config = json.loads(
            response.content.decode().split('id="baton-sortable" type="application/json">')[1]
            .split("</script>")[0]
        )
        self.assertEqual(config["url"], self.url)
        self.assertTrue(config["ordered"])
        self.assertTrue(config["can_change"])
        self.assertContains(response, 'class="btn baton-cl-sort-handle" data-pk="%d"' % self.a.pk)
        self.assertNotContains(response, 'name="form-0-position"')
        # ordered by name, then descending by position: no dragging
        for order in ("1", "-2"):
            with self.subTest(order=order):
                response = self.client.get(changelist, {"o": order})
                self.assertContains(response, '"ordered": false')
        response = self.client.get(changelist, {"o": "2"})
        self.assertContains(response, '"ordered": true')

    def test_position_is_read_only_and_new_objects_go_last(self):
        response = self.client.get(reverse("admin:news_category_add"))
        self.assertNotContains(response, 'name="position"')
        self.client.post(reverse("admin:news_category_add"), {"name": "e"})
        self.assertEqual(self.Category.objects.get(name="e").position, 5)
        self.assertEqual(self.names(), "abcde")
