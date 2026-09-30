"""The AI image input, activated by core/ImageInput.js instead of inline scripts."""

from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonAiImageInput(PlaywrightTestCase):
    viewport = {"width": 1400, "height": 900}

    def setUp(self):
        super().setUp()
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

    def test_every_input_gets_its_buttons_without_inline_scripts(self):
        page = self.page
        inputs = page.locator("input[data-baton-ai-image]")
        self.assertGreater(inputs.count(), 1)
        for i in range(inputs.count()):
            name = inputs.nth(i).get_attribute("name")
            expect(page.locator(f'[id="generate-image-{name}"]')).to_have_count(1)
        expect(page.locator("#vision-button-id_image")).to_have_count(1)
        self.assertEqual(page.locator(".field-image script").count(), 0)

    def test_clicking_the_preview_moves_the_subject(self):
        page = self.page
        subject = page.locator("#id_image_subject_location")
        self.assertEqual(subject.input_value(), "50,50")

        preview = page.locator("#subject-image-preview-id_image")
        # the tab holding the image field
        pane = preview.evaluate("preview => preview.closest('.tab-pane').id")
        page.locator(f'.nav-tabs [data-bs-target="#{pane}"]').click()
        # and its collapsed fieldset: a details element since Django 5.1
        preview.evaluate(
            """preview => {
                const details = preview.closest('details')
                if (details) details.open = true
                const fieldset = preview.closest('fieldset.collapsed')
                if (fieldset) fieldset.classList.remove('collapsed')
            }"""
        )
        expect(preview).to_be_visible()
        box = preview.bounding_box()
        preview.click(position={"x": box["width"] * 0.25, "y": box["height"] * 0.75})

        left, top = (int(value) for value in subject.input_value().split(","))
        self.assertAlmostEqual(left, 25, delta=3)
        self.assertAlmostEqual(top, 75, delta=3)

    def test_new_inline_rows_get_working_buttons(self):
        page = self.page
        page.locator(".nav-tabs .nav-link", has_text="Activities").click()
        rows = page.locator("input[data-baton-ai-image][name^=news-activity]:not([name*=__prefix__])")
        before = rows.count()

        page.locator("#news-activity-content_type-object_id-group .add-row a").click()
        expect(rows).to_have_count(before + 1)

        name = rows.nth(before).get_attribute("name")
        page.locator(f'[id="generate-image-{name}"]').click()
        expect(page.locator(".modal.show")).to_be_visible()
