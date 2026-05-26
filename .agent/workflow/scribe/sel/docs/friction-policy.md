# Agentic Friction Policy V4

Version: `2026-05-26`

This policy chooses the smallest safe workflow tier. It does not replace
`docs/scribe.md`; it defines when to pay the full ceremony cost.

Command convention from a host project root:

```bash
SCRIBE=.agent/workflow/scribe/scribe
SCRIBE_RAG=.agent/workflow/scribe/scribe-rag
```

SEL is the internal guard/write engine. scribe-rag is the only agent retrieval
interface.

## Decision Tiers

| Tier | Trigger | Required Memory Work |
| --- | --- | --- |
| `READ_ONLY` | Explain, inspect, status, no writes | `$SCRIBE_RAG context` only if memory matters. No build, no challenge, no doctor, no SCRIBE write. |
| `QUICK` | One narrow edit, low blast radius | `$SCRIBE_RAG build` only if the index is stale; `$SCRIBE_RAG context`; `$SCRIBE_RAG challenge` only if implementation is non-trivial. |
| `STANDARD` | Normal feature, fix, refactor, docs, tests, or tooling | Full preflight V4: scribe-rag build/context, Graphify report, challenge before implementation, focused validation. |
| `CRITICAL` | Auth, data, public API, migrations, shared contracts, destructive or multi-agent coordination | Full preflight V4 plus SEL guard/lock/sync for SCRIBE writes, all challenges documented, SCAR required when a bug is resolved. |

## Automatic Selection

1. No file writes and no state mutation -> `READ_ONLY`.
2. One narrow edit, <=30 expected changed lines, no shared contract -> `QUICK`.
3. Normal code, docs, tests, or bundle tooling changes -> `STANDARD`.
4. Auth, data integrity, public API, destructive actions, SCRIBE mutations, or multi-agent coordination -> `CRITICAL`.

## Hard Skips

- `READ_ONLY`: do not build indexes, run doctor, acquire locks, or write SCRIBE.
- `QUICK`: keep validation focused; skip JOURNAL unless durable causal knowledge was learned.
- Escalate only when blast radius grows, validation fails, or a hot SCAR/VAC/GHOST directly applies.

## Guardrails

- Use `$SCRIBE_RAG challenge "<plan>"` before significant implementation.
- Use `$SCRIBE_RAG context` for grounding; do not use SEL direct `context`, `query`, or `explain` as an agent interface.
- Use `$SCRIBE_RAG eval --force` before and after retrieval scoring/ranking changes.
- Use `$SCRIBE doctor --suggest-fix`, `$SCRIBE lock`, and `$SCRIBE sync` only for SCRIBE writes and maintenance.
- Use `$SCRIBE worktree` before delivery to separate source changes from generated noise.
- Use `$SCRIBE graph --build` only when the bundle architecture matters.
- Do not run doctor for pure read-only answers.
- Do not add journal entries for command relays, status answers, or trivial edits.

## Hybrid Signal

If `$SCRIBE_RAG eval --force` drops below `7/8`:

```bash
pip install sentence-transformers --break-system-packages
$SCRIBE_RAG build --with-embeddings --force
```

BM25 remains canonical while eval stays `>= 7/8`.

## Success Criteria

The policy is working when:

- small fixes do not pay the full ritual cost;
- critical changes still run doctor/lock/sync around SCRIBE writes;
- agents never call SEL directly for retrieval;
- app Graphify remains focused on application code;
- bundle architecture remains available through `scribe-out/bundle-graph/`;
- agents spend more time changing the right code and less time rereading policy.
