from __future__ import annotations


AGENTS_START = "<!-- SCRIBE-PORTABLE-WORKFLOW:START -->"
AGENTS_END = "<!-- SCRIBE-PORTABLE-WORKFLOW:END -->"
GRAPHIFY_START = "# SCRIBE-PORTABLE-WORKFLOW:START"
GRAPHIFY_END = "# SCRIBE-PORTABLE-WORKFLOW:END"
LEGACY_LOCAL_AGENTS_START = "<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START -->"
LEGACY_LOCAL_AGENTS_END = "<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END -->"
LEGACY_RAG_AGENTS_START = "<!-- SCRIBE-ENGINEERING-RAG:START -->"
LEGACY_RAG_AGENTS_END = "<!-- SCRIBE-ENGINEERING-RAG:END -->"
LEGACY_LOCAL_GRAPHIFY_START = "# SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START"
LEGACY_LOCAL_GRAPHIFY_END = "# SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END"
LEGACY_RAG_GRAPHIFY_START = "# SCRIBE-ENGINEERING-RAG:START"
LEGACY_RAG_GRAPHIFY_END = "# SCRIBE-ENGINEERING-RAG:END"
LEGACY_AGENTS_START = LEGACY_RAG_AGENTS_START
LEGACY_AGENTS_END = LEGACY_RAG_AGENTS_END
LEGACY_GRAPHIFY_START = LEGACY_RAG_GRAPHIFY_START
LEGACY_GRAPHIFY_END = LEGACY_RAG_GRAPHIFY_END
LEGACY_AGENTS_MARKERS = (
    (LEGACY_LOCAL_AGENTS_START, LEGACY_LOCAL_AGENTS_END),
    (LEGACY_RAG_AGENTS_START, LEGACY_RAG_AGENTS_END),
)
LEGACY_GRAPHIFY_MARKERS = (
    (LEGACY_LOCAL_GRAPHIFY_START, LEGACY_LOCAL_GRAPHIFY_END),
    (LEGACY_RAG_GRAPHIFY_START, LEGACY_RAG_GRAPHIFY_END),
)
PORTABLE_RELATIVE_PATH = ".agent/workflow/scribe"
SEL_RELATIVE_PATH = f"{PORTABLE_RELATIVE_PATH}/sel"
RAG_RELATIVE_PATH = f"{PORTABLE_RELATIVE_PATH}/rag"
BUNDLE_RELATIVE_PATH = PORTABLE_RELATIVE_PATH
BUNDLE_COMMAND = f"{PORTABLE_RELATIVE_PATH}/scribe"
RAG_COMMAND = f"{PORTABLE_RELATIVE_PATH}/scribe-rag"
SCRIBE_RULE_PATH = ".agent/rules/scribe.md"


def render_scribe_rule() -> str:
    return f"""---
trigger: always_on
---

# SCRIBE — REGLE ALWAYS-ON

Ce fichier est une regle courte pour les LLM hotes. Il ne remplace pas le
protocole complet.

## Source canonique

- Racine portable unique: `{BUNDLE_RELATIVE_PATH}/`
- CLI maintenance interne: `{BUNDLE_COMMAND}`
- CLI lecture agent: `{RAG_COMMAND}`
- Protocole complet: `{SEL_RELATIVE_PATH}/docs/scribe.md`
- Regles locales: `{SEL_RELATIVE_PATH}/docs/AGENTS.md`
- Installation multi-agent: `{SEL_RELATIVE_PATH}/docs/multi-agent-installation.md`

Tout chemin SCRIBE hors de `{BUNDLE_RELATIVE_PATH}/` est non canonique. Ne pas
creer de dossier de compatibilite visible; corriger les anciens appels vers les
commandes ci-dessus.

## Reflexe de demarrage

Depuis la racine du projet:

```bash
{BUNDLE_COMMAND} bootstrap
{BUNDLE_COMMAND} sync --agent <name> --type <extension|cli|api|unknown>
{RAG_COMMAND} build
{RAG_COMMAND} context
```

`bootstrap` est idempotent. Il initialise seulement ce qui manque:
`AGENT-MEMOIRE_PROJECT_STATUS.scribe`, `scribe-out/`, `state.json`,
`.graphifyignore` et le bloc gere de `AGENTS.md`. Il ne lance aucun daemon.

## Dashboard SCRIBE

```bash
{BUNDLE_COMMAND} dashboard
{BUNDLE_COMMAND} dashboard --serve --host 127.0.0.1 --port 8765
```

`dashboard` genere un HTML statique dans `scribe-out/`. `dashboard --serve`
lance a la demande un serveur HTTP local leger (`ThreadingHTTPServer`) pour vue
live/reload; ce processus s'arrete avec Ctrl+C et n'est jamais demarre par
`bootstrap`.

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

Les commandes SEL read-only de maintenance (`explain`, `related`, `stats`, `doctor`)
ne doivent pas etre bloquees par le lock. Pour le retrieval agent, ne pas appeler
`scribe context` ni `scribe query` directement; utiliser `scribe-rag`.

## Separation Graphify / SCRIBE

- Graphify = structure du code: quoi, ou, comment.
- SCRIBE = causalite: pourquoi, douleur, decision, cicatrice.

Ne pas ecrire dans SCRIBE ce que Graphify peut deduire du code. Ecrire un
SCAR ou un GHOST seulement si l'information evitera une vraie souffrance au
prochain agent.

## Hygiene Git / push

- Scope par defaut: le code produit du projet hote.
- `AGENT-MEMOIRE_PROJECT_STATUS.scribe`: a versionner seulement si l'equipe
  veut partager la memoire causale entre agents et humains.
- `graphify-out/`: ne pas versionner par defaut; c'est un graphe genere,
  reconstructible avec `graphify update .`.
- `scribe-out/`: ne pas versionner par defaut; c'est de l'etat runtime local
  (index, locks, rapports, dashboards, exports, sync metadata).
- `.agent/`: a versionner seulement quand l'equipe maintient volontairement
  l'outillage agentique; sinon le garder hors des commits produit.

Avant livraison, utiliser `{BUNDLE_COMMAND} worktree` pour separer source
reelle, memoire causale validee, tooling volontaire et bruit genere.

## Intention finale obligatoire

Avant de fermer une vraie session de coding, poser cette question:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

Si la reponse est une douleur concrete, la graver en SCAR ou GHOST. Sinon, le
JOURNAL suffit.
"""


