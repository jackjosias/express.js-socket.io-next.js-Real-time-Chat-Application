from __future__ import annotations


AGENTS_START = "<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START -->"
AGENTS_END = "<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END -->"
GRAPHIFY_START = "# SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START"
GRAPHIFY_END = "# SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END"
LEGACY_AGENTS_START = "<!-- SCRIBE-ENGINEERING-RAG:START -->"
LEGACY_AGENTS_END = "<!-- SCRIBE-ENGINEERING-RAG:END -->"
LEGACY_GRAPHIFY_START = "# SCRIBE-ENGINEERING-RAG:START"
LEGACY_GRAPHIFY_END = "# SCRIBE-ENGINEERING-RAG:END"
BUNDLE_RELATIVE_PATH = ".agent/workflow/scribe-engineering-local-causal-retrieval"
BUNDLE_COMMAND = f"{BUNDLE_RELATIVE_PATH}/scribe"
SCRIBE_RULE_PATH = ".agent/rules/scribe.md"


def render_scribe_rule() -> str:
    return f"""---
trigger: always_on
---

# SCRIBE — REGLE ALWAYS-ON

Ce fichier est une regle courte pour les LLM hotes. Il ne remplace pas le
protocole complet.

## Source canonique

- CLI canonique: `{BUNDLE_COMMAND}`
- Protocole canonique: `{BUNDLE_RELATIVE_PATH}/docs/scribe.md`
- Regles locales: `{BUNDLE_RELATIVE_PATH}/docs/AGENTS.md`
- Installation multi-agent: `{BUNDLE_RELATIVE_PATH}/docs/multi-agent-installation.md`

Ne jamais utiliser `.agent/workflows/scribe.md` ni
`docs/archive/scribe.v3.1.md.old` comme source active. Ce sont des chemins
historiques ou archives.

## Reflexe de demarrage

Depuis la racine du projet:

```bash
{BUNDLE_COMMAND} bootstrap
{BUNDLE_COMMAND} sync --agent <name> --type <extension|cli|api|unknown>
{BUNDLE_COMMAND} context --mode quick
```

`bootstrap` est idempotent. Il initialise seulement ce qui manque:
`AGENT-MEMOIRE_PROJECT_STATUS.scribe`, `scribe-out/`, `state.json`,
`.graphifyignore` et le bloc gere de `AGENTS.md`.

## Reflexe avant mutation SCRIBE

Avant toute commande qui modifie la memoire:

```bash
{BUNDLE_COMMAND} doctor --suggest-fix
{BUNDLE_COMMAND} lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
```

Apres validation:

```bash
{BUNDLE_COMMAND} doctor --suggest-fix
{BUNDLE_COMMAND} sync --repair --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>
{BUNDLE_COMMAND} lock release --agent <name>
```

Les commandes read-only (`context`, `query`, `explain`, `related`, `stats`,
`doctor`) ne doivent pas etre bloquees par le lock.

## Separation Graphify / SCRIBE

- Graphify = structure du code: quoi, ou, comment.
- SCRIBE = causalite: pourquoi, douleur, decision, cicatrice.

Ne pas ecrire dans SCRIBE ce que Graphify peut deduire du code. Ecrire un
SCAR ou un GHOST seulement si l'information evitera une vraie souffrance au
prochain agent.

## Intention finale obligatoire

Avant de fermer une vraie session de coding, poser cette question:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

Si la reponse est une douleur concrete, la graver en SCAR ou GHOST. Sinon, le
JOURNAL suffit.
"""


