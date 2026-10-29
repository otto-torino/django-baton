"""The count of words and characters under the textareas of the change form."""

from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonTextareaCounter(PlaywrightTestCase):
    viewport = {"width": 1400, "height": 900}

    def setUp(self):
        super().setUp()
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        self.page.locator(".nav-tabs .nav-link", has_text="Attachments").click()

    def test_the_counter_follows_the_text(self):
        textarea = self.page.locator("#id_attachments_summary_en")
        counter = self.page.locator("#id_attachments_summary_en_baton_counter")
        expect(counter).to_have_text("0 words · 0 characters")
        textarea.fill("Baton counts — these words 🙂")
        expect(counter).to_have_text("4 words · 28 characters")
        textarea.fill("one")
        expect(counter).to_have_text("1 word · 3 characters")

    def test_the_row_of_the_counter_is_as_wide_as_its_textarea(self):
        textarea = self.page.locator("#id_attachments_summary_en")
        footer = self.page.locator("#id_attachments_summary_en_baton_footer")
        expect(footer).to_be_visible()
        self.assertEqual(
            round(footer.bounding_box()["width"]), round(textarea.bounding_box()["width"])
        )

    def test_rich_text_editors_have_no_counter_of_baton(self):
        # the hidden textarea of django-editor-js
        expect(self.page.locator("#id_body_en_baton_counter")).to_have_count(0)

    def test_a_new_inline_row_counts_too(self):
        group = self.page.locator("#attachments-group")
        rows = group.locator(".dynamic-attachments")
        count = rows.count()
        group.locator(".add-row a").click()
        expect(rows).to_have_count(count + 1)
        textarea = rows.nth(count).locator("textarea").first
        counter = self.page.locator(f"#{textarea.get_attribute('id')}_baton_counter")
        textarea.fill("two words")
        expect(counter).to_have_text("2 words · 9 characters")
