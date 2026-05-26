# JJK Messenger Frontend Documentation

This folder documents the active Clean Architecture state for `src/`.
Keep it synchronized with code changes.

## Active Map

| Zone | Responsibility | Source |
| --- | --- | --- |
| App Router | Thin Next.js route surface | `src/app` |
| Domain | Stable business types and validation policies | `src/core/domain` |
| Application | Use cases orchestrating domain intentions | `src/core/application` |
| Infrastructure | Redux Toolkit, RTK Query, API config, browser storage, realtime adapters | `src/core/infrastructure` |
| Presentation | Client pages, components, providers and hooks | `src/core/presentation` |
| Shared | Cross-layer utilities with no framework state | `src/shared` |

## Import Rule

Use `src/core/*` for domain, application, infrastructure and presentation code.
Use `src/shared/*` for cross-layer utilities. Do not recreate legacy top-level
`src/store`, `src/components`, or `src/utils` adapters.
