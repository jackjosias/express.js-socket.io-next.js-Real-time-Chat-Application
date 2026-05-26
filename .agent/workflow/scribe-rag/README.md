# SCRIBE-RAG

Experimental read-only retrieval layer over the canonical SCRIBE/TENOR local causal retrieval bundle.

Principles:
- SEL remains the write/guard system: doctor, lock, sync, state, and SCRIBE mutations.
- SCRIBE-RAG is read-only over `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- SCRIBE-RAG talks to SEL only through the canonical bundle CLI path and JSON export.
- No import of SEL private Python scripts.
- BM25-style scoring is always available; embeddings are optional and not required for bootstrap or CI.
- Generated indexes live under `scribe-out/`.

Commands:

```bash
.agent/workflow/scribe-rag/scribe-rag build
.agent/workflow/scribe-rag/scribe-rag query "auth jwt"
.agent/workflow/scribe-rag/scribe-rag context
.agent/workflow/scribe-rag/scribe-rag explain GHOST-005
.agent/workflow/scribe-rag/scribe-rag challenge "mettre JWT en localStorage"
.agent/workflow/scribe-rag/scribe-rag eval
```
