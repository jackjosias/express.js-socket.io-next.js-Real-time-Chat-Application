# Agentic Friction Policy

Version: `2026-05-23`

This policy reduces SCRIBE/TENOR runtime overhead without replacing the full
protocol in `docs/scribe.md`. The full protocol remains authoritative for
high-risk work; this file defines the fast path agents should use for ordinary
coding sessions.

## Decision Tiers

| Tier | Trigger | Required Memory Work |
| --- | --- | --- |
| `READ_ONLY` | Explain, inspect, status, audit with no writes | Read Graphify only if structure matters; use SCRIBE query/hot only if history matters; do not write SCRIBE. |
| `QUICK` | One narrow edit, low blast radius | Read relevant hot memories; run focused validation; write SCRIBE only if a new lesson was learned. |
| `STANDARD` | Normal feature, fix, refactor, or tooling change | Graphify for structure; SCRIBE challenge for the plan; focused tests; causal SCRIBE delta when durable knowledge changed. |
| `CRITICAL` | Auth, data, public API, migrations, shared contracts, destructive actions | Full Graphify/SCRIBE/doctor guard, tests/lint/build, and causal SCRIBE delta. |

## Guardrails

- Prefer `./scribe challenge "<plan>"` over manually rereading the full SCRIBE.
- Prefer `./scribe worktree` before delivery to separate source changes from generated noise.
- Use `./scribe graph --build` only when the bundle architecture matters.
- Do not run doctor for pure read-only answers.
- Do not add journal entries for command relays, status answers, or trivial edits.

## Success Criteria

The policy is working when:

- small fixes do not pay the full ritual cost;
- critical changes still run doctor before and after SCRIBE edits;
- app Graphify remains focused on application code;
- bundle architecture is available through its own graph;
- agents spend more time changing the right code and less time rereading policy.
