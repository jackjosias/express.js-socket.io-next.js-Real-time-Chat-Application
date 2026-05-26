# Workflow Clean Architecture Next.js

Date: 2026-05-22.

Ce workflow est un playbook transmissible a un agent LLM IDE. Son but est de permettre a un agent de materialiser, dans un projet Next.js neuf ou existant, une architecture proche de celle documentee dans ce repo.

Il couvre deux scenarios:

1. **Projet neuf / vide**: creer directement la structure cible et connecter les briques.
2. **Projet existant / deja fonctionnel**: migrer progressivement sans ecraser le code existant.

## Lecture Obligatoire Avant Action

Avant toute implementation, l'agent doit lire:

```text
AGENTS.md
DEVELOPMENT_GUIDELINES.md
docs/README.md
docs/architecture/development-guidelines.md
docs/architecture/project-operating-and-next-config.md
docs/app/app-router-writing-rules.md
docs/core/domain/domain-writing-rules.md
docs/core/application/use-case-writing-rules.md
docs/core/infrastructure/infrastructure-writing-rules.md
docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md
docs/core/presentation/components/component-writing-rules.md
docs/core/presentation/hooks/hook-writing-rules.md
```

Si le projet cible utilise Next.js, l'agent doit aussi lire la documentation locale installee:

```text
node_modules/next/dist/docs/
```

En particulier, avant de toucher `src/app`, `next.config*`, route handlers, proxy, headers, images, cache ou Server/Client Components.

## Regles Non Negociables

- Chercher d'abord, coder ensuite.
- Ne pas dupliquer un composant, hook, utilitaire, schema, type, service ou API call existant.
- Ne pas ecraser un projet existant.
- Ne pas deplacer massivement sans point de restauration ou plan progressif.
- Ne pas mettre de client lourd dans `src/app`.
- Ne pas semer `useState` / `useEffect` partout pour de l'etat partage.
- Utiliser Redux Toolkit slice pour l'etat client partage ou long-lived.
- Utiliser RTK Query pour les donnees serveur cacheables.
- Garder le domaine pur: pas React, Next.js, Redux Toolkit, RTK Query, NextAuth.
- Garder `application/useCases` dependante du domaine seulement.
- Garder `infrastructure` comme couche des details techniques.
- Garder `presentation` comme couche d'orchestration UI.
- Toujours documenter les ecarts actifs.

## Architecture Cible

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   └── ...
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── types/
│   ├── application/
│   │   └── useCases/
│   ├── infrastructure/
│   │   ├── repositories/
│   │   ├── security/
│   │   └── store/
│   │       ├── api/
│   │       │   ├── config.ts
│   │       │   ├── rtkApi-query/
│   │       │   └── rtk-endpoints/
│   │       ├── hooks.ts
│   │       ├── index.ts
│   │       └── slices/
│   └── presentation/
│       ├── components/
│       │   ├── providers/
│       │   ├── design-system/
│       │   └── pages/
│       └── hooks/
└── shared/
    ├── types/
    ├── utils/
    └── data/
```

## Flux Cible D'Une Feature

```text
src/app/page.tsx ou layout.tsx
  -> composant enfant dans core/presentation
    -> hook presentation
      -> adapter repository infrastructure
        -> use case application
          -> contrat repository domain
            -> implementation infrastructure
              -> RTK Query endpoint
                -> baseApi
                  -> baseQueryWithRetry
                    -> /api/proxy/<apiId>/...
                      -> route handler proxy
                        -> API cible
