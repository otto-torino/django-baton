from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.contrib.admin.filters import DateFieldListFilter

from news.admin import NewsAdmin

from .utils import PlaywrightTestCase


class DateDropdownFilter(DateFieldListFilter):
    template = "baton/filters/dropdown_filter.html"


class TestBatonClFiltersForm(PlaywrightTestCase):
    def test_dropdown_option_with_multiple_params(self):
        # date filter options set both __gte and __lt: both must reach the url
        list_filter = (("date", DateDropdownFilter),)
        with mock.patch.object(NewsAdmin, "list_filter", list_filter):
            self.login("/admin/news/news/")
            self.page.wait_for_url(lambda url: "/login/" not in url)
            self.wait_baton_ready()
            self.page.click(".changelist-filter-toggler")
            # option 0 is "Any date", option 1 is "Today"
            self.page.locator("#changelist-filter-modal select").select_option(index=1)
            self.page.click(".modal.show .btn-action")
            self.page.wait_for_url(lambda url: "date__gte" in url)

            params = parse_qs(urlparse(self.page.url).query)
            self.assertEqual(set(params), {"date__gte", "date__lt"})
            self.assertRegex(params["date__gte"][0], r"^\d{4}-\d{2}-\d{2}$")
            self.assertRegex(params["date__lt"][0], r"^\d{4}-\d{2}-\d{2}$")
