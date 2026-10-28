from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonMenu(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.login()
        self.wait_baton_ready()

    def test_menu(self):
        page = self.page

        navbar = page.locator(".sidebar-menu")
        expect(navbar).to_be_visible()
        root_voices = page.locator(".depth-0 > li")

        expect(page.locator(".gravatar-icon").first).to_be_visible()
        expect(page.locator(".view-site").first).to_be_visible()
        expect(page.locator(".password").first).to_be_visible()
        expect(page.locator(".logout").first).to_be_visible()

        # system title voice
        expect(root_voices).to_have_count(4)
        self.assertEqual(root_voices.nth(0).inner_text(), "lock\nSYSTEM")
        self.assertIn("title", root_voices.nth(0).get_attribute("class").split())

        # authentication app voice
        self.assertIn("app", root_voices.nth(1).get_attribute("class").split())
        has_children = root_voices.nth(1).locator(".has-children")
        expect(has_children).to_be_visible()
        self.assertEqual(has_children.inner_text(), "Authentication")

        # exclude the "back" item baton injects into the submenu on open, so
        # positional indexing stays stable (Playwright locators are lazy and
        # re-query the DOM, unlike Selenium's static element lists)
        auth_children = root_voices.nth(1).locator(".depth-1 li:not(.nav-back)")
        expect(auth_children).to_have_count(2)
        self.assertFalse(auth_children.nth(0).is_visible())
        self.assertTrue(
            auth_children.nth(0)
            .locator("a")
            .get_attribute("href")
            .endswith("/en/admin/auth/user/")
        )
        self.assertFalse(auth_children.nth(1).is_visible())
        self.assertTrue(
            auth_children.nth(1)
            .locator("a")
            .get_attribute("href")
            .endswith("/en/admin/auth/group/")
        )

        # open submenu on click
        root_voices.nth(1).click()
        expect(auth_children.nth(0)).to_be_visible()
        self.assertEqual(auth_children.nth(0).locator("a").inner_text(), "Users")
        expect(auth_children.nth(1)).to_be_visible()
        self.assertEqual(auth_children.nth(1).locator("a").inner_text(), "Groups")

        # news menu title voice
        news_voice = root_voices.nth(2)
        self.assertEqual(
            news_voice.locator("span.has-children").inner_text(),
            "breaking_news_alt_1\nNEWS",
        )
        self.assertIn("title", news_voice.get_attribute("class").split())
        self.assertIn("default-open", news_voice.get_attribute("class").split())

        news_children = news_voice.locator(".depth-1 li:not(.nav-back)")
        expect(news_children).to_have_count(3)
        expect(news_children.nth(0)).to_be_visible()
        self.assertTrue(
            news_children.nth(0)
            .locator("a")
            .get_attribute("href")
            .endswith("/admin/news/category/")
        )
        self.assertEqual(
            news_children.nth(0)
            .locator("a")
            .inner_text(),
            "category\nCategories"
        )
        expect(news_children.nth(1)).to_be_visible()
        self.assertTrue(
            news_children.nth(1)
            .locator("a")
            .get_attribute("href")
            .endswith("/en/admin/news/news/")
        )
        expect(news_children.nth(2)).to_be_visible()
        self.assertTrue(
            news_children.nth(2)
            .locator("a")
            .get_attribute("href")
            .endswith("/en/admin/news/tag/")
        )

        # hide subvoices after click
        news_voice.locator("span").first.click()
        expect(news_children.nth(0)).to_be_hidden()
        expect(news_children.nth(1)).to_be_hidden()
        expect(news_children.nth(2)).to_be_hidden()

        # tools voice
        self.assertEqual(
            root_voices.nth(3).locator("span.has-children").inner_text(),
            "construction\nTOOLS",
        )
