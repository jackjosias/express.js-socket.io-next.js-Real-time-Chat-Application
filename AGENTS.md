<!-- SCRIBE-ENGINEERING-RAG:START -->
## SCRIBE/TENOR Engineering Bundle

The reusable SCRIBE/TENOR engineering bundle lives in:

- `.agent/workflow/scribe-engineering-rag/`

Read `.agent/workflow/scribe-engineering-rag/docs/AGENTS.md` for local rules.

Critical local rules:
- Read `graphify-out/GRAPH_REPORT.md` before architecture or codebase work when it exists.
- Keep root `graphify-out/` focused on application code; SCRIBE/TENOR tooling is ignored by root `.graphifyignore`.
- Use `./scribe graph --build` and `./scribe graph --query "..."` for a separate bundle graph.
- Choose the smallest safe tier from `docs/friction-policy.md`; READ_ONLY skips doctor/SCRIBE writes, QUICK skips full ceremony unless risk escalates.
- Prefer `./scribe context --mode quick|standard` for compact grounding instead of chaining multiple SCRIBE commands.
- Use `./scribe doctor --suggest-fix` before and after editing `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- `./scribe query` searches only causal SCRIBE memory by default; Graphify remains responsible for structural code facts.
- `./scribe worktree` separates generated noise from source changes before delivery.
<!-- SCRIBE-ENGINEERING-RAG:END -->

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
