import re

from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonMenuCollapse(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.login()
        # the login page is a baton page too: wait for the redirect, then for the menu
        self.page.wait_for_url(lambda url: "/login/" not in url)
        self.wait_baton_ready()
        self.page.wait_for_selector(".depth-0")

    def test_collapse(self):
        page = self.page

        sidebar = page.locator(".sidebar-menu")
        toggle = page.locator(".menu-collapse-toggle")
        root_voices = page.locator(".depth-0 > li")
        expect(root_voices).to_have_count(4)

        # expanded by default
        expect(toggle).to_be_visible()
        expect(toggle).to_have_attribute("aria-expanded", "true")
        self.assertGreater(sidebar.bounding_box()["width"], 200)

        # collapse: only the icons are left
        toggle.click()
        expect(page.locator("body")).to_have_class(re.compile(r"\bmenu-collapsed\b"))
        expect(toggle).to_have_attribute("aria-expanded", "false")
        self.assertEqual(round(sidebar.bounding_box()["width"]), 72)
        content = page.locator("#content").bounding_box()
        self.assertEqual(round(content["x"]), 72)
        self.assertEqual(
            round(content["x"] + content["width"]),
            page.evaluate("document.documentElement.clientWidth"),
        )

        # of the user area only the avatar is left, the user links open on hover
        user_links = page.locator("#user-tools-sidebar .user-links")
        expect(page.locator(".gravatar-icon")).to_be_visible()
        expect(user_links).to_be_hidden()
        page.locator(".gravatar-icon").hover()
        expect(user_links).to_be_visible()
        expect(user_links.locator(".logout")).to_be_visible()
        self.assertEqual(round(user_links.bounding_box()["x"]), 71)
        user_links.locator(".password").hover()
        expect(user_links).to_be_visible()
        page.locator("#content").hover()
        expect(user_links).to_be_hidden()

        # only the first level groups are shown: the app voice under the system
        # title opens in the title flyout
        system_voice = root_voices.nth(0)
        auth_voice = root_voices.nth(1)
        expect(system_voice.locator("> span")).to_be_visible()
        expect(auth_voice).to_be_hidden()
        system_group = system_voice.locator(".menu-group")
        expect(system_group).to_be_hidden()
        system_voice.locator("> span").hover()
        expect(system_group).to_be_visible()
        expect(system_group.locator("> li")).to_have_text(["Authentication", "Users", "Groups"])
        self.assertTrue(
            system_group.locator(".menu-group-child a").first.get_attribute("href").endswith("/en/admin/auth/user/")
        )

        # the default open submenu is hidden, it opens as a flyout on hover
        news_voice = root_voices.nth(2)
        news_children = news_voice.locator(".depth-1")
        expect(news_children).to_be_hidden()
        news_voice.locator("> span").hover()
        expect(news_children).to_be_visible()
        flyout = news_children.bounding_box()
        self.assertEqual(round(flyout["x"]), round(news_voice.bounding_box()["x"] + news_voice.bounding_box()["width"]))
        news_children.locator("a").first.hover()
        expect(news_children).to_be_visible()
        page.locator("#content").hover()
        expect(news_children).to_be_hidden()

        # the state survives a reload
        page.reload()
        self.wait_baton_ready()
        expect(page.locator("body")).to_have_class(re.compile(r"\bmenu-collapsed\b"))

        # expand again
        toggle.click()
        expect(toggle).to_have_attribute("aria-expanded", "true")
        self.assertGreater(sidebar.bounding_box()["width"], 200)
        expect(news_children).to_be_visible()
        expect(auth_voice).to_be_visible()
        expect(system_group).to_be_hidden()

    def test_user_links_tooltips(self):
        page = self.page
        # expanded: the user links keep their own tooltips, bound by baton after a second
        page.wait_for_selector("#user-tools-sidebar .password[data-bs-original-title]", state="attached")
        page.locator("#user-tools-sidebar .password").hover()
        expect(page.locator(".tooltip")).to_be_visible()
        # collapsed: the flyout closes the language dropdown with it
        page.locator(".menu-collapse-toggle").click()
        page.locator(".gravatar-icon").hover()
        page.locator("#user-tools-sidebar .language").click()
        language_menu = page.locator("#user-tools-sidebar .language-switcher .dropdown-menu")
        expect(language_menu).to_be_visible()
        page.locator("#content").hover()
        page.locator(".gravatar-icon").hover()
        expect(page.locator("#user-tools-sidebar .user-links")).to_be_visible()
        expect(language_menu).to_be_hidden()

    def test_active_section_highlight(self):
        page = self.page
        page.goto(self.url("/admin/news/news/"))
        self.wait_baton_ready()
        page.wait_for_selector(".depth-0")
        page.locator(".menu-collapse-toggle").click()
        # in the default theme the title and the active voice backgrounds are the same color
        page.evaluate(
            "document.documentElement.style.setProperty('--bs-baton-menu-voice-title-bg', 'rgb(1, 2, 3)')"
        )
        news_voice = page.locator(".depth-0 > li.with-active")
        expect(news_voice.locator("> span")).to_have_attribute("data-label", "News")
        background = news_voice.evaluate("el => getComputedStyle(el).backgroundColor")
        active_background = page.evaluate(
            """() => {
                const el = document.createElement('div')
                el.style.background = 'var(--bs-baton-menu-active-voice-bg)'
                document.body.appendChild(el)
                return getComputedStyle(el).backgroundColor
            }"""
        )
        self.assertEqual(background, active_background)
        self.assertNotEqual(background, "rgb(1, 2, 3)")

    def test_search_field_expands(self):
        page = self.page
        page.locator(".menu-collapse-toggle").click()
        search = page.locator(".search-field-tool")
        expect(search.locator("input")).to_be_hidden()
        search.click()
        expect(page.locator(".menu-collapse-toggle")).to_have_attribute("aria-expanded", "true")
        expect(search.locator("input")).to_be_focused()


class TestBatonMenuCollapseMobile(PlaywrightTestCase):
    viewport = {"width": 480, "height": 600}

    def setUp(self):
        super().setUp()
        self.login()
        self.wait_baton_ready()

    def test_no_toggle(self):
        expect(self.page.locator(".menu-collapse-toggle")).to_be_hidden()
