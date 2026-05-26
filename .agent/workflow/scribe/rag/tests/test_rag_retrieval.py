from __future__ import annotations

import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from rag_challenge import challenge
from rag_compact import format_results
from rag_context import context
from rag_test_fixtures import build_auth_test_index
from rag_scoring import retrieve

class RagRetrievalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.index = build_auth_test_index()

    def ids(self, query: str):
        return [result.entity.get("id") for result in retrieve(query, self.index, top_k=5)]

    def test_semantic_token_client_finds_auth_memory(self) -> None:
        self.assertIn("GHOST-005", self.ids("stocker token côté client"))

    def test_refresh_bug_finds_scar(self) -> None:
        self.assertIn("SCAR-003", self.ids("bug concurrent refresh"))

    def test_localstorage_negative_memory_is_retrieved(self) -> None:
        ids = self.ids("ne jamais utiliser localStorage")
        self.assertTrue("GHOST-005" in ids or "DEBT-003" in ids)

    def test_challenge_blocks_localstorage_jwt(self) -> None:
        verdict, _ = challenge("mettre JWT en localStorage", self.index)
        self.assertEqual(verdict, "STOP")

    def test_challenge_allows_httponly_cookie(self) -> None:
        verdict, _ = challenge("mettre JWT en cookie HttpOnly", self.index)
        self.assertEqual(verdict, "PROCEED")

    def test_challenge_allows_approved_cookie_refresh_rotation(self) -> None:
        verdict, _ = challenge("cookies HttpOnly refresh rotation", self.index)
        self.assertEqual(verdict, "PROCEED")

    def test_negative_memory_does_not_block_generic_empty_project_overlap(self) -> None:
        verdict, _ = challenge("corriger bootstrap projet vide pour BM25 canonique", self.index)
        self.assertNotEqual(verdict, "STOP")

    def test_negative_memory_allows_scriberag_interface_with_sel_engine(self) -> None:
        verdict, _ = challenge("utiliser scribe-rag comme interface agent et garder SEL comme moteur interne", self.index)
        self.assertEqual(verdict, "PROCEED")

    def test_compact_query_line_budget(self) -> None:
        output = format_results("SCRIBE-RAG QUERY: auth jwt", retrieve("auth jwt", self.index, top_k=5))
        self.assertLessEqual(len(output.splitlines()), 15)

    def test_context_line_budget(self) -> None:
        self.assertLessEqual(len(context(self.index).splitlines()), 35)

if __name__ == "__main__":
    unittest.main()
