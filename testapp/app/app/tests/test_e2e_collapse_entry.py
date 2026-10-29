from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonCollapseEntry(PlaywrightTestCase):
    def open_tab(self, index: int) -> None:
        self.page.locator(".nav-tabs .nav-item").nth(index).click()

    def test_existing_entries_are_collapsed_and_new_ones_open(self):
        # news 2 has two activities, the inline has collapse-entry and expand-first
        self.login("/admin/news/news/2/change/")
        self.wait_baton_ready()
        self.open_tab(5)  # Activities
        prefix = "#news-activity-content_type-object_id"

        expect(self.page.locator(f"{prefix}-0 > fieldset").first).to_be_visible()
        expect(self.page.locator(f"{prefix}-1 > fieldset").first).to_be_hidden()
        expect(self.page.locator(f"{prefix}-2 > fieldset").first).to_be_visible()

    def test_the_new_first_entry_of_expand_first_stays_open(self):
        self.login("/admin/news/news/add/")
        self.wait_baton_ready()
        self.open_tab(4)  # Videos

        expect(self.page.locator("#videos-0 > fieldset").first).to_be_visible()

    def test_the_entry_added_with_the_button_is_open(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)  # Videos

        self.page.locator("#videos-group .add-row a").click()

        expect(self.page.locator("#videos-2 > fieldset").first).to_be_visible()
        # the existing video and the extra form keep their state
        expect(self.page.locator("#videos-0 > fieldset").first).to_be_visible()
        expect(self.page.locator("#videos-1 > fieldset").first).to_be_visible()