def render_scribe_adapter() -> str:
    return '#!/usr/bin/env python3\nfrom __future__ import annotations\n\nimport runpy\nimport sys\nfrom pathlib import Path\n\n\nsys.dont_write_bytecode = True\n\n\nMEMORY_COMMANDS = {\n    "hot",\n    "context",\n    "stats",\n    "explain",\n    "related",\n    "query",\n    "challenge",\n    "eval",\n    "compact",\n    "review-hot",\n    "promote",\n    "export",\n    "archive",\n    "dashboard",\n}\n\n\ndef main() -> int:\n    root = Path(__file__).resolve().parent\n    scripts_dir = root / ".agent" / "workflow" / "scribe" / "sel" / "scripts"\n    if len(sys.argv) < 2 or sys.argv[1] in {"-h", "--help"}:\n        print("Usage:")\n        print("  ./scribe doctor [SCRIBE_PATH] [--output REPORT] [--suggest-fix]")\n        print("  ./scribe guard [SCRIBE_PATH] -- <command> [args...]")\n        print("  ./scribe install [TARGET_PATH] [--force] [--dry-run]")\n        print("  ./scribe bootstrap [--root PATH]")\n        print("  ./scribe clean --dry-run|--apply [--graphify] [--agent-cache]")\n        print("  ./scribe lock acquire|release|status")\n        print("  ./scribe sync|whoami")\n        print("  ./scribe hot|context|stats|explain|related|query|challenge|eval|compact|review-hot|promote|export|archive|dashboard")\n        print("  ./scribe graph [--build] [--query TEXT] [--budget N]")\n        print("  ./scribe graphify-hooks [--apply] [--template PATH] [--trusted-hooks PATH]")\n        print("  ./scribe benchmark [--entities 1000,10000] [--queries N] [--json]")\n        print("  ./scribe worktree [--strict]")\n        return 0\n\n    command = sys.argv.pop(1)\n    scripts = {\n        "doctor": "scribe_doctor.py",\n        "guard": "scribe_guard.py",\n        "install": "scribe_install.py",\n        "bootstrap": "scribe_bootstrap.py",\n        "clean": "scribe_clean.py",\n        "lock": "scribe_lock.py",\n        "sync": "scribe_state.py",\n        "whoami": "scribe_state.py",\n        "graph": "scribe_bundle_graph.py",\n        "worktree": "scribe_worktree.py",\n        "benchmark": "scribe_benchmark.py",\n        "graphify-hooks": "scribe_graphify_hooks.py",\n    }\n    for memory_command in MEMORY_COMMANDS:\n        scripts[memory_command] = "scribe_memory.py"\n    script = scripts.get(command)\n    if script is None:\n        print(f"Unknown scribe command: {command}", file=sys.stderr)\n        print("Available commands: doctor, guard, install, bootstrap, clean, hot, context, stats, explain, related, query, challenge, eval, compact, review-hot, promote, export, archive, dashboard, lock, sync, whoami, graph, graphify-hooks, benchmark, worktree", file=sys.stderr)\n        return 2\n\n    if command in MEMORY_COMMANDS:\n        sys.argv.insert(1, command)\n    if command in {"sync", "whoami"}:\n        sys.argv.insert(1, command)\n    sys.path.insert(0, str(scripts_dir))\n    runpy.run_path(str(scripts_dir / script), run_name="__main__")\n    return 0\n\n\nif __name__ == "__main__":\n    raise SystemExit(main())\n'


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
CANONICAL_SCRIPTS_DIR = ROOT / ".agent" / "workflow" / "scribe" / "sel" / "scripts"


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

