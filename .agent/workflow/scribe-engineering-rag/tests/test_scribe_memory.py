from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from scribe_test_utils import SCRIBE_FIXTURE, load_script_module, write_fixture


scribe_memory = load_script_module("scribe_memory")
scribe_main = getattr(scribe_memory, "main")


class ScribeMemoryCommandTests(unittest.TestCase):
    def run_cli(self, *args: str) -> tuple[int, str, str]:
        stdout = io.StringIO()
        stderr = io.StringIO()
        old_argv = sys.argv[:]
        sys.argv = ["scribe", *args]
        try:
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                code = scribe_main()
        finally:
            sys.argv = old_argv
        return code, stdout.getvalue(), stderr.getvalue()

    def test_stats_reports_health_and_graph_counts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            code, output, error = self.run_cli("stats", "--scribe", str(path))

        self.assertEqual(code, 0, error)
        self.assertIn("SCRIBE STATS", output)
        self.assertIn("doctor: 0 error(s)", output)
        self.assertIn("graph: 4 causal edge(s)", output)

    def test_query_uses_local_scribe_index(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            code, output, error = self.run_cli("query", "pyrefly shims", "--scribe", str(path), "--limit", "2")

        self.assertEqual(code, 0, error)
        self.assertIn("SCRIBE QUERY: pyrefly shims", output)
        self.assertIn("VAC-100 [vaccins]", output)

    def test_challenge_warns_on_relevant_high_debt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            code, output, error = self.run_cli(
                "challenge",
                "scale process-local limiter before using redis",
                "--scribe",
                str(path),
                "--limit",
                "3",
            )

        self.assertEqual(code, 0, error)
        self.assertIn("verdict: WARN", output)
        self.assertIn("DEBT-100 [debts]", output)

    def test_export_outputs_deterministic_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            code, output, error = self.run_cli("export", "--scribe", str(path), "--format", "json")

        self.assertEqual(code, 0, error)
        payload = json.loads(output)
        self.assertEqual(payload["summary"]["entities"], 4)
        self.assertEqual(payload["tiers"]["hot"], ["VAC-100", "PAT-100"])
        self.assertIn("VAC-100", {entity["id"] for entity in payload["entities"]})

    def test_promote_dry_run_does_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            before = path.read_text(encoding="utf-8")
            code, output, error = self.run_cli(
                "promote",
                "DEBT-100",
                "--tier",
                "hot",
                "--scribe",
                str(path),
                "--dry-run",
            )
            after = path.read_text(encoding="utf-8")

        self.assertEqual(code, 0, error)
        self.assertIn("dry-run: True", output)
        self.assertEqual(before, after)

    def test_promote_applies_targeted_tier_patch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            code, output, error = self.run_cli("promote", "DEBT-100", "--tier", "hot", "--scribe", str(path))
            updated = path.read_text(encoding="utf-8")

        self.assertEqual(code, 0, error)
        self.assertIn("verdict: promote applied", output)
        self.assertIn('    - "DEBT-100"', updated)
        self.assertIn('    tier: "hot"\n    status: "ACTIVE"\n    severite: "HIGH"', updated)

    def test_compact_apply_removes_duplicate_and_orphan_tier_refs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = write_fixture(Path(tmp))
            messy = path.read_text(encoding="utf-8").replace(
                '  hot: ["VAC-100", "PAT-100"]',
                '  hot: ["VAC-100", "VAC-100", "MISSING", "PAT-100"]',
            )
            path.write_text(messy, encoding="utf-8")
            code, output, error = self.run_cli("compact", "--scribe", str(path), "--apply")
            updated = path.read_text(encoding="utf-8")

        self.assertEqual(code, 0, error)
        self.assertIn("duplicate refs removed: 1", output)
        self.assertIn("orphan refs removed: 1", output)
        self.assertIn("verdict: compact applied", output)
        self.assertNotIn("MISSING", updated)
        self.assertEqual(updated.count('"VAC-100"'), 3)

    def test_archive_dry_run_does_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = write_cold_fixture(root)
            archive_path = root / "archive.yaml"
            before = path.read_text(encoding="utf-8")
            code, output, error = self.run_cli("archive", "--scribe", str(path), "--output", str(archive_path))
            after = path.read_text(encoding="utf-8")

        self.assertEqual(code, 0, error)
        self.assertIn("candidates: 1", output)
        self.assertIn("verdict: dry-run", output)
        self.assertEqual(before, after)
        self.assertFalse(archive_path.exists())

    def test_archive_apply_writes_archive_and_prunes_active_scribe(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = write_cold_fixture(root)
            archive_path = root / "archive.yaml"
            code, output, error = self.run_cli("archive", "--scribe", str(path), "--output", str(archive_path), "--apply")
            active = path.read_text(encoding="utf-8")
            archived = archive_path.read_text(encoding="utf-8")

        self.assertEqual(code, 0, error)
        self.assertIn("verdict: archived 1 entrie(s)", output)
        self.assertNotIn("PAT-200", active)
        self.assertIn('schema_version: "TENOR_SCRIBE_ARCHIVE_v1"', archived)
        self.assertIn('id: "PAT-200"', archived)

    def test_dashboard_writes_static_html_and_json_data(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = write_fixture(root)
            html_path = root / "dashboard.html"
            data_path = root / "dashboard.json"
            code, output, error = self.run_cli(
                "dashboard",
                "--scribe",
                str(path),
                "--output",
                str(html_path),
                "--data-output",
                str(data_path),
            )
            html = html_path.read_text(encoding="utf-8")
            data = json.loads(data_path.read_text(encoding="utf-8"))

        self.assertEqual(code, 0, error)
        self.assertIn("SCRIBE DASHBOARD", output)
        self.assertIn("Tableau de bord SCRIBE", html)
        self.assertIn("Explorateur mémoire", html)
        self.assertIn("Réinitialiser", html)
        self.assertIn('data-filter="query"', html)
        self.assertIn("data-entity-card", html)
        self.assertIn('data-chart="tiers"', html)
        self.assertIn('data-chart="collections"', html)
        self.assertIn('data-chart="risk"', html)
        self.assertIn("echarts.init", html)
        self.assertIn("VAC-100", html)
        self.assertNotIn("https://", html)
        self.assertEqual(data["summary"]["entities"], 4)


    def test_worktree_classifies_generated_noise(self) -> None:
        worktree = load_script_module("scribe_worktree")
        item = getattr(worktree, "StatusItem")
        classify = getattr(worktree, "classify")
        tracked, source, generated, other = classify([
            item(" M", "README.md"),
            item("??", "scribe-out/report.md"),
            item("??", ".agent/workflow/scribe-engineering-rag/scripts/tool.py"),
        ])

        self.assertEqual([entry.path for entry in tracked], ["README.md"])
        self.assertEqual([entry.path for entry in source], [".agent/workflow/scribe-engineering-rag/scripts/tool.py"])
        self.assertEqual([entry.path for entry in generated], ["scribe-out/report.md"])
        self.assertEqual(other, [])

def write_cold_fixture(directory: Path) -> Path:
    cold_pattern = """  - id: "PAT-200"
    tier: "cold"
    status: "ACTIVE"
    titre: "Old experiment"
    l0_abstract: "Old cold memory ready for archive."
"""
    content = SCRIBE_FIXTURE.replace('  cold: []', '  cold: ["PAT-200"]').replace("debts:\n", cold_pattern + "debts:\n")
    path = directory / "cold.scribe"
    path.write_text(content, encoding="utf-8")
    return path


if __name__ == "__main__":
    unittest.main()
