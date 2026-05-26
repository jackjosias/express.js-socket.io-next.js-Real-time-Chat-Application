<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:START -->
## SCRIBE/TENOR Local Causal Retrieval Bundle

The reusable SCRIBE/TENOR local causal retrieval bundle lives in:

- `.agent/workflow/scribe/`

Read `.agent/workflow/scribe/sel/docs/AGENTS.md` for local rules.
Read `.agent/rules/scribe.md` as the host-agent always-on summary; the full protocol remains in `.agent/workflow/scribe/sel/docs/scribe.md`.

Critical local rules:
- SEL internal engine from the project root: `.agent/workflow/scribe/scribe`. Do not call SEL directly for agent retrieval; use it only for bootstrap, doctor, lock, sync/state, export, archive, graph maintenance, and SCRIBE writes.
- Agent retrieval interface: `.agent/workflow/scribe/scribe-rag` only. Use scribe-rag for `build`, `context`, `query`, `explain`, and `challenge`; it calls SEL internally through the portable SEL command.
- First command after copying `.agent` into a project: `.agent/workflow/scribe/scribe bootstrap`. It is idempotent and initializes only missing project-local surfaces.
- Do not assume root `./scribe` or root `scripts/` exist; they are opt-in legacy adapters generated only with `.agent/workflow/scribe/scribe install --with-root-adapters`.
- For installation, migration, or several agents working on the same repo, read `.agent/workflow/scribe/sel/docs/multi-agent-installation.md` before editing.
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `.agent/workflow/scribe/scribe graph --build` and `.agent/workflow/scribe/scribe graph --query "..."` for a separate bundle graph under `scribe-out/bundle-graph/scribe/`.
- Default commit/push scope is the host product source. Version `AGENT-MEMOIRE_PROJECT_STATUS.scribe` only when shared causal memory is desired; keep `graphify-out/` and `scribe-out/` out of commits by default; version `.agent/` only when intentionally maintaining agent tooling.
- Choose the smallest safe tier from `.agent/workflow/scribe/sel/docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Final standard preflight: `.agent/workflow/scribe/scribe-rag build` if the index is stale, `.agent/workflow/scribe/scribe-rag context`, `graphify update .` when app code changed, then `sed -n "1,100p" graphify-out/GRAPH_REPORT.md`. Before significant implementation, run `.agent/workflow/scribe/scribe-rag challenge "<plan>"`; STOP means do not implement, REVIEW means read warnings then decide, and PROCEED means continue.
- Never use SEL direct retrieval commands in AGENTS.md or agent preflight: no `.agent/workflow/scribe/scribe context`, no `.agent/workflow/scribe/scribe query`, and no SEL direct challenge for normal agent work.
- Hybrid activation signal: if `.agent/workflow/scribe/scribe-rag eval --force` drops below 7/8, install `sentence-transformers` and run `.agent/workflow/scribe/scribe-rag build --with-embeddings --force`; after that build, scribe-rag reads the hybrid index automatically. BM25 remains canonical while eval stays >= 7/8.
- Run `.agent/workflow/scribe/scribe sync --agent <name> --type <extension|cli|api|unknown>` before work; if it reports stale state, relire/re-sync before editing.
- Run `.agent/workflow/scribe/scribe clean --dry-run` before delivery when `scribe-out/` has accumulated generated reports, exports, screenshots, or cache noise.
- Use `.agent/workflow/scribe/scribe doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- Before mutating SCRIBE state, acquire `.agent/workflow/scribe/scribe lock acquire --agent <name> --type <extension|cli|api|unknown> --session <JOURNAL-ID>` and release it after validation; doctor and read-only commands stay unblocked.
- `.agent/workflow/scribe/scribe-rag query` searches causal SCRIBE memory through the BM25 canonical interface; Graphify remains responsible for structural code facts.
- `.agent/workflow/scribe/scribe graphify-hooks --apply` reapplies and verifies the stdin-consuming Graphify hook patch after any Graphify reinstall or upgrade.
- Graphify upstream PR diff is preserved in `.agent/workflow/scribe/sel/patches/graphify-upstream-hook-stdin.patch` when direct PR tooling is unavailable.
- `.agent/workflow/scribe/scribe worktree` separates generated noise from source changes before delivery.
<!-- SCRIBE-ENGINEERING-LOCAL-CAUSAL-RETRIEVAL:END -->

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying app code files in this session, run `graphify update .`; after modifying the SCRIBE bundle, run `.agent/workflow/scribe/scribe graph --build`.
