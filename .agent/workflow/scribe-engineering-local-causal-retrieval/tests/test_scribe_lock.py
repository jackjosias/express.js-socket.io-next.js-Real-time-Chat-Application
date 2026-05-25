from __future__ import annotations

import contextlib
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path

from scribe_test_utils import load_script_module


scribe_lock = load_script_module("scribe_lock")
lock_main = getattr(scribe_lock, "main")


class ScribeLockTests(unittest.TestCase):
    def run_cli(self, *args: str) -> tuple[int, str, str]:
        stdout = io.StringIO()
        stderr = io.StringIO()
        old_argv = sys.argv[:]
        sys.argv = ["scribe lock", *args]
        try:
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                code = lock_main()
        finally:
            sys.argv = old_argv
        return code, stdout.getvalue(), stderr.getvalue()

    @contextlib.contextmanager
    def isolated_lock_path(self, root: Path):
        old_lock_path = os.environ.get("SCRIBE_LOCK_PATH")
        os.environ["SCRIBE_LOCK_PATH"] = str(root / "locks" / "scribe.lock")
        try:
            yield
        finally:
            if old_lock_path is None:
                os.environ.pop("SCRIBE_LOCK_PATH", None)
            else:
                os.environ["SCRIBE_LOCK_PATH"] = old_lock_path

    def test_acquire_status_release_cycle(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, self.isolated_lock_path(Path(tmp)):
            code, output, error = self.run_cli("acquire", "--agent", "unit", "--session", "JOURNAL-100")
            self.assertEqual(code, 0, error)
            self.assertIn("acquired", output)

            code, output, error = self.run_cli("status")
            self.assertEqual(code, 0, error)
            self.assertIn("state: locked", output)
            self.assertIn("agent: unit", output)

            code, output, error = self.run_cli("release", "--agent", "unit")
            self.assertEqual(code, 0, error)
            self.assertIn("released", output)

    def test_status_releases_stale_pid(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, self.isolated_lock_path(Path(tmp)):
            lock_path = Path(os.environ["SCRIBE_LOCK_PATH"])
            lock_path.parent.mkdir(parents=True, exist_ok=True)
            lock_path.write_text(
                '{"agent":"dead","session":"JOURNAL-999","pid":0,"acquired_at":"2026-01-01T00:00:00Z","surface":"scribe-memory","ttl_minutes":30}\n',
                encoding="utf-8",
            )

            code, output, error = self.run_cli("status")

        self.assertEqual(code, 0, error)
        self.assertIn("state: unlocked", output)
        self.assertIn("stale_released:", output)


if __name__ == "__main__":
    unittest.main()
