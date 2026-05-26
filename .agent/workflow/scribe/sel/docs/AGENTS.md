## graphify

When the host project has a graphify knowledge graph, it lives at `graphify-out/`.

Scope:
- `graphify-out/` is the canonical application graph for the host project.
- `scribe-out/bundle-graph/` is the generated graph for this SCRIBE bundle itself. It is for maintaining the tooling, not for understanding the host application.
- Do not confuse the two graphs: app work reads `graphify-out/`; SCRIBE tooling work uses `<SCRIBE> graph --build` and `<SCRIBE> graph --query "..."`.
- SCRIBE/TENOR tooling is excluded by `.graphifyignore` so app god-nodes stay clean.
- For app work, phrase queries with an app scope, e.g. `graphify query "APP_SCOPE <project-name> auth websocket"`.
- Canonical SEL engine CLI from a host project root is `.agent/workflow/scribe/scribe`; examples below use `<SCRIBE>` for maintenance-only commands. Agent retrieval must go through `.agent/workflow/scribe/scribe-rag`.
- Host-agent always-on summary lives at `.agent/rules/scribe.md`; the full canonical protocol remains `docs/scribe.md`.
- Do not assume root `./scribe` or root `scripts/` exist. They are optional legacy adapters generated only with `<SCRIBE> install --with-root-adapters`.
- For installation, migration, or several agents working on the same repo, read `docs/multi-agent-installation.md` before editing.
- For SCRIBE tooling work, use `<SCRIBE> graph --build` and `<SCRIBE> graph --query "..."` for a separate bundle graph under `scribe-out/bundle-graph/`; do not pollute the app graph or store generated graph output inside the bundle.

## Versioning boundaries

Default commit/push scope is the host product source. For this bundle's host
projects:

- `AGENT-MEMOIRE_PROJECT_STATUS.scribe`: version only when the team wants shared causal memory between agents and humans.
- `graphify-out/`: do not version by default; it is generated structural graph output and can be rebuilt with `graphify update .`.
- `scribe-out/`: do not version by default; it is local runtime state such as indexes, locks, doctor reports, dashboards, exports, and sync metadata.
- `.agent/`: version only when deliberately maintaining or distributing agent tooling; keep it out of ordinary product commits.

Rationale: generated memory and runtime directories create noisy diffs, may
contain stale local state, vary by machine/agent/session, and are
reconstructible from the product source plus the SCRIBE commands. Run
`<SCRIBE> worktree` before delivery to separate source changes from generated
noise.

## PRÉFLIGHT STANDARD V4

Command convention from a host project root:

```bash
SCRIBE=.agent/workflow/scribe/scribe
SCRIBE_RAG=.agent/workflow/scribe/scribe-rag
```

### Étape 0 — Bootstrap

```bash
$SCRIBE bootstrap
```

### Étape 1 — Contexte mémoire

```bash
$SCRIBE_RAG build
$SCRIBE_RAG context
```

### Étape 2 — Structure code

```bash
graphify update .   # only when app code changed since the last graph refresh
sed -n '1,100p' graphify-out/GRAPH_REPORT.md
```

Graphify has no `--surface` mode. Surfaces are a SCRIBE/protocol concept, not a Graphify concept.

### Avant toute implémentation significative

```bash
$SCRIBE_RAG challenge "<description précise du plan>"
```

Verdicts:
- `STOP`: do not implement; read the BLOCK and revise the plan.
- `REVIEW`: read WARNs, then decide explicitly.
- `PROCEED`: implement.

### Signal Hybrid

If `$SCRIBE_RAG eval --force` returns less than `7/8`:

```bash
pip install sentence-transformers --break-system-packages
$SCRIBE_RAG build --with-embeddings --force
```

After that build, the hybrid index is used automatically. BM25 remains canonical while eval stays `>= 7/8`.

## POSTFLIGHT STANDARD V4

Ask before closing a real coding session:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

If the answer is concrete future pain, write a SCAR or GHOST. If not, a JOURNAL entry is enough.

```bash
$SCRIBE_RAG doctor
$SCRIBE sync --agent <nom> --type <extension|cli|api|unknown>
$SCRIBE lock release --agent <nom>
git diff --check
```

Never use these for normal agent retrieval:
- `$SCRIBE context` (SEL direct)
- `$SCRIBE query` (SEL direct)
- `$SCRIBE explain` (SEL direct)
- SEL direct challenge
- Archiving SEL while scribe-rag depends on it

## Multi-Agent V4

- One exclusive surface per agent maximum.
- Agents read memory through scribe-rag; they do not read the `.scribe` file directly.
- SEL lock is mandatory before SCRIBE writes.
- `scribe sync` is mandatory before work and after memory repair.
- `scribe worktree --strict` is mandatory before delivery in coordinated multi-agent work.
- The orchestrator owns surface attribution and Git conflict resolution.


