from .utils import PlaywrightTestCase


class TestBatonTheme(PlaywrightTestCase):
    viewport = {"width": 1920, "height": 1280}

    def setUp(self):
        super().setUp()
        self.login()
        self.wait_baton_ready()

    def test_theme(self):
        theme = self.page.locator("html").get_attribute("data-bs-theme")
        self.assertIn(theme, ["light", "dark"])

    def test_the_scheme_follows_the_theme_not_the_system(self):
        # the system in dark mode: the admin of Django declares both schemes,
        # and the scrollbars and native controls followed it under the light theme
        for theme in ("light", "dark"):
            with self.subTest(theme=theme):
                context = self.browser.new_context(viewport=self.viewport, color_scheme="dark")
                context.add_init_script(f"localStorage.setItem('baton-theme', '{theme}')")
                page = context.new_page()
                page.goto(self.url("/admin/"))
                page.fill("#id_username", "admin")
                page.fill("#id_password", "admin")
                page.click("input[type=submit]")
                page.wait_for_selector("body.baton-ready")

                self.assertEqual(page.locator("html").get_attribute("data-bs-theme"), theme)
                self.assertEqual(
                    page.evaluate("getComputedStyle(document.documentElement).colorScheme"),
                    theme,
                )
                context.close()
