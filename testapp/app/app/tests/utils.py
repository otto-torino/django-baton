"""Shared base class for the Playwright end-to-end tests.

These tests were migrated from Selenium to Playwright. Instead of relying on a
separately started `runserver` on a fixed port backed by the committed
db.sqlite3, they use Django's StaticLiveServerTestCase: an isolated test
database (seeded from the ``e2e.json`` fixture) served on a random port, with
baton's static assets served automatically. Playwright's auto-waiting replaces
the old explicit WebDriverWait/time.sleep dance.
"""

from __future__ import annotations

import os

# Playwright's sync API runs an event loop in the test thread; Django's async
# safety guard would otherwise reject the (safe, single-threaded) DB access we
# do around it. This is the approach documented by Django for Playwright.
os.environ.setdefault("DJANGO_ALLOW_ASYNC_UNSAFE", "true")

from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from playwright.sync_api import Page, sync_playwright


class PlaywrightTestCase(StaticLiveServerTestCase):
    # Curated data (admin user, news with tabs/attachments, categories, tags,
    # themes) dumped from the demo db; see app/fixtures/e2e.json.
    fixtures = ["e2e.json"]

    # Desktop viewport by default; mobile test cases override it.
    viewport = {"width": 1920, "height": 1080}

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

    @classmethod
    def tearDownClass(cls) -> None:
        cls.browser.close()
        cls.playwright.stop()
        super().tearDownClass()

    def setUp(self) -> None:
        self.context = self.browser.new_context(viewport=self.viewport)
        self.page = self.context.new_page()
        # baton relies on JS that can outlive the assertion; a generous default
        # timeout keeps CI stable without per-call waits.
        self.page.set_default_timeout(15000)
        # uncaught JS errors fail the test, with the page they happened on:
        # they would otherwise go unnoticed while the assertions still pass
        self.page_errors: list[str] = []
        self.page.on(
            "pageerror",
            lambda error: self.page_errors.append(f"{self.page.url}: {error.message}"),
        )

    def tearDown(self) -> None:
        self.context.close()
        self.assertEqual(self.page_errors, [], "uncaught JavaScript errors")

    def url(self, path: str) -> str:
        """Absolute URL on the live server for an admin/relative path."""
        return f"{self.live_server_url}{path}"

    def login(self, next_path: str = "/admin/") -> Page:
        """Log in as the superuser through the admin login form.

        Navigates to ``next_path`` first (which redirects to the login form when
        unauthenticated), so after submitting we land back on the target page,
        mirroring the original Selenium flow.
        """
        page = self.page
        page.goto(self.url(next_path))
        page.fill("#id_username", "admin")
        page.fill("#id_password", "admin")
        page.click("input[type=submit]")
        return page

    def wait_baton_ready(self) -> None:
        """Wait until baton has finished bootstrapping the page."""
        self.page.wait_for_selector("body.baton-ready")
