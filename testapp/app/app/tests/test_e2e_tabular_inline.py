import re

from playwright.sync_api import expect

from news.models import Attachment

from .utils import PlaywrightTestCase


class TestBatonTabularInline(PlaywrightTestCase):
    """The attachments of a news: a tabular inline ordered by position."""

    def setUp(self) -> None:
        super().setUp()
        # news 1 has one attachment in the fixture: a second one to reorder
        Attachment.objects.create(
            news_id=1, file="news/img/otto.png", caption="Second", position=1
        )

    def open_attachments(self) -> None:
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.page.locator(".nav-tabs .nav-item").nth(3).click()

    def positions(self) -> list[str]:
        group = self.page.locator("#attachments-group")
        return [
            field.input_value()
            for field in group.locator('.baton-tabular-row.has_original input[name$="-position"]').all()
        ]

    def test_the_table_has_a_handle_and_a_menu_instead_of_the_delete_column(self):
        self.open_attachments()
        group = self.page.locator("#attachments-group")
        row = group.locator(".baton-tabular-row").first
        expect(row.locator(".baton-inline-name")).to_have_text("Otto logo")
        expect(row.locator(".baton-inline-handle")).to_be_visible()
        expect(row.locator(".baton-inline-menu")).to_be_visible()
        # the "Delete?" checkbox and the position are set from the handle
        # and the menu
        expect(row.locator('[name$="-DELETE"]')).to_be_hidden()
        expect(row.locator('[name$="-position"]')).to_be_hidden()
        expect(group.locator("thead th.column-position")).to_be_hidden()

    def test_the_arrow_keys_reorder_the_rows(self):
        self.open_attachments()
        self.assertEqual(self.positions(), ["0", "1"])
        group = self.page.locator("#attachments-group")
        group.locator(".baton-tabular-row").first.locator(".baton-inline-handle").focus()
        self.page.keyboard.press("ArrowDown")
        expect(group.locator(".baton-tabular-row").first.locator(".baton-inline-name")).to_have_text("Second")
        self.assertEqual(self.positions(), ["0", "1"])
        self.page.locator('input[type="submit"][name="_continue"]').click()
        self.wait_baton_ready()
        self.assertEqual(
            list(Attachment.objects.filter(news_id=1).values_list("caption", flat=True)),
            ["Second", "Otto logo"],
        )

    def test_deletion_can_be_undone_before_saving(self):
        self.open_attachments()
        row = self.page.locator("#attachments-group .baton-tabular-row").first
        row.locator(".baton-inline-menu").click()
        self.page.get_by_role("button", name="Delete", exact=True).click()
        expect(row.locator('[name$="-DELETE"]')).to_be_checked()
        expect(row).to_have_class(re.compile(r"\bis-deleted\b"))
        row.locator(".baton-inline-menu").click()
        self.page.get_by_role("button", name="Undo deletion", exact=True).click()
        expect(row.locator('[name$="-DELETE"]')).not_to_be_checked()

    def test_new_rows_are_removed_from_their_menu(self):
        self.open_attachments()
        group = self.page.locator("#attachments-group")
        total = self.page.locator("#id_attachments-TOTAL_FORMS")
        before = int(total.input_value())
        group.locator(".add-row a").click()
        expect(total).to_have_value(str(before + 1))
        row = group.locator(".baton-tabular-row").last
        # the remove button of Django is in the menu
        expect(row.locator(".inline-deletelink")).to_be_hidden()
        row.scroll_into_view_if_needed()
        row.locator(".baton-inline-menu").click()
        row.get_by_role("button", name="Delete", exact=True).click()
        expect(total).to_have_value(str(before))
