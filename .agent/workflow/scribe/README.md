# SCRIBE Portable Workflow Bundle

`.agent/workflow/scribe/` is the single portable SCRIBE workflow root.

Copy this directory into another project at `.agent/workflow/scribe/`, then run:

```bash
.agent/workflow/scribe/scribe bootstrap
.agent/workflow/scribe/scribe-rag build
.agent/workflow/scribe/scribe-rag context
```

Layout:

- `scribe`: maintenance, bootstrap, doctor, lock, sync, graph, worktree, and SCRIBE writes.
- `scribe-rag`: canonical read/retrieval interface for agents.
- `sel/`: internal SCRIBE engineering local causal retrieval engine.
- `rag/`: BM25 retrieval layer that calls the local SEL engine.

No legacy sibling workflow directory is part of the portable bundle. New projects
should copy this directory as one unit and use the root commands above.
