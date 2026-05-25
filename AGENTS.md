<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START -->
## SCRIBE/TENOR Local Causal Retrieval Bundle

The reusable SCRIBE/TENOR local causal retrieval bundle lives in:

- `.agent/workflow/scribe-engineering-local-causal-retrieval/`

Read `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/AGENTS.md` for local rules.
Read `.agent/rules/scribe.md` as the host-agent always-on summary; the full protocol remains in `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/scribe.md`.

This root `AGENTS.md` is only the host bootstrap pointer. Do not paste a full
legacy TENOR/GEMINI protocol here. If this file, `~/.gemini/GEMINI.md`, or an
agent runtime prompt disagrees with the bundle, the canonical bundle docs win.
Update the pointer instead of reviving archived protocol copies.

Critical local rules:
- Canonical SCRIBE CLI from the project root: `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe`. Use this bundle-local command path in automation.
- First command after copying `.agent` into a project: `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe bootstrap`. It is idempotent and initializes only missing project-local surfaces.
- Do not assume root `./scribe` or root `scripts/` exist; they are opt-in legacy adapters generated only with `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe install --with-root-adapters`.
- Never use `.agent/workflow/scribe-engineering-rag/`, `.agent/workflows/scribe.md`, `docs/archive/scribe.v3.1.md.old`, or root `./scribe`/`scripts/` as canonical sources.
- For installation, migration, or several agents working on the same repo, read `.agent/workflow/scribe-engineering-local-causal-retrieval/docs/multi-agent-installation.md` before editing.
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe graph --build` and `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe graph --query "..."` for a separate bundle graph under `scribe-out/bundle-graph/`.
- Keep `AGENT-MEMOIRE_PROJECT_STATUS.scribe`, `scribe-out/`, and `graphify-out/` at the host project root. They are generated project-local surfaces, not portable `.agent` bundle files.
- Choose the smallest safe tier from `docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Prefer `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe context --mode quick|standard` for compact grounding instead of chaining multiple SCRIBE commands.
- Use `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe eval` to measure local causal retrieval quality before changing scoring, ranking, or tier policy.
- Run `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe sync --agent <name> --type <extension|cli|api|unknown>` before work; if it reports stale state, relire/re-sync before editing.
- Run `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe clean --dry-run` before delivery when `scribe-out/` has accumulated generated reports, exports, screenshots, or cache noise.
- Use `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- Before mutating SCRIBE state, acquire `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>` and release it after validation; doctor and read-only commands stay unblocked.
- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe query` searches only causal SCRIBE memory by default; Graphify remains responsible for structural code facts.
- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe graphify-hooks --apply` reapplies and verifies the stdin-consuming Graphify hook patch after any Graphify reinstall or upgrade.
- Graphify upstream PR diff is preserved in `.agent/workflow/scribe-engineering-local-causal-retrieval/patches/graphify-upstream-hook-stdin.patch` when direct PR tooling is unavailable.
- `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe worktree` separates generated noise from source changes before delivery.
- Final host-LLM intention before closing a real coding session: ask "Qu'est-ce qui fera souffrir le prochain LLM si je ne le documente pas ?" Concrete future pain becomes a SCAR or GHOST; otherwise the JOURNAL is enough.
<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END -->

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying app code files in this session, run `graphify update .`; after modifying the SCRIBE bundle, run `.agent/workflow/scribe-engineering-local-causal-retrieval/scribe graph --build`.
