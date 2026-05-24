from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scribe_test_utils import load_script_module, write_fixture


scribe_store = load_script_module("scribe_store")
load_scribe = getattr(scribe_store, "load_scribe")
tokenize = getattr(scribe_store, "tokenize")

scribe_bundle_graph = load_script_module("scribe_bundle_graph")
should_skip_bundle_graph_path = getattr(scribe_bundle_graph, "should_skip_bundle_graph_path")


class ScribeStoreTests(unittest.TestCase):
    def test_load_scribe_builds_indexes_once(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = load_scribe(write_fixture(Path(tmp)))

        self.assertEqual(store.findings, [])
        entity = store.by_id("VAC-100")
        if entity is None:
            self.fail("VAC-100 was not indexed")
        self.assertEqual(entity.collection, "vaccins")
        self.assertEqual([entity.id for entity in store.hot_entities()], ["VAC-100", "PAT-100"])
        self.assertEqual(len(store.index.text_index), 4)
        self.assertEqual(sum(len(targets) for targets in store.index.causal_edges.values()), 4)

    def test_related_returns_forward_and_reverse_causal_links(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = load_scribe(write_fixture(Path(tmp)))

        outgoing, incoming = store.related("VAC-100")

        self.assertEqual([entity.id for entity in outgoing], ["PAT-100"])
        self.assertEqual([entity.id for entity in incoming], ["JOURNAL-100"])

    def test_search_scores_hot_matching_memory_first(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = load_scribe(write_fixture(Path(tmp)))

        results = store.search("pyrefly shims", limit=2)

        self.assertGreaterEqual(results[0][0], results[-1][0])
        self.assertEqual(results[0][1].entity.id, "VAC-100")


    def test_search_expands_french_synonyms(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = load_scribe(write_fixture(Path(tmp)))

        results = store.search("recherche memoire", limit=2)

        self.assertTrue(results)
        self.assertEqual(results[0][1].entity.id, "PAT-100")

    def test_search_tolerates_french_typos(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            store = load_scribe(write_fixture(Path(tmp)))

        results = store.search("rechreche causla", limit=2)

        self.assertTrue(results)
        self.assertEqual(results[0][1].entity.id, "PAT-100")

    def test_tokenize_keeps_ids_and_long_terms(self) -> None:
        self.assertEqual(tokenize("VAC-100 Pyrefly IO"), {"vac-100", "pyrefly"})

    def test_bundle_graph_skips_vendor_and_minified_assets(self) -> None:
        self.assertTrue(should_skip_bundle_graph_path(Path("vendor/echarts/echarts.min.js")))
        self.assertTrue(should_skip_bundle_graph_path(Path("dashboard.min.js")))
        self.assertFalse(should_skip_bundle_graph_path(Path("scripts/scribe_search.py")))


if __name__ == "__main__":
    unittest.main()
