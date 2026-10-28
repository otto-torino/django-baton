from urllib.parse import urlparse

from playwright.sync_api import expect

from .utils import PlaywrightTestCase


class TestBatonFormIncludes(PlaywrightTestCase):
    def test_includes(self):
        self.login("/admin/news/news/1/change/")
        self.wait_baton_ready()

        expect(
            self.page.locator(".form-row.field-datetime").get_by_text(
                "this datetime field is just used for internal reasons"
            )
        ).to_have_count(1)

    def test_foreign_template_without_id(self):
        # widgets of other apps (e.g. django-filer) put their own <template>
        # tags, without id, in the change form: baton must leave them alone
        def inject_template(route):
            response = route.fetch()
            body = response.text().replace(
                "</body>",
                '<template class="foreign-template"><span>foreign</span></template></body>',
            )
            route.fulfill(response=response, body=body)

        self.login()
        self.page.route(
            lambda url: urlparse(url).path.endswith("/admin/news/news/1/change/"),
            inject_template,
        )
        self.page.goto(self.url("/admin/news/news/1/change/"))
        self.wait_baton_ready()

        expect(self.page.locator("template.foreign-template")).to_have_count(1)
        expect(
            self.page.locator(".form-row.field-datetime").get_by_text(
                "this datetime field is just used for internal reasons"
            )
        ).to_have_count(1)
