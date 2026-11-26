from news.models import Category
from playwright.sync_api import expect

from .utils import PlaywrightTestCase

CHANGELIST = "/admin/news/category/"


class TestBatonClSortable(PlaywrightTestCase):
    """The categories, ordered by dragging their rows (BatonSortableMixin)."""

    def names(self):
        return list(Category.objects.values_list("name", flat=True))

    def rows(self):
        return self.page.locator("#result_list tbody th.field-name, #result_list tbody td.field-name")

    def open(self, query=""):
        self.login(CHANGELIST + query)
        self.wait_baton_ready()

    def test_drag(self):
        self.open()
        page = self.page
        expect(self.rows()).to_have_text(["Music", "Sports", "Culture"])
        expect(page.locator("#result_list th.column-baton_sortable_handle")).to_have_text("Position")
        handle = page.locator(".baton-cl-sort-handle[data-pk='3']").bounding_box()
        target = page.locator("#result_list tbody tr").nth(1).bounding_box()
        with page.expect_navigation():
            # by steps, as a hand would: SortableJS follows the native drag events
            page.mouse.move(handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2)
            page.mouse.down()
            page.mouse.move(target["x"] + 20, target["y"] + target["height"] / 2, steps=20)
            page.mouse.up()
        self.wait_baton_ready()
        expect(self.rows()).to_have_text(["Music", "Culture", "Sports"])
        expect(page.locator(".baton-cl-sort-value")).to_have_text(["1", "2", "3"])
        self.assertEqual(self.names(), ["Music", "Culture", "Sports"])
        expect(page.get_by_text("The order has been saved.")).to_be_visible()

    def test_keyboard(self):
        self.open()
        page = self.page
        handle = page.locator(".baton-cl-sort-handle[data-pk='1']")
        handle.focus()
        with page.expect_navigation():
            page.keyboard.press("ArrowDown")
            page.keyboard.press("ArrowDown")
        self.wait_baton_ready()
        expect(self.rows()).to_have_text(["Sports", "Culture", "Music"])
        # back on the moved row
        expect(page.locator(".baton-cl-sort-handle[data-pk='1']")).to_be_focused()

    def test_other_ordering(self):
        self.open("?o=1")
        page = self.page
        expect(self.rows()).to_have_text(["Culture", "Music", "Sports"])
        expect(page.locator(".baton-cl-sort-handle").first).to_be_disabled()
        notice = page.locator(".baton-cl-sort-notice")
        expect(notice).to_contain_text("Position")
        notice.locator("a").click()
        self.wait_baton_ready()
        expect(self.rows()).to_have_text(["Music", "Sports", "Culture"])
        expect(page.locator(".baton-cl-sort-handle").first).to_be_enabled()
        expect(page.locator(".baton-cl-sort-notice")).to_have_count(0)
