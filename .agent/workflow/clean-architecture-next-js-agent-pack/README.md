# Clean Architecture Next.js Agent Pack

Ce dossier est un pack portable pour un nouvel agent LLM IDE. Il evite de copier-coller un long prompt: copie ce dossier dans un projet cible, puis demande a l'agent de lire `00-READ-FIRST.md`.

## Point D'Entree

Le premier fichier a lire est:

```text
00-READ-FIRST.md
```

Il impose les phases d'ingestion et les gates avant implementation.

## Lecture Obligatoire

Avant toute implementation, l'agent doit lire dans cet ordre:

```text
00-READ-FIRST.md
README.md
invocation.md
WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD
corpus/AGENTS.md
corpus/DEVELOPMENT_GUIDELINES.md
corpus/docs/README.md
corpus/docs/architecture/development-guidelines.md
corpus/docs/architecture/project-operating-and-next-config.md
corpus/docs/app/app-router-writing-rules.md
corpus/docs/core/domain/domain-writing-rules.md
corpus/docs/core/application/use-case-writing-rules.md
corpus/docs/core/infrastructure/infrastructure-writing-rules.md
corpus/docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md
corpus/docs/core/presentation/components/component-writing-rules.md
corpus/docs/core/presentation/hooks/hook-writing-rules.md
```

## Si Le Projet Cible Utilise Next.js

L'agent doit aussi lire la documentation Next locale installee dans le projet cible:

```text
node_modules/next/dist/docs/
```

Avant tout travail sur:

- `src/app`;
- `app/`;
- `next.config*`;
- route handlers;
- proxy;
- headers;
- images;
- cache;
- Server Components;
- Client Components;
- App Router.

## Regle Centrale

L'agent doit chercher d'abord, coder ensuite. Il doit preferer reutiliser, etendre ou refactoriser l'existant avant de creer quoi que ce soit.

## Structure Du Pack

```text
clean-architecture-next-js-agent-pack/
├── 00-READ-FIRST.md
├── README.md
├── invocation.md
├── WORFLOW-CLEAN-ARCHITECTURE-NEXT-JS.MD
└── corpus/
    ├── AGENTS.md
    ├── DEVELOPMENT_GUIDELINES.md
    └── docs/
        ├── README.md
        ├── architecture/
        ├── app/
        └── core/
```

## Statut

Ce pack est une copie documentaire. Les fichiers originaux restent les sources du projet Algoway. Si les originaux changent, regenerer ou resynchroniser ce dossier.