Read `{SEL_RELATIVE_PATH}/docs/AGENTS.md` for local rules.
Read `{SCRIBE_RULE_PATH}` as the host-agent always-on summary; the full protocol remains in `{SEL_RELATIVE_PATH}/docs/scribe.md`.

Critical local rules:
- SEL internal engine from the project root: `{BUNDLE_COMMAND}`. Do not call SEL directly for agent retrieval; use it only for bootstrap, doctor, lock, sync/state, export, archive, graph maintenance, and SCRIBE writes.
- Agent retrieval interface: `{RAG_COMMAND}` only. Use scribe-rag for `build`, `context`, `query`, `explain`, and `challenge`; it calls SEL internally through the portable SEL command.
- First command after copying `{BUNDLE_RELATIVE_PATH}/` into a project: `{BUNDLE_COMMAND} bootstrap`. It is idempotent, initializes only missing project-local surfaces, and never starts a daemon.
- Any SCRIBE path outside `{BUNDLE_RELATIVE_PATH}/` is non-canonical; old callers must migrate to the root commands above instead of recreating compatibility folders.
- Do not assume root `./scribe` or root `scripts/` exist; they are opt-in legacy adapters generated only with `{BUNDLE_COMMAND} install --with-root-adapters`.
- Dashboard is available as `{BUNDLE_COMMAND} dashboard` for static HTML and `{BUNDLE_COMMAND} dashboard --serve --host 127.0.0.1 --port 8765` for an opt-in local live server.
- For installation, migration, or several agents working on the same repo, read `{SEL_RELATIVE_PATH}/docs/multi-agent-installation.md` before editing.
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `{BUNDLE_COMMAND} graph --build` and `{BUNDLE_COMMAND} graph --query "..."` for a separate bundle graph under `scribe-out/bundle-graph/scribe/`.
- Default commit/push scope is the host product source. Version `AGENT-MEMOIRE_PROJECT_STATUS.scribe` only when shared causal memory is desired; keep `graphify-out/` and `scribe-out/` out of commits by default; version `.agent/` only when intentionally maintaining agent tooling.
- Choose the smallest safe tier from `{SEL_RELATIVE_PATH}/docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Final standard preflight: `{RAG_COMMAND} build` if the index is stale, `{RAG_COMMAND} context`, `graphify update .` when app code changed, then `sed -n "1,100p" graphify-out/GRAPH_REPORT.md`. Before significant implementation, run `{RAG_COMMAND} challenge "<plan>"`; STOP means do not implement, REVIEW means read warnings then decide, and PROCEED means continue.
- Never use SEL direct retrieval commands in AGENTS.md or agent preflight: no `{BUNDLE_COMMAND} context`, no `{BUNDLE_COMMAND} query`, and no SEL direct challenge for normal agent work.
- Hybrid activation signal: if `{RAG_COMMAND} eval --force` drops below 7/8, install `sentence-transformers` and run `{RAG_COMMAND} build --with-embeddings --force`; after that build, scribe-rag reads the hybrid index automatically. BM25 remains canonical while eval stays >= 7/8.
- Run `{BUNDLE_COMMAND} sync --agent <name> --type <extension|cli|api|unknown>` before work; if it reports stale state, relire/re-sync before editing.
- Run `{BUNDLE_COMMAND} clean --dry-run` before delivery when `scribe-out/` has accumulated generated reports, exports, screenshots, or cache noise.
- Use `{BUNDLE_COMMAND} doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- Before mutating SCRIBE state, acquire `{BUNDLE_COMMAND} lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>` and release it after validation; doctor and read-only commands stay unblocked.
- `{RAG_COMMAND} query` searches causal SCRIBE memory through the BM25 canonical interface; Graphify remains responsible for structural code facts.
- `{BUNDLE_COMMAND} graphify-hooks --apply` reapplies and verifies the stdin-consuming Graphify hook patch after any Graphify reinstall or upgrade.
- Graphify upstream PR diff is preserved in `{SEL_RELATIVE_PATH}/patches/graphify-upstream-hook-stdin.patch` when direct PR tooling is unavailable.
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
