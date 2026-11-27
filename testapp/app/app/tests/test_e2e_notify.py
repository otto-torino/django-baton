from .utils import PlaywrightTestCase


class TestBatonNotify(PlaywrightTestCase):
    def setUp(self):
        super().setUp()
        self.login()
        self.wait_baton_ready()

    def test_a_toast_for_an_outcome_after_the_page_has_loaded(self):
        page = self.page

        page.evaluate("window.firstToast = Baton.notify('success', 'Order <b>saved</b>')")
        page.evaluate("Baton.notify('error', 'Not saved')")

        toasts = page.locator(".baton-toast-container .baton-toast")
        toasts.first.wait_for(state="visible")
        self.assertEqual(toasts.count(), 2)
        self.assertIn("baton-toast-success", toasts.first.get_attribute("class"))
        # plain text, not markup
        self.assertEqual(toasts.first.locator(".baton-toast-content").inner_text(), "Order <b>saved</b>")
        self.assertIn("baton-toast-danger", toasts.nth(1).get_attribute("class"))

        # the element it returns dismisses it
        page.evaluate("window.firstToast.querySelector('.btn-close').click()")
        page.wait_for_function("document.querySelectorAll('.baton-toast').length === 1")