def render_scribe_adapter() -> str:
    return '#!/usr/bin/env python3\nfrom __future__ import annotations\n\nimport runpy\nimport sys\nfrom pathlib import Path\n\n\nsys.dont_write_bytecode = True\n\n\nMEMORY_COMMANDS = {\n    "hot",\n    "context",\n    "stats",\n    "explain",\n    "related",\n    "query",\n    "challenge",\n    "eval",\n    "compact",\n    "review-hot",\n    "promote",\n    "export",\n    "archive",\n    "dashboard",\n}\n\n\ndef main() -> int:\n    root = Path(__file__).resolve().parent\n    scripts_dir = root / ".agent" / "workflow" / "scribe-engineering-local-causal-retrieval" / "scripts"\n    if len(sys.argv) < 2 or sys.argv[1] in {"-h", "--help"}:\n        print("Usage:")\n        print("  ./scribe doctor [SCRIBE_PATH] [--output REPORT] [--suggest-fix]")\n        print("  ./scribe guard [SCRIBE_PATH] -- <command> [args...]")\n        print("  ./scribe install [TARGET_PATH] [--force] [--dry-run]")\n        print("  ./scribe bootstrap [--root PATH]")\n        print("  ./scribe clean --dry-run|--apply [--graphify] [--agent-cache]")\n        print("  ./scribe lock acquire|release|status")\n        print("  ./scribe sync|whoami")\n        print("  ./scribe hot|context|stats|explain|related|query|challenge|eval|compact|review-hot|promote|export|archive|dashboard")\n        print("  ./scribe graph [--build] [--query TEXT] [--budget N]")\n        print("  ./scribe graphify-hooks [--apply] [--template PATH] [--trusted-hooks PATH]")\n        print("  ./scribe benchmark [--entities 1000,10000] [--queries N] [--json]")\n        print("  ./scribe worktree [--strict]")\n        return 0\n\n    command = sys.argv.pop(1)\n    scripts = {\n        "doctor": "scribe_doctor.py",\n        "guard": "scribe_guard.py",\n        "install": "scribe_install.py",\n        "bootstrap": "scribe_bootstrap.py",\n        "clean": "scribe_clean.py",\n        "lock": "scribe_lock.py",\n        "sync": "scribe_state.py",\n        "whoami": "scribe_state.py",\n        "graph": "scribe_bundle_graph.py",\n        "worktree": "scribe_worktree.py",\n        "benchmark": "scribe_benchmark.py",\n        "graphify-hooks": "scribe_graphify_hooks.py",\n    }\n    for memory_command in MEMORY_COMMANDS:\n        scripts[memory_command] = "scribe_memory.py"\n    script = scripts.get(command)\n    if script is None:\n        print(f"Unknown scribe command: {command}", file=sys.stderr)\n        print("Available commands: doctor, guard, install, bootstrap, clean, hot, context, stats, explain, related, query, challenge, eval, compact, review-hot, promote, export, archive, dashboard, lock, sync, whoami, graph, graphify-hooks, benchmark, worktree", file=sys.stderr)\n        return 2\n\n    if command in MEMORY_COMMANDS:\n        sys.argv.insert(1, command)\n    if command in {"sync", "whoami"}:\n        sys.argv.insert(1, command)\n    sys.path.insert(0, str(scripts_dir))\n    runpy.run_path(str(scripts_dir / script), run_name="__main__")\n    return 0\n\n\nif __name__ == "__main__":\n    raise SystemExit(main())\n'


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
CANONICAL_SCRIPTS_DIR = ROOT / ".agent" / "workflow" / "scribe-engineering-local-causal-retrieval" / "scripts"


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
## SCRIBE/TENOR Local Causal Retrieval Bundle

The reusable SCRIBE/TENOR local causal retrieval bundle lives in:

- `{BUNDLE_RELATIVE_PATH}/`

Read `{BUNDLE_RELATIVE_PATH}/docs/AGENTS.md` for local rules.
Read `{SCRIBE_RULE_PATH}` as the host-agent always-on summary; the full protocol remains in `{BUNDLE_RELATIVE_PATH}/docs/scribe.md`.

Critical local rules:
- Canonical SCRIBE CLI from the project root: `{BUNDLE_COMMAND}`. Use this bundle-local command path in automation.
- First command after copying `.agent` into a project: `{BUNDLE_COMMAND} bootstrap`. It is idempotent and initializes only missing project-local surfaces.
- Do not assume root `./scribe` or root `scripts/` exist; they are opt-in legacy adapters generated only with `{BUNDLE_COMMAND} install --with-root-adapters`.
- For installation, migration, or several agents working on the same repo, read `{BUNDLE_RELATIVE_PATH}/docs/multi-agent-installation.md` before editing.
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `{BUNDLE_COMMAND} graph --build` and `{BUNDLE_COMMAND} graph --query "..."` for a separate bundle graph under `scribe-out/bundle-graph/`.
- Choose the smallest safe tier from `docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Prefer `{BUNDLE_COMMAND} context --mode quick|standard` for compact grounding instead of chaining multiple SCRIBE commands.
- Use `{BUNDLE_COMMAND} eval` to measure local causal retrieval quality before changing scoring, ranking, or tier policy.
- Run `{BUNDLE_COMMAND} sync --agent <name> --type <extension|cli|api|unknown>` before work; if it reports stale state, relire/re-sync before editing.
- Run `{BUNDLE_COMMAND} clean --dry-run` before delivery when `scribe-out/` has accumulated generated reports, exports, screenshots, or cache noise.
- Use `{BUNDLE_COMMAND} doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- Before mutating SCRIBE state, acquire `{BUNDLE_COMMAND} lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>` and release it after validation; doctor and read-only commands stay unblocked.
- `{BUNDLE_COMMAND} query` searches only causal SCRIBE memory by default; Graphify remains responsible for structural code facts.
- `{BUNDLE_COMMAND} graphify-hooks --apply` reapplies and verifies the stdin-consuming Graphify hook patch after any Graphify reinstall or upgrade.
- Graphify upstream PR diff is preserved in `{BUNDLE_RELATIVE_PATH}/patches/graphify-upstream-hook-stdin.patch` when direct PR tooling is unavailable.
- `{BUNDLE_COMMAND} worktree` separates generated noise from source changes before delivery.
{AGENTS_END}
"""


def render_graphify_block() -> str:
    return f"""{GRAPHIFY_START}
# Keep the canonical root graph focused on application code.
# SCRIBE/TENOR tooling is causal/process infrastructure, not app architecture.
.agent/
.codex/
.vscode/
scribe-out/
AGENT-MEMOIRE_PROJECT_STATUS.scribe
AGENTS.md
{GRAPHIFY_END}
"""
