## graphify

When the host project has a graphify knowledge graph, it lives at `graphify-out/`.

Scope:
- `graphify-out/` is the canonical application graph for the host project.
- SCRIBE/TENOR tooling is excluded by `.graphifyignore` so app god-nodes stay clean.
- For app work, phrase queries with an app scope, e.g. `graphify query "APP_SCOPE <project-name> auth websocket"`.
- For SCRIBE tooling work, use `./scribe graph --build` and `./scribe graph --query "..."` for a separate bundle graph; do not pollute the app graph.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Graphify hook compatibility

Resolved on 2026-05-23: `PreToolUse hook returned unsupported additionalContext` came from the Graphify hook template, not from SCRIBE or the application.

What happened:
- The generated `.codex/hooks.json` hook emitted `hookSpecificOutput.additionalContext`.
- The current runtime rejects `additionalContext` in `PreToolUse` hook output.
- The active project hook now stays silent and only keeps a `graphify hook` marker so reinstall/uninstall can identify it.
- Patch every active Graphify installation if a reinstall can recreate the bad hook.
- Also sanitize global Gemini/Antigravity trusted hook registries if they contain old Graphify commands with `additionalContext`; valid commands should return only `{"decision":"allow"}`.

Rules:
- Never reintroduce `additionalContext` or `hookSpecificOutput` in project PreToolUse hooks.
- If Graphify is upgraded or reinstalled, rerun `graphify codex install` and verify active hook files plus active Graphify installations with `rg "additionalContext|hookSpecificOutput"`.
- A valid Codex hook command for this project is `: graphify hook; [ ! -f graphify-out/graph.json ] || true`.
- A valid Gemini trusted hook command is `: graphify hook; echo '{"decision":"allow"}'`.

## SCRIBE doctor guard

Use `docs/friction-policy.md` to choose the smallest safe workflow tier. Do not run full SCRIBE ceremony for read-only answers or trivial low-risk fixes.

Every future evolution of `AGENT-MEMOIRE_PROJECT_STATUS.scribe` is guarded:

- Run `./scribe doctor --suggest-fix` before editing the SCRIBE.
- Doctor Markdown reports are generated under `scribe-out/` by default; do not write doctor `.md` reports at repository root.
- If the pre-doctor reports any ERROR, stop and repair the existing memory before adding a new delta.
- Edit the SCRIBE incrementally only; never overwrite the file.
- Run `./scribe doctor --suggest-fix` immediately after editing.
- If the post-doctor reports any ERROR, fix the delta immediately or remove the faulty delta.
- For command-based mutations, prefer `./scribe guard -- <command>` so doctor wraps the command before and after.
