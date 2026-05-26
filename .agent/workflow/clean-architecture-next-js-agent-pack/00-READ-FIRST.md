# 00 - Read First

Ce fichier est le point d'entree obligatoire du pack.

Objectif: imposer a un agent LLM un ordre d'ingestion clair, sans deviner quel fichier lire en premier.

Certifier “zéro casse” comme une garantie mathématique universelle. Le pack réduit fortement le risque parce qu’il force:

le choix GREENFIELD ou MIGRATION_EXISTANTE;
la lecture de AGENTS.md, DEVELOPMENT_GUIDELINES.md et des normes par couche;
la lecture de node_modules/next/dist/docs/ si le projet cible utilise Next.js;
la recherche de l’existant avant création;
la règle src/app léger, 'use client' déplacé vers core/presentation;
Redux Toolkit slices pour l’état partagé/long-lived;
RTK Query pour les données serveur cacheables;
le respect du flux /api/proxy;
l’arrêt obligatoire si les gates ne sont pas remplies.
Pour un nouveau projet, oui: il sert de bootstrap propre pour installer la structure.

Pour un projet existant et fonctionnel, oui aussi, mais uniquement en mode migration prudente: l’agent doit cartographier l’existant, réutiliser avant de créer, migrer par petits incréments, lancer les tests/lint/build, et ne jamais réécrire aveuglément une architecture qui marche déjà.

## Regle Zero

Ne rien implementer avant d'avoir termine les phases 0 a 7 ci-dessous.

Si le contexte est trop long, lire au minimum:

1. `00-READ-FIRST.md`
2. `invocation.md`
3. `WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD`
4. `corpus/AGENTS.md`
5. `corpus/DEVELOPMENT_GUIDELINES.md`
6. la norme de couche correspondant a la tache
7. la documentation Next locale si le projet cible utilise Next.js

## Phase 0 - Orientation Du Pack

Lire:

```text
00-READ-FIRST.md
README.md
invocation.md
```

But:

- comprendre que ce dossier est un pack portable;
- comprendre l'ordre d'ingestion;
- comprendre le comportement attendu de l'agent.

Sortie attendue:

```text
PACK_READY = true
```

## Phase 1 - Workflow Global

Lire:

```text
WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD
```

But:

- identifier le scenario `GREENFIELD` ou `MIGRATION_EXISTANTE`;
- comprendre l'architecture cible;
- comprendre le flux `app -> presentation -> application -> domain/infrastructure -> RTK Query -> proxy`.

Sortie attendue:

```text
SCENARIO = GREENFIELD | MIGRATION_EXISTANTE
```

## Phase 2 - Regles Projet Non Negociables

Lire:

```text
corpus/AGENTS.md
corpus/DEVELOPMENT_GUIDELINES.md
corpus/docs/architecture/development-guidelines.md
```

But:

- appliquer "chercher d'abord, coder ensuite";
- eviter toute duplication;
- respecter DRY;
- appliquer les regles memoization/lazy loading/code splitting;
- verifier honnetement les commandes;
- lire la doc Next locale avant tout travail Next.js.

Sortie attendue:

```text
DRY_CHECK_REQUIRED = true
NEXT_DOCS_REQUIRED_IF_NEXT = true
```

## Phase 3 - Carte Documentation

Lire:

```text
corpus/docs/README.md
corpus/docs/architecture/project-operating-and-next-config.md
```

But:

- localiser les normes;
- comprendre les regles projet;
- comprendre la structure `next.config*` si applicable.

## Phase 4 - App Router Et Frontiere Client

Lire:

```text
corpus/docs/app/app-router-writing-rules.md
```

But:

- garder `src/app` leger;
- refuser les nouveaux `'use client'` dans `app` sans justification;
- placer les composants interactifs dans `core/presentation`;
- deplacer l'etat partage vers Redux Toolkit slices.

Sortie attendue:

```text
APP_ROUTER_LIGHT = true
```

## Phase 5 - Couches Clean Architecture

Lire dans cet ordre:

```text
corpus/docs/core/domain/domain-writing-rules.md
corpus/docs/core/application/use-case-writing-rules.md
corpus/docs/core/infrastructure/infrastructure-writing-rules.md
corpus/docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md
corpus/docs/core/presentation/components/component-writing-rules.md
corpus/docs/core/presentation/hooks/hook-writing-rules.md
```

But:

- domaine pur;
- use cases dependants du domaine seulement;
- infrastructure technique;
- store Redux Toolkit + RTK Query;
- presentation comme orchestration UI;
- hooks propres, sans proliferation de `useState` / `useEffect`.

## Phase 6 - Documentation Next Locale Du Projet Cible

Si le projet cible utilise Next.js, lire dans le projet cible:

```text
node_modules/next/dist/docs/
```

Prioriser selon la tache:

| Tache | Docs locales a chercher |
| --- | --- |
| `src/app`, pages, layouts | Server and Client Components, Project Structure |
| route handlers | Route Handlers |
| proxy | Proxy |
| `next.config*` | next.config.js, headers, images, typedRoutes, logging |
| cache | Caching, Revalidating |
| images | images |

Sortie attendue:

```text
NEXT_LOCAL_DOCS_READ = true | not_applicable
```

## Phase 7 - Recherche Dans Le Codebase Cible

Avant de creer quoi que ce soit, chercher l'existant.

Commandes recommandees:

```bash
rg --files
rg -n "NomOuPattern" src app .
rg -n "'use client'|useState|useEffect|createSlice|createApi|fetch\\(|axios" src app .
find src -maxdepth 5 -type f | sort
```

But:

- ne pas dupliquer;
- reutiliser le design system;
- reutiliser les hooks;
- reutiliser les slices;
- reutiliser les schemas/types/services.

Sortie attendue:

```text
EXISTING_CODE_SEARCH_DONE = true
```

## Gate Avant Implementation

L'agent peut implementer seulement si:

```text
PACK_READY = true
SCENARIO is known
DRY_CHECK_REQUIRED = true
APP_ROUTER_LIGHT = true
NEXT_LOCAL_DOCS_READ = true | not_applicable
EXISTING_CODE_SEARCH_DONE = true
```

Si une de ces lignes manque, l'agent doit s'arreter et lire/rechercher avant de coder.
