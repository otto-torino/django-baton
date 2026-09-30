"""Layout checks that hold across the admin markup of every Django version.

Django 6.1 rewrote several admin templates (breadcrumbs as a list, titles
and object tools in a wrapper, the fields of a form row, a separate
widgets.css): these guard what Baton adapts to it.
"""

from unittest import skipUnless

from django.contrib import admin
from django.contrib.auth import get_user_model
from playwright.sync_api import expect

from .utils import PlaywrightTestCase


def admin_change_path():
    # the fixture users have no fixed primary key: reloaded after the other
    # tests, the admin gets a new one
    return f"/admin/auth/user/{get_user_model().objects.get(username='admin').pk}/change/"


class TestBatonLayout(PlaywrightTestCase):
    viewport = {"width": 1400, "height": 900}

    def test_breadcrumbs_show_the_home_icon_once(self):
        page = self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

        icons = page.evaluate(
            """Array.from(document.querySelectorAll('.breadcrumbs a'))
                .filter(a => getComputedStyle(a, '::before').content.includes('home'))
                .length"""
        )
        self.assertEqual(icons, 1)
        # Django >= 6.1: no list markers on the crumbs
        markers = page.evaluate(
            """Array.from(document.querySelectorAll('.breadcrumbs li'))
                .filter(li => getComputedStyle(li).display === 'list-item')
                .length"""
        )
        self.assertEqual(markers, 0)

    def test_title_keeps_its_band(self):
        page = self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

        title = page.locator("#content h1").first
        self.assertEqual(title.evaluate("h1 => getComputedStyle(h1).paddingTop"), "16px")

    def test_fields_of_a_row_stay_side_by_side(self):
        page = self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

        category = page.locator(".fieldBox.field-category").bounding_box()
        link = page.locator(".fieldBox.field-link").bounding_box()
        self.assertAlmostEqual(category["y"], link["y"], delta=5)
        self.assertLess(category["x"], link["x"])

    def test_selector_widget_keeps_its_width(self):
        # Django >= 6.1 loads widgets.css on its own: Baton blanks it
        page = self.login("/admin/")
        self.wait_baton_ready()
        # goto waits for the window load event, when SelectFilter2 builds the widget
        page.goto(self.url(admin_change_path()))
        self.wait_baton_ready()

        available = page.locator(".field-groups .selector-available").bounding_box()
        self.assertLessEqual(available["width"], 350)

    @skipUnless(hasattr(admin, "ActionLocation"), "change form actions need Django >= 6.1")
    def test_change_form_actions_stay_above_the_tabs(self):
        page = self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

        actions = page.locator("#content-main form .actions")
        expect(actions).to_be_visible()
        tabs = page.locator(".nav-tabs").bounding_box()
        self.assertLess(actions.bounding_box()["y"], tabs["y"])
