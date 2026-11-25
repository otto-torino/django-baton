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


class BatonSearchFieldsTests(SimpleTestCase):
    def labels(self, fields: list[str]) -> list[str]:
        from types import SimpleNamespace
        from django.contrib.auth.models import User
        from django.utils.translation import override
        from baton.templatetags.baton_tags import baton_search_fields

        with override("en"):
            return baton_search_fields(SimpleNamespace(model=User, search_fields=fields))

    def test_prefixes_relations_lookups_and_primary_key(self) -> None:
        self.assertEqual(
            self.labels(["^username", "=email", "groups__name__icontains", "pk__exact"]),
            ["Username", "Email address", "Groups → Name", "ID"],
        )

    def test_repeated_labels_are_only_shown_once(self) -> None:
        self.assertEqual(self.labels(["username", "^username", "username__iexact"]), ["Username"])

    def test_custom_search_paths_have_readable_fallbacks(self) -> None:
        self.assertEqual(self.labels(["external_search__code"]), ["External search → code"])

    def test_no_search_fields(self) -> None:
        self.assertEqual(self.labels([]), [])
