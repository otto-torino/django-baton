from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonClColumns(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.login("/admin/news/news/")
        self.wait_baton_ready()

    def open_columns(self):
        self.page.locator(".changelist-columns-toggler").click()
        expect(self.page.locator(".columns-toggle-list")).to_be_visible()

    def test_hidden_by_default(self):
        page = self.page
        # datetime is in baton_cl_hidden_columns, date is not
        expect(page.locator("#result_list th.column-datetime")).to_be_hidden()
        expect(page.locator("#result_list td.field-datetime").first).to_be_hidden()
        expect(page.locator("#result_list th.column-date")).to_be_visible()

        self.open_columns()
        expect(page.locator("#column-toggle-datetime")).not_to_be_checked()
        expect(page.locator("#column-toggle-date")).to_be_checked()

    def test_choices_win_over_the_default(self):
        page = self.page
        self.open_columns()
        page.locator("#column-toggle-datetime").check()
        page.locator("#column-toggle-date").uncheck()
        expect(page.locator("#result_list th.column-datetime")).to_be_visible()
        expect(page.locator("#result_list th.column-date")).to_be_hidden()

        page.reload()
        self.wait_baton_ready()
        expect(page.locator("#result_list th.column-datetime")).to_be_visible()
        expect(page.locator("#result_list th.column-date")).to_be_hidden()

    def test_old_storage_format(self):
        page = self.page
        # the list of the hidden columns, as stored before the default hidden columns
        page.evaluate("localStorage.setItem('baton-hidden-columns:' + location.pathname, '[\"date\"]')")
        page.reload()
        self.wait_baton_ready()
        expect(page.locator("#result_list th.column-date")).to_be_hidden()
        expect(page.locator("#result_list th.column-datetime")).to_be_hidden()
