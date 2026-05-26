# Algoway Front Documentation Index

Derniere mise a jour structurelle: 2026-05-21.

Ce dossier documente l'etat actuel de `src/`. La documentation doit suivre le code, pas l'inverse. Quand un fichier de `src/` change de responsabilite, la documentation correspondante doit etre mise a jour dans le meme mouvement.

## Carte Rapide

| Zone | Documentation | Source active |
| --- | --- | --- |
| Carte globale de `src/` | `docs/architecture/src-architecture-map.md` | `src/` |
| Audit documentation Clean Architecture | `docs/architecture/clean-architecture-documentation-audit.md` | `docs/README.md`, `docs/architecture/documentation-gap-register.md`, `docs/core/*` |
| Regles projet et Next config | `docs/architecture/project-operating-and-next-config.md` | `AGENTS.md`, `next.config.ts`, `next.config.base.ts`, `next.config.dev.ts`, `next.config.prod.ts` |
| Guidelines developpement obligatoires | `docs/architecture/development-guidelines.md` | `DEVELOPMENT_GUIDELINES.md`, toute implementation |
| Workflow replication Clean Architecture Next.js | `docs/architecture/WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD` | nouveaux projets Next.js, migrations progressives |
| Clean Architecture | `docs/architecture/clean-architecture.txt` | `src/core/domain`, `src/core/application`, `src/core/infrastructure`, `src/core/presentation` |
| Regles App Router leger | `docs/app/app-router-writing-rules.md` | `src/app` |
| Cycle requete UI -> API | `docs/architecture/lifecycle-request.txt` | `src/app`, `src/core/infrastructure/store`, `src/app/api` |
| Domaine metier | `docs/core/domain/README.md` | `src/core/domain` |
| Regles d'ecriture du domaine | `docs/core/domain/domain-writing-rules.md` | `src/core/domain/entities`, `src/core/domain/schemas`, `src/core/domain/types`, `src/core/domain/repositories` |
| Use cases | `docs/core/application/README.md` | `src/core/application` |
| Regles d'ecriture des use cases | `docs/core/application/use-case-writing-rules.md` | `src/core/application/useCases` |
| Infrastructure | `docs/core/infrastructure/README.md` | `src/core/infrastructure` |
| Regles d'ecriture infrastructure/store | `docs/core/infrastructure/infrastructure-writing-rules.md` | `src/core/infrastructure`, `src/core/infrastructure/store` |
| Flux RTK Query -> Proxy | `docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md` | `src/core/presentation/hooks/pages/Home/useCommandsHooks.ts`, `src/core/infrastructure/store/api`, `src/app/api/proxy` |
| Presentation | `docs/core/presentation/README.md` | `src/core/presentation` |
| Regles composants/providers | `docs/core/presentation/components/component-writing-rules.md` | `src/core/presentation/components`, `src/core/presentation/components/providers` |
| Regles hooks presentation | `docs/core/presentation/hooks/hook-writing-rules.md` | `src/core/presentation/hooks` |
| App Router | `docs/app/README.md` | `src/app` |
| Proxy HTTP | `docs/api/proxy/README.md` | `src/app/api/proxy`, `src/proxy.ts` |
| Market data | `docs/api/market-data/README.md` | `src/app/api/market-data`, `src/app/api/cron/route.ts`, `src/core/presentation/components/pages/Widget/TechnicalAnalysis/hooks/MarketData` |
| Technical Analysis | `docs/core/presentation/components/pages/Widget/TechnicalAnalysis/README.md` | `src/core/presentation/components/pages/Widget/TechnicalAnalysis` |
| Shared utilities | `docs/shared/README.md` | `src/shared` |
| Ecarts et dette documentaire | `docs/architecture/documentation-gap-register.md` | `docs/`, `src/` |

## Regles De Documentation

- Avant toute implementation, lire `docs/architecture/development-guidelines.md` en plus des normes de couche concernees.
- Documenter uniquement l'etat actif de `src/` dans les README et cartes d'architecture.
- Garder les anciens plans dans des dossiers `legacy` ou les marquer explicitement comme prospectifs.
- Ne pas presenter un fichier absent de `src/` comme implemente.
- Quand une route API, un hook ou un service est retire, le document doit dire "retire" ou "legacy".
- Les chemins doivent etre exacts et relatifs a la racine du repo.

## Etat Actuel Important

- `graphify-out/graph.json` est absent: la carte actuelle a ete reconstruite par audit filesystem et validation TypeScript.
- `npx next typegen` doit etre lance avant `tsc --noEmit` quand les routes App Router changent.
- `brvm-collect` n'est plus une route active dans `src/app/api/market-data`; les anciennes references sont legacy.
- `useIntradayData` existe encore mais n'est plus importe par `TechnicalAnalysis.tsx`.
- `TechnicalAnalysis` est fonctionnellement stabilise mais contient encore plusieurs fichiers lourds qui doivent etre modifies avec prudence.