Rules:
- At the start of a copied `.agent` installation, run `<SCRIBE> bootstrap`; it is idempotent and initializes only missing Graphify/SCRIBE/scribe-out surfaces.
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying app code files in this session, run `graphify update .` to keep the app graph current; after modifying this bundle, run `<SCRIBE> graph --build`.
- Use `<SCRIBE> clean --dry-run` before delivery when `scribe-out/` looks noisy; use `<SCRIBE> clean --apply --graphify --agent-cache` only for generated reports, screenshots, exports, reconstructible AST cache overflow, and `.agent` bytecode caches.

## Final host-LLM intention

Before closing a real coding session, ask:

> "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?"

If the answer is concrete pain, write a SCAR or GHOST. If there is no future pain, a JOURNAL entry is enough. This is the anti-drift rule that keeps SCRIBE causal instead of becoming a polished activity log.

## Graphify hook compatibility

Resolved failure modes:
- 2026-05-23: `PreToolUse hook returned unsupported additionalContext` came from the Graphify hook template, not from SCRIBE or the application.
- 2026-05-24: `failed to write hook stdin: Broken pipe (os error 32)` came from a silent hook command that exited before reading the Codex JSON payload.

What happened:
- The generated `.codex/hooks.json` hook emitted `hookSpecificOutput.additionalContext`.
- The current runtime rejects `additionalContext` in `PreToolUse` hook output.
- Codex writes the PreToolUse payload to hook stdin; a command that exits immediately can trigger a broken pipe even when it returns success.
- The active project hook consumes stdin, stays silent, and keeps a `graphify hook` marker so reinstall/uninstall can identify it.
- Patch every active Graphify installation if a reinstall can recreate the bad hook.
- Also sanitize global Gemini/Antigravity trusted hook registries if they contain old Graphify commands with `additionalContext`; valid Gemini commands should return only JSON allow decisions.
- Local template patches are not enough if upstream Graphify is reinstalled later. Treat any `pipx reinstall graphifyy`, `pip install -U graphifyy`, or package-manager upgrade as a recurrence risk until the installed Graphify templates are rechecked and the stdin-consuming contract is proven again.

Rules:
- Never reintroduce `additionalContext` or `hookSpecificOutput` in project PreToolUse hooks.
- Never use a Codex PreToolUse command that exits without consuming stdin.
- If Graphify is upgraded or reinstalled, rerun `graphify codex install` and verify active hook files plus active Graphify installations for unsupported fields and legacy stdin-broken commands.
- After any Graphify reinstall or upgrade, run `<SCRIBE> graphify-hooks --apply`, then simulate both Codex and Gemini hook commands with representative JSON stdin before continuing project work; if either command exits before consuming stdin, patch the installed template and prefer upstreaming the fix.
- Ready-to-submit Graphify upstream diff: `patches/graphify-upstream-hook-stdin.patch`; legacy installed-template fallback: `patches/graphify-gemini-hook-stdin.patch`.
- A valid Codex hook command for this project is `python3 -c "import sys; sys.stdin.read()" # graphify hook`.
- A valid Gemini trusted hook command consumes stdin before returning the allow decision: `python3 -c 'import sys, json; sys.stdin.read(); print(json.dumps({"decision":"allow"}))' # graphify hook`.
- A local hook simulation must exit 0 with empty stdout/stderr when fed a representative JSON payload.

## SCRIBE doctor guard

Use `docs/friction-policy.md` to choose the smallest safe workflow tier automatically. READ_ONLY must skip doctor and SCRIBE writes; QUICK must run only focused retrieval/validation unless risk escalates. Do not run full SCRIBE ceremony for read-only answers or trivial low-risk fixes.

Every future evolution of `AGENT-MEMOIRE_PROJECT_STATUS.scribe` is guarded:

- Run `<SCRIBE> doctor --suggest-fix` before editing the SCRIBE.
- Run `<SCRIBE> sync --agent <name> --type <extension|cli|api|unknown>` before work; if it reports stale state, relire the latest SCRIBE delta before editing.
- Run `<SCRIBE> lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>` before any SCRIBE mutation, then `<SCRIBE> lock release --agent <name>` after validation; doctor and read-only commands are never blocked by the lock.
- Doctor Markdown reports are generated under `scribe-out/` by default; do not write doctor `.md` reports at repository root.
- If the pre-doctor reports any ERROR, stop and repair the existing memory before adding a new delta.
- Edit the SCRIBE incrementally only; never overwrite the file.
- Run `<SCRIBE> doctor --suggest-fix` immediately after editing.
- If the post-doctor reports any ERROR, fix the delta immediately or remove the faulty delta.
- For command-based mutations, prefer `<SCRIBE> guard -- <command>` so doctor wraps the command before and after.
