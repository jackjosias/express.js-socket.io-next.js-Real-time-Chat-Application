from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

SCRIPT_PATH = Path(__file__).resolve()


def find_project_root(path: Path) -> Path:
    for ancestor in path.parents:
        if ancestor.name == ".agent":
            return ancestor.parent
    raise RuntimeError(f"Cannot resolve project root from {path}")


def find_portable_root(path: Path) -> Path:
    for ancestor in path.parents:
        if ancestor.name == "scribe" and ancestor.parent.name == "workflow":
            if (ancestor / "sel" / "scribe").exists():
                return ancestor
    raise RuntimeError(f"Cannot resolve portable SCRIBE root from {path}")


SCRIBE_RAG_ROOT = SCRIPT_PATH.parents[1]
SCRIBE_ROOT = find_portable_root(SCRIPT_PATH)
PROJECT_ROOT = find_project_root(SCRIPT_PATH)
SEL_CLI = (SCRIBE_ROOT / "scribe").resolve()
DEFAULT_SCRIBE = PROJECT_ROOT / "AGENT-MEMOIRE_PROJECT_STATUS.scribe"
RAG_INDEX_PATH = PROJECT_ROOT / "scribe-out" / "rag-index.json"


class SELCommandError(RuntimeError):
    pass


def sel(args: list[str], *, cwd: Path | None = None) -> str:
    if not SEL_CLI.exists():
        raise SELCommandError(f"SEL CLI introuvable: {SEL_CLI}")
    result = subprocess.run(
        [str(SEL_CLI), *args],
        cwd=str(cwd or PROJECT_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise SELCommandError(result.stderr.strip() or result.stdout.strip() or f"SEL exited {result.returncode}")
    return result.stdout


def export_scribe(*, include_values: bool = True) -> dict[str, Any]:
    args = ["export", "--format", "json"]
    if include_values:
        args.append("--include-values")
    output = sel(args)
    return json.loads(output)


def doctor() -> str:
    return sel(["doctor", "--suggest-fix"])


def source_snapshot(scribe_path: Path = DEFAULT_SCRIBE) -> dict[str, Any]:
    raw = scribe_path.read_bytes()
    import hashlib
    stat = scribe_path.stat()
    return {
        "path": str(scribe_path),
        "sha256": "sha256:" + hashlib.sha256(raw).hexdigest(),
        "mtime_ns": stat.st_mtime_ns,
        "line_count": len(raw.decode("utf-8").splitlines()),
    }
