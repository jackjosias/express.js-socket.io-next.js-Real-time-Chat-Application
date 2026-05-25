from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from scribe_test_utils import load_script_module


scribe_bootstrap = load_script_module("scribe_bootstrap")
bootstrap_project = getattr(scribe_bootstrap, "bootstrap_project")
create_scribe_from_template = getattr(scribe_bootstrap, "create_scribe_from_template")

scribe_state = load_script_module("scribe_state")
update_state_after_write = getattr(scribe_state, "update_state_after_write")


class ScribeBootstrapTests(unittest.TestCase):
    def run_bootstrap(self, root: Path):
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            return bootstrap_project(root, agent="test-agent", agent_type="cli", skip_graphify=True)

    def test_bootstrap_initializes_empty_project(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            report = self.run_bootstrap(root)

            self.assertTrue(report.new_project)
            self.assertEqual(report.doctor_code, 0)
            self.assertTrue(report.sync_repaired)
            self.assertTrue((root / ".agent" / "workflow" / "scribe-engineering-local-causal-retrieval" / "scribe").exists())
            self.assertTrue((root / "AGENT-MEMOIRE_PROJECT_STATUS.scribe").exists())
            self.assertTrue((root / "scribe-out" / "state.json").exists())
            self.assertTrue((root / "AGENTS.md").exists())
            self.assertTrue((root / ".agent" / "rules" / "scribe.md").exists())
            self.assertTrue((root / ".agent" / ".gitignore").exists())
            self.assertTrue((root / ".graphifyignore").exists())

    def test_bootstrap_detects_package_stack_when_scribe_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text(
                '{"name":"demo-chat","dependencies":{"next":"1","express":"1","socket.io":"1","@prisma/client":"1"}}',
                encoding="utf-8",
            )

            report = self.run_bootstrap(root)
            scribe = (root / "AGENT-MEMOIRE_PROJECT_STATUS.scribe").read_text(encoding="utf-8")

            self.assertTrue(report.new_project)
            self.assertIn('project_name: "demo-chat"', scribe)
            self.assertIn('stack: "Node.js / Next.js / Express / Socket.IO / Prisma"', scribe)

    def test_bootstrap_is_idempotent_on_existing_project(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            scribe_path = create_scribe_from_template(root)
            update_state_after_write(
                scribe_path,
                "existing-agent",
                "cli",
                "JOURNAL-000",
                ["PAT-GRAPH-001", "JOURNAL-000"],
                "install",
            )
            before = scribe_path.read_text(encoding="utf-8")

            report = self.run_bootstrap(root)

            self.assertFalse(report.new_project)
            self.assertEqual(report.doctor_code, 0)
            self.assertFalse(report.sync_repaired)
            self.assertEqual(scribe_path.read_text(encoding="utf-8"), before)


if __name__ == "__main__":
    unittest.main()