```

## Workflow 0: Diagnostic Initial

### 0.1 Identifier Le Scenario

Repondre explicitement:

```text
SCENARIO = GREENFIELD | MIGRATION_EXISTANTE
```

Greenfield si:

- projet Next.js cree mais quasi vide;
- pas de logique metier importante;
- pas de code utilisateur a preserver.

Migration existante si:

- `src/`, `app/`, `components/`, `lib/`, `hooks/`, `store/` contiennent deja du code;
- le projet fonctionne deja;
- des routes/pages existantes ne doivent pas casser.

### 0.2 Lire La Carte Du Projet

Commandes recommandees:

```bash
find . -maxdepth 3 -type f | sort
find src -maxdepth 5 -type f | sort
rg -n "'use client'|useState|useEffect|createSlice|createApi|fetch\\(|axios|next-auth|SessionProvider|Provider" src app .
```

Adapter avec `rg --files` si disponible.

### 0.3 Detecter Les Sources Existantes

Chercher:

- composants UI;
- hooks;
- stores Redux/Zustand/Context;
- appels API;
- schemas Zod/Yup;
- types/interfaces;
- services;
- middleware/proxy;
- configs Next;
- providers globaux.

Decision:

```text
Si ca existe deja -> reutiliser / etendre / migrer progressivement.
Si absent -> creer dans l'emplacement cible.
```

## Workflow 1: Projet Neuf / Greenfield

### 1.1 Creer La Structure

Creer:

```text
src/core/domain/entities
src/core/domain/enums
src/core/domain/repositories
src/core/domain/schemas
src/core/domain/types
src/core/application/useCases
src/core/infrastructure/repositories
src/core/infrastructure/security
src/core/infrastructure/store/api/rtkApi-query
src/core/infrastructure/store/api/rtk-endpoints
src/core/infrastructure/store/slices
src/core/presentation/components/providers
src/core/presentation/components/design-system
src/core/presentation/components/pages
src/core/presentation/hooks/common
src/shared/utils
src/shared/types
src/shared/data
```

### 1.2 Installer Les Fondations Store

Creer:

```text
src/core/infrastructure/store/index.ts
src/core/infrastructure/store/hooks.ts
src/core/infrastructure/store/api/config.ts
src/core/infrastructure/store/api/rtkApi-query/baseApi.ts
src/core/infrastructure/store/api/rtkApi-query/baseQuery.ts
```

Regles:

- `makeStore()` cree le store.
- Monter `[baseApi.reducerPath]: baseApi.reducer`.
- Ajouter `baseApi.middleware`.
- Exposer `AppStore`, `RootState`, `AppDispatch`.
- Creer `useAppDispatch`, `useAppSelector`, `useAppStore`.
- Ne jamais stocker de token sensible dans Redux.

### 1.3 Installer Les Providers

Creer:

```text
src/core/presentation/components/providers/AppProvider.wrapper.tsx
src/core/presentation/components/providers/StoreProvider.tsx
```

Selon le besoin:

```text
SessionProvider
StoreProvider
ThemeProvider
ReCaptchaProvider
Autres providers strictement globaux
```

Puis connecter dans:

```text
src/app/layout.tsx
```

Regle: `src/app/layout.tsx` reste Server Component, il importe seulement `AppProviders`.

### 1.4 Creer Une Premiere Feature Complete

Exemple: `command`.

Creer domaine:

```text
domain/schemas/command.schema.ts
domain/types/command.type.ts
domain/repositories/command.repository.ts
```

Creer use cases:

```text
application/useCases/command/create-command.use-case.ts
application/useCases/command/get-all-commands.use-case.ts
application/useCases/command/index.ts
```

Creer infrastructure:

```text
infrastructure/store/api/rtk-endpoints/command/command.api.ts
infrastructure/repositories/command/command.createapi.repository.impl.ts
infrastructure/repositories/command/command.mock.repository.impl.ts
infrastructure/repositories/command/command.repository.adapter.ts
```

Creer presentation:

```text
presentation/hooks/pages/Command/useCommandsHook.ts
presentation/components/pages/Command/CommandPage.tsx
```

Connecter route:

```text
src/app/commands/page.tsx
  -> core/presentation/components/pages/Command/CommandPage
