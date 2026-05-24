# SCRIBE Engineering RAG

Purpose: package SCRIBE/TENOR engineering assets so they stay reusable across projects.

This folder is the importable home for agent rules, doctor scripts, workflow docs,
engineering notes, command specs, retrieval design, benchmarks, and future
implementation plans around SCRIBE query/challenge/explain tooling.

Layout:
- `docs/`: canonical agent and workflow documents; historical protocols stay under `docs/archive/`.
- `scripts/`: executable implementation modules used by the root `./scribe` adapter.
- `templates/`: root adapter templates and generated-file policy references.
- `tests/`: focused unit tests for the local SCRIBE store and memory commands.

Boundaries:
- Do not store causal project memory here; use `AGENT-MEMOIRE_PROJECT_STATUS.scribe`.
- Do not store structural code facts here; use `graphify-out/`.
- Active SCRIBE workflow rules live in `docs/scribe.md`.
- Friction-aware fast paths live in `docs/friction-policy.md`; use them to avoid paying the full protocol cost for read-only or narrow low-risk tasks.
- Keep experiments reproducible and guarded by `./scribe doctor` when they touch SCRIBE data.
- Keep root adapters small: `AGENTS.md`, `.graphifyignore`, `./scribe`, and
  `scripts/` compatibility shims should point here while preserving tool
  bootstrap and editor import behavior.
- Do not put generated caches in the bundle; the installer skips `__pycache__`,
  `.pytest_cache`, `.mypy_cache`, `.pyc`, and `.pyo` artifacts.

Current CLI baseline:
- `./scribe doctor [SCRIBE_PATH] [--output REPORT] [--suggest-fix]`
  - Default report: `scribe-out/scribe-doctor-report.md`
- `./scribe guard [SCRIBE_PATH] -- <command> [args...]`
  - Default reports: `scribe-out/scribe-doctor-before-report.md` and `scribe-out/scribe-doctor-after-report.md`
- `./scribe install [TARGET_PATH] [--force] [--dry-run]`
  - Installs this bundle into another project with root adapters for `scribe`,
    `AGENTS.md`, `.graphifyignore`, and Python import compatibility shims.
- `./scribe hot [--limit N]`
  - Prints hot memory entries for immediate agent grounding.
- `./scribe stats`
  - Prints SCRIBE health, tier counts, entity counts, and causal edge counts.
- `./scribe explain <ID>`
  - Explains one SCRIBE entity and its causal neighborhood.
- `./scribe related <ID>`
  - Shows incoming and outgoing causal neighbors for one SCRIBE entity.
- `./scribe query "<text>" [--limit N]`
  - Searches causal SCRIBE memory locally. It does not call Graphify by default.
- `./scribe challenge "<plan>" [--limit N]`
  - Challenges a plan against scars, vaccins, patterns, ghosts, hypotheses, and debts.
- `./scribe compact [--apply]`
  - Reports safe tier-registry compaction opportunities; with `--apply`, rewrites only the root `tiers` registry after doctor validation.
- `./scribe promote <ID> --tier hot|warm|cold [--dry-run]`
  - Moves one SCRIBE entity across memory tiers with a targeted text patch and post-write rollback on doctor errors.
- `./scribe export --format json [--output PATH] [--include-values]`
  - Exports indexed causal memory as deterministic JSON for external tools, dashboards, or future RAG pipelines.
- `./scribe archive [--apply] [--output AGENT-MEMOIRE_ARCHIVE.yaml]`
  - Dry-runs cold-entry archival by default; with `--apply`, writes archive YAML and prunes archived blocks from the active SCRIBE after doctor validation.
- `./scribe dashboard [--output scribe-out/scribe-dashboard.html]`
  - Generates a static HTML dashboard plus JSON data file from the same indexed payload used by `./scribe export`.
- `./scribe graph [--build] [--query TEXT] [--budget N]`
  - Builds or queries a separate Graphify graph for this bundle without polluting root application `graphify-out/`.
- `./scribe worktree [--strict]`
  - Classifies Git worktree state into tracked changes, untracked source candidates, and generated noise.
