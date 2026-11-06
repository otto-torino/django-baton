from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonCollapseEntry(PlaywrightTestCase):
    def test_compact_rows_and_keyboard_toggle(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)
        row = self.page.locator("#videos-0")
        expect(row.locator(".baton-inline-name")).not_to_be_empty()
        button = row.locator(".baton-inline-main")
        expect(button).to_have_attribute("aria-expanded", "true")
        button.focus()
        self.page.keyboard.press("Space")
        expect(row.locator("fieldset").first).to_be_hidden()
        expect(button).to_have_attribute("aria-expanded", "false")
        self.page.keyboard.press("Enter")
        expect(row.locator("fieldset").first).to_be_visible()

    def test_deletion_can_be_undone_before_saving(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)
        row = self.page.locator("#videos-0")
        row.locator(".baton-inline-menu").click()
        row.get_by_role("button", name="Delete", exact=True).click()
        expect(row.locator('[name$="-DELETE"]')).to_be_checked()
        expect(row.locator("fieldset").first).to_be_hidden()
        row.locator(".baton-inline-menu").click()
        row.get_by_role("button", name="Undo deletion", exact=True).click()
        expect(row.locator('[name$="-DELETE"]')).not_to_be_checked()

    def test_new_rows_use_the_native_removal_and_management_count(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)
        group = self.page.locator("#videos-group")
        total = self.page.locator("#id_videos-TOTAL_FORMS")
        before = int(total.input_value())
        group.locator(".add-row a").click()
        expect(total).to_have_value(str(before + 1))
        row = group.locator(".baton-stacked-row").last
        expect(row.locator("fieldset").first).to_be_visible()
        row.locator(".baton-inline-menu").click()
        row.get_by_role("button", name="Delete", exact=True).click()
        expect(total).to_have_value(str(before))
        expect(group.locator(".baton-stacked-row")).to_have_count(before)

    def test_the_extra_rows_have_the_menu_instead_of_the_remove_button(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)
        row = self.page.locator("#videos-1")
        expect(row.locator(".baton-inline-menu")).to_be_visible()
        expect(row.locator(".inline-deletelink")).to_be_hidden()

    def test_invalid_rows_reopen_after_submission(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)
        self.page.locator("#id_videos-1-code").fill("incomplete new video")
        self.page.locator('input[type="submit"][name="_continue"]').click()
        self.wait_baton_ready()
        expect(self.page.locator("#videos-1 fieldset").first).to_be_visible()
        expect(self.page.locator("#videos-1 .errorlist")).to_be_visible()

    def test_tabular_inlines_keep_their_table(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(3)
        group = self.page.locator("#attachments-group")
        expect(group.locator("table")).to_be_visible()
        expect(group.locator(".baton-stacked-row")).to_have_count(0)

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

    def test_without_collapse_entry_the_saved_entries_are_open(self):
        # news 1 has a saved video, the inline has no classes
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)  # Videos

        row = self.page.locator("#videos-0")
        expect(row.locator("fieldset").first).to_be_visible()
        # it closes and opens as the others
        row.locator(".baton-inline-toggle").click()
        expect(row.locator("fieldset").first).to_be_hidden()

    def test_the_new_first_entry_of_expand_first_stays_open(self):
        self.login("/admin/news/news/add/")
        self.wait_baton_ready()
        self.open_tab(5)  # Activities

        prefix = "#news-activity-content_type-object_id"
        expect(self.page.locator(f"{prefix}-0 > fieldset").first).to_be_visible()

    def test_the_entry_added_with_the_button_is_open(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.open_tab(4)  # Videos

        self.page.locator("#videos-group .add-row a").click()

        expect(self.page.locator("#videos-2 > fieldset").first).to_be_visible()
        # the existing video and the extra form keep their state
        expect(self.page.locator("#videos-0 > fieldset").first).to_be_visible()
        expect(self.page.locator("#videos-1 > fieldset").first).to_be_visible()
