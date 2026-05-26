from __future__ import annotations

import shutil
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from rag_interface import SEL_CLI, export_scribe

class RagInterfaceTests(unittest.TestCase):
    def test_sel_cli_resolves_to_canonical_path(self) -> None:
        self.assertTrue(SEL_CLI.exists())
        self.assertEqual(SEL_CLI.name, "scribe")
        self.assertIn("scribe-engineering-local-causal-retrieval", str(SEL_CLI))

    def test_sel_cli_not_from_path(self) -> None:
        path_scribe = shutil.which("scribe")
        if path_scribe is not None:
            self.assertNotEqual(str(SEL_CLI), path_scribe)

    def test_export_json_contract(self) -> None:
        payload = export_scribe(include_values=True)
        self.assertIn("entities", payload)
        self.assertIsInstance(payload["entities"], list)
        self.assertTrue(any(item.get("id") == "GHOST-005" for item in payload["entities"] if isinstance(item, dict)))

if __name__ == "__main__":
    unittest.main()
