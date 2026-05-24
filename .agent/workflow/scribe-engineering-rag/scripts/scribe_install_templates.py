from __future__ import annotations


AGENTS_START = "<!-- SCRIBE-ENGINEERING-RAG:START -->"
AGENTS_END = "<!-- SCRIBE-ENGINEERING-RAG:END -->"
GRAPHIFY_START = "# SCRIBE-ENGINEERING-RAG:START"
GRAPHIFY_END = "# SCRIBE-ENGINEERING-RAG:END"


def render_scribe_adapter() -> str:
    return """#!/usr/bin/env python3
from __future__ import annotations

import runpy
import sys
from pathlib import Path


sys.dont_write_bytecode = True


def main() -> int:
    root = Path(__file__).resolve().parent
    scripts_dir = root / ".agent" / "workflow" / "scribe-engineering-rag" / "scripts"
    if len(sys.argv) < 2 or sys.argv[1] in {"-h", "--help"}:
        print("Usage:")
        print("  ./scribe doctor [SCRIBE_PATH] [--output REPORT] [--suggest-fix]")
        print("  ./scribe guard [SCRIBE_PATH] -- <command> [args...]")
        print("  ./scribe install [TARGET_PATH] [--force] [--dry-run]")
        print("  ./scribe hot|stats|explain|related|query|challenge|compact|promote|export|archive|dashboard")
        print("  ./scribe graph [--build] [--query TEXT] [--budget N]")
        print("  ./scribe worktree [--strict]")
        return 0

    command = sys.argv.pop(1)
    scripts = {
        "doctor": "scribe_doctor.py",
        "guard": "scribe_guard.py",
        "install": "scribe_install.py",
        "graph": "scribe_bundle_graph.py",
        "worktree": "scribe_worktree.py",
    }
    for memory_command in {"hot", "stats", "explain", "related", "query", "challenge", "compact", "promote", "export", "archive", "dashboard"}:
        scripts[memory_command] = "scribe_memory.py"
    script = scripts.get(command)
    if script is None:
        print(f"Unknown scribe command: {command}", file=sys.stderr)
        print("Available commands: doctor, guard, install, hot, stats, explain, related, query, challenge, compact, promote, export, archive, dashboard, graph, worktree", file=sys.stderr)
        return 2

    if command in {"hot", "stats", "explain", "related", "query", "challenge", "compact", "promote", "export", "archive", "dashboard"}:
        sys.argv.insert(1, command)
    sys.path.insert(0, str(scripts_dir))
    runpy.run_path(str(scripts_dir / script), run_name="__main__")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
"""


def render_shim_helper() -> str:
    return '''from __future__ import annotations

import importlib.util
import runpy
import sys
from pathlib import Path
from types import ModuleType
from typing import Any


sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_SCRIPTS_DIR = ROOT / ".agent" / "workflow" / "scribe-engineering-rag" / "scripts"


def ensure_canonical_path() -> None:
    scripts_path = str(CANONICAL_SCRIPTS_DIR)
    if scripts_path not in sys.path:
        sys.path.insert(0, scripts_path)


def load_canonical_module(module_name: str) -> ModuleType:
    ensure_canonical_path()
    module_path = CANONICAL_SCRIPTS_DIR / f"{module_name}.py"
    if not module_path.exists():
        raise ModuleNotFoundError(f"Cannot find SCRIBE bundle module: {module_path}")

    private_name = f"_scribe_bundle_{module_name}"
    cached = sys.modules.get(private_name)
    if cached is not None:
        return cached

    spec = importlib.util.spec_from_file_location(private_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load SCRIBE bundle module: {module_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[private_name] = module
    spec.loader.exec_module(module)
    return module


def export_canonical(namespace: dict[str, Any], module_name: str) -> None:
    module = load_canonical_module(module_name)
    public_names = [name for name in vars(module) if not name.startswith("_")]
    namespace["__doc__"] = module.__doc__
    namespace["__all__"] = public_names
    for name in public_names:
        namespace[name] = getattr(module, name)


def run_canonical_script(module_name: str) -> None:
    ensure_canonical_path()
    runpy.run_path(str(CANONICAL_SCRIPTS_DIR / f"{module_name}.py"), run_name="__main__")
'''


def render_module_shim(module_name: str, cli_modules: set[str]) -> str:
    if module_name in cli_modules:
        return f'''#!/usr/bin/env python3
from __future__ import annotations

from _bundle_shim import export_canonical, run_canonical_script


export_canonical(globals(), "{module_name}")


if __name__ == "__main__":
    run_canonical_script("{module_name}")
'''
    return f'''from __future__ import annotations

from _bundle_shim import export_canonical


export_canonical(globals(), "{module_name}")
'''


def render_scripts_init() -> str:
    return '"""Compatibility shims for the canonical SCRIBE engineering bundle."""\n'


def render_agents_block() -> str:
    return f"""{AGENTS_START}
## SCRIBE/TENOR Engineering Bundle

The reusable SCRIBE/TENOR engineering bundle lives in:

- `.agent/workflow/scribe-engineering-rag/`

Read `.agent/workflow/scribe-engineering-rag/docs/AGENTS.md` for local rules.

Critical local rules:
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `./scribe graph --build` and `./scribe graph --query "..."` for a separate bundle graph.
- Choose the smallest safe tier from `docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Use `./scribe doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- `./scribe query` searches only causal SCRIBE memory by default; Graphify remains responsible for structural code facts.
- `./scribe worktree` separates generated noise from source changes before delivery.
{AGENTS_END}
"""


def render_graphify_block() -> str:
    return f"""{GRAPHIFY_START}
# Keep the canonical root graph focused on application code.
# SCRIBE/TENOR tooling is causal/process infrastructure, not app architecture.
.agent/
.codex/
.vscode/
scripts/
scribe
scribe-out/
AGENT-MEMOIRE_PROJECT_STATUS.scribe
AGENTS.md
{GRAPHIFY_END}
"""
