from django.contrib.admin.views.main import ALL_VAR
from django.test import SimpleTestCase

from baton.admin import BatonChangeList


class BatonChangeListTests(SimpleTestCase):
    def test_show_all_query_string_removes_page_size(self) -> None:
        changelist = BatonChangeList.__new__(BatonChangeList)
        changelist.params = {'ps': '25', 'q': 'search'}
        changelist.filter_params = changelist.params

        query_string = changelist.get_query_string({ALL_VAR: ''})

        self.assertEqual(query_string, '?all=&q=search')

    def test_regular_query_string_preserves_page_size(self) -> None:
        changelist = BatonChangeList.__new__(BatonChangeList)
        changelist.params = {'ps': '25', 'q': 'search'}
        changelist.filter_params = changelist.params

        query_string = changelist.get_query_string({'o': '1'})

        self.assertEqual(query_string, '?o=1&ps=25&q=search')