```

### 1.5 Configurer App Router Leger

Regle:

- `src/app/**/page.tsx` delegue.
- `src/app/**/layout.tsx` delegue.
- Pas de `useState/useEffect` dans `src/app`.
- Pas de widget lourd inline.
- Client-only lourd via `dynamic(..., { ssr: false })`.

### 1.6 Creer La Documentation Locale

Creer ou copier:

```text
docs/README.md
docs/architecture/development-guidelines.md
docs/architecture/project-operating-and-next-config.md
docs/app/app-router-writing-rules.md
docs/core/domain/domain-writing-rules.md
docs/core/application/use-case-writing-rules.md
docs/core/infrastructure/infrastructure-writing-rules.md
docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md
docs/core/presentation/components/component-writing-rules.md
docs/core/presentation/hooks/hook-writing-rules.md
docs/architecture/documentation-gap-register.md
```

## Workflow 2: Projet Existant / Migration Progressive

### 2.1 Ne Rien Ecraser

Interdictions:

- ne pas supprimer `src` existant;
- ne pas renommer massivement sans plan;
- ne pas deplacer des routes fonctionnelles en bloc;
- ne pas remplacer un store existant sans adapter;
- ne pas casser les imports existants.

### 2.2 Creer Une Zone De Quarantaine Legacy

Si le projet a deja un `src` plat ou mal organise, creer:

```text
src/legacy/
```

Puis deplacer progressivement l'ancien code seulement par lots valides.

Option prudente:

```text
src/_legacy_existing/
```

ou:

```text
src/legacy/<date-or-domain>/
```

Ne jamais deplacer tout `src` sans verifier les imports, routes Next et alias TS.

### 2.3 Construire La Nouvelle Architecture A Cote

Creer la structure cible:

```text
src/core/...
src/shared/...
```

Puis migrer feature par feature.

Ordre recommande:

1. types/schemas domaine;
2. repositories domaine;
3. use cases;
4. infrastructure store/api/repositories;
5. hooks presentation;
6. composants presentation;
7. routes `src/app` minces qui deleguent.

### 2.4 Tricher Intelligemment Sur Le Code Fonctionnel

Principe: le code existant qui marche est une source d'information, pas une dette a jeter.

Pour chaque feature:

1. Lire l'ancien composant/service/hook.
2. Extraire les types implicites.
3. Identifier les appels API.
4. Identifier les etats locaux.
5. Reconstituer le schema Zod.
6. Creer le repository contract.
7. Creer les use cases.
8. Rebrancher l'UI avec un hook presentation.
9. Garder le comportement visible identique.

Ne pas chercher a ameliorer toutes les UX pendant la migration. D'abord parite fonctionnelle, ensuite refactor.

### 2.5 Migration Des Etats `useState/useEffect`

Classer chaque etat local:

| Etat | Destination |
| --- | --- |
| champ local d'un formulaire isole | local |
| toggle purement local | local |
| modal globale | Redux slice |
| dropdown partage | Redux slice |
| onglet actif partage | Redux slice |
| recently used | Redux slice |
| donnees API | RTK Query |
| cache serveur | RTK Query |
| browser listener | hook common avec cleanup |

Si un composant a plus de 5-7 etats locaux coordonnant plusieurs zones, creer un slice avant d'ajouter plus d'etat.

### 2.6 Migration Des Routes App Router

Pour chaque route:

Avant:

```text
src/app/something/page.tsx
  -> gros composant client inline
```

Apres:

```text
src/app/something/page.tsx
  -> core/presentation/components/pages/Something/SomethingPage
