"""The AI summaries: the button sits under the target field, and needs a source."""

from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonAiSummary(PlaywrightTestCase):
    viewport = {"width": 1400, "height": 900}

    def summary_button(self):
        return self.page.locator("a[data-baton-button]", has_text="Summarize from")

    def test_the_button_sits_under_the_target_field(self):
        self.login("/admin/news/news/2/change/")
        self.wait_baton_ready()
        button = self.summary_button()
        expect(button).to_have_count(1)
        expect(button).to_contain_text("Body [en]")
        expect(self.page.locator(".field-body_summary").locator("a[data-baton-button]", has_text="Summarize from")).to_have_count(1)

    def test_a_source_opens_the_dialog(self):
        self.login("/admin/news/news/2/change/")
        self.wait_baton_ready()
        self.summary_button().click()
        expect(self.page.locator(".modal.show")).to_be_visible()

    def test_an_empty_source_alerts_instead(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        messages = []
        self.page.on("dialog", lambda dialog: (messages.append(dialog.message), dialog.dismiss()))
        self.summary_button().click()
        expect(self.page.locator(".modal.show")).to_have_count(0)
        self.assertEqual(messages, ["To generate “Body summary”, fill in the field “Body [en]” first"])
