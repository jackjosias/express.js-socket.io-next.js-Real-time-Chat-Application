# scribe-rag — Retrieval Layer V1

## Rôle

scribe-rag is the only memory read interface for agents. It calls SEL internally
through the canonical CLI and JSON export. Agents must not read
`AGENT-MEMOIRE_PROJECT_STATUS.scribe` directly.

SEL remains the internal guard/write engine for bootstrap, doctor, lock, sync,
state, export, archive, graph maintenance, and SCRIBE writes.

## Modes

- `BM25`: default, zero external dependency, portable.
- `Hybrid`: enabled by `--with-embeddings` when `sentence-transformers` is installed.

Hybrid is recommended only when `scribe-rag eval --force` drops below `7/8`.

## Commandes

```bash
.agent/workflow/scribe/scribe-rag build [--with-embeddings] [--force]
.agent/workflow/scribe/scribe-rag context
.agent/workflow/scribe/scribe-rag query "<texte>"
.agent/workflow/scribe/scribe-rag explain <ID>
.agent/workflow/scribe/scribe-rag challenge "<plan>"
.agent/workflow/scribe/scribe-rag eval [--force]
.agent/workflow/scribe/scribe-rag doctor
.agent/workflow/scribe/scribe-rag whoami
```

## État local

`scribe-rag whoami` reports the last SCRIBE writer, last session, lock status, lock owner/surface when locked, index mode, and the eval command to run. It is read-only.

## Décision canonique

- `GHOST-007`: BM25 portable chosen as canonical read-only preflight.
- `GHOST-008`: SEL is the internal engine only; scribe-rag BM25 is the agent interface.

Benchmark decision data:

- Query output: scribe-rag BM25 `12` lines vs SEL `34` lines.
- Semantic retrieval: scribe-rag BM25 `4/4` vs SEL `2/4`.
- Hybrid rejected as default because its latency and model footprint do not justify the marginal gain while BM25 eval stays green.

## Signal Hybrid

```bash
.agent/workflow/scribe/scribe-rag eval --force
# if result is < 7/8:
pip install sentence-transformers --break-system-packages
.agent/workflow/scribe/scribe-rag build --with-embeddings --force
```

After that build, scribe-rag uses the hybrid index automatically.