```

Si client-only:

```tsx
const SomethingPage = dynamic(
  () => import("@/core/presentation/components/pages/Something/SomethingPage"),
  { ssr: false, loading: () => <Skeleton /> }
);
```

### 2.7 Migration Des Appels API

Avant:

```text
component -> fetch(...)
```

Apres:

```text
component -> hook presentation -> use case -> repository -> RTK Query endpoint -> /api/proxy
```

Exceptions:

- Route handlers serveur peuvent appeler des services serveur.
- Integrations tres locales peuvent rester directes seulement si documentees.

### 2.8 Validation Par Lot

Chaque lot doit etre validable:

```text
Lot 1: structure creee
Lot 2: store connecte
Lot 3: une feature migree
Lot 4: route App deleguee
Lot 5: legacy inutilise retire
```

Ne pas faire big bang sur un projet existant.

## Workflow 3: Documents A Generer Dans Le Projet Cible

Dans le projet cible, generer:

```text
docs/README.md
docs/architecture/documentation-gap-register.md
docs/architecture/development-guidelines.md
docs/architecture/project-operating-and-next-config.md
docs/app/README.md
docs/app/app-router-writing-rules.md
docs/core/domain/README.md
docs/core/domain/domain-writing-rules.md
docs/core/application/README.md
docs/core/application/use-case-writing-rules.md
docs/core/infrastructure/README.md
docs/core/infrastructure/infrastructure-writing-rules.md
docs/core/infrastructure/store/README.md
docs/core/infrastructure/store/api/README.md
docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md
docs/core/presentation/README.md
docs/core/presentation/components/README.md
docs/core/presentation/components/component-writing-rules.md
docs/core/presentation/hooks/README.md
docs/core/presentation/hooks/hook-writing-rules.md
```

Si le projet cible a deja une doc, ne pas l'ecraser. Ajouter une section:

```text
## Migration Clean Architecture
```

et un gap register.

## Workflow 4: Next Config

Si le projet n'a qu'un `next.config.ts`, creer progressivement:

```text
next.config.ts
next.config.base.ts
next.config.dev.ts
next.config.prod.ts
```

Regle:

```text
next.config.ts = routeur env
base = commun
dev = DX
prod = securite/perf prod
```

Avant toute modification, lire la doc Next locale.

## Workflow 5: Definition Of Done

Une materialisation est terminee quand:

- `src/app` est leger;
- `core/domain` existe et reste pur;
- `core/application/useCases` existe et depend du domaine;
- `core/infrastructure/store` configure Redux Toolkit + RTK Query;
- `core/infrastructure/repositories` mappe les contrats domaine vers API/mock;
- `core/presentation` contient providers, components et hooks;
- les donnees serveur passent par RTK Query;
- l'etat client partage passe par slices;
- les composants lourds client sont sous presentation;
- les docs et gap register existent;
- les commandes de verification ont ete lancees ou leur non-execution est signalee honnetement.

## Checklist Pour L'Agent LLM

Avant de coder:

- [ ] Ai-je lu `DEVELOPMENT_GUIDELINES.md` ou sa copie doc ?
- [ ] Ai-je lu la doc Next locale si je touche Next.js ?
- [ ] Ai-je cherche l'existant dans tout le projet ?
- [ ] Ai-je identifie greenfield vs migration existante ?
- [ ] Ai-je un plan par lots ?

Pendant:

- [ ] Je ne casse pas les routes existantes.
- [ ] Je ne mets pas de client lourd dans `app`.
- [ ] Je ne cree pas de `useState/useEffect` partage au lieu d'un slice.
- [ ] Je ne duplique pas les API calls.
- [ ] Je garde le domaine pur.

Apres:

- [ ] Docs mises a jour.
- [ ] Gap register mis a jour.
- [ ] Tests/lint/typecheck lances ou non-confirmes explicitement.
- [ ] Aucun commit sans ordre explicite.

## Anti Patterns

- Big bang migration d'un projet existant.
- Supprimer l'ancien code fonctionnel avant parite.
- Creer des composants dans `src/app` parce que c'est rapide.
- Mettre `'use client'` sur un layout entier.
- Ajouter `useState` partout pour piloter le shell.
- Appeler `fetch` directement depuis les composants.
- Importer RTK Query dans le domaine.
- Mettre des tokens dans Redux.
- Lazy-loader l'ossature visible.
- Confondre extraction de fichier et vrai code splitting.
- Dire "verifie" quand une commande a timeout.

## Phrase De Travail

```text
Je cherche d'abord l'existant, je preserve ce qui fonctionne, je cree la structure cible a cote, puis je migre feature par feature jusqu'a obtenir un App Router leger, un domaine pur, une application testable, une infrastructure RTK Query/Redux Toolkit claire, et une presentation composee de hooks/providers/composants reutilisables.
```
