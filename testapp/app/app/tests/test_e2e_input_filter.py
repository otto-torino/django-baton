from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonInputFilter(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.login("/admin/news/news/")
        self.wait_baton_ready()

    def test_filter(self):
        page = self.page
        expect(page.locator("#result_list tbody tr")).to_have_count(2)

        page.click(".changelist-filter-toggler")
        page.fill("#changelist-filter-modal li > input", "glen")
        page.click(".modal.show .btn-action")

        expect(page.locator("#result_list tbody tr")).to_have_count(1)
