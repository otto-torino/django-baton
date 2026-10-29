"""The AI summaries: the button sits under the target field, and needs a source."""

from django.conf import settings
from django.test import override_settings
from playwright.sync_api import expect

from .utils import PlaywrightTestCase


# the buttons show up only with the credentials, which the CI does not have: none of these tests reaches the API
@override_settings(BATON={**settings.BATON, "BATON_CLIENT_ID": "e2e", "BATON_CLIENT_SECRET": "e2e"})
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
        # beside the counter of django-editor-js, under the editor
        expect(self.page.locator("#id_body_summary_footer .baton-field-actions").locator("a[data-baton-button]", has_text="Summarize from")).to_have_count(1)

    def test_the_target_keeps_its_correction_button(self):
        self.login("/admin/news/news/2/change/")
        self.wait_baton_ready()
        expect(self.page.locator('label[for="id_body_summary"] a[data-baton-button]', has_text="spellcheck")).to_have_count(1)

    def test_a_source_opens_the_dialog(self):
        self.login("/admin/news/news/2/change/")
        self.wait_baton_ready()
        self.summary_button().click()
        expect(self.page.locator(".modal.show")).to_be_visible()
        expect(self.page.locator(".modal.show .modal-title")).to_have_text("Summarize in - Body summary")

    def test_an_empty_source_alerts_instead(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()
        messages = []
        self.page.on("dialog", lambda dialog: (messages.append(dialog.message), dialog.dismiss()))
        self.summary_button().click()
        expect(self.page.locator(".modal.show")).to_have_count(0)
        self.assertEqual(messages, ["To generate “Body summary”, fill in the field “Body [en]” first"])
