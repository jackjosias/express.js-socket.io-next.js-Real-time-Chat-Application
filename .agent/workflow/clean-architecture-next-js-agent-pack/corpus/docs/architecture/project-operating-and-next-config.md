# Regles Projet Et Architecture Next Config

Date: 2026-05-21.

Ce document integre explicitement:

- `AGENTS.md`
- `DEVELOPMENT_GUIDELINES.md`
- `next.config.ts`
- `next.config.base.ts`
- `next.config.dev.ts`
- `next.config.prod.ts`

Il complete l'audit Clean Architecture et documente les regles projet + la configuration Next.js active.

## Sources Next.js Consultees

Avant de documenter cette configuration, les docs locales Next.js ont ete consultees:

- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/index.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/typedRoutes.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`

Raison: `AGENTS.md` impose de lire la documentation locale Next.js avant tout travail Next.js.

## `AGENTS.md`

`AGENTS.md` contient la regle projet suivante:

```text
Next.js: ALWAYS read docs before coding
Before any Next.js work, find and read the relevant doc in node_modules/next/dist/docs/.
```

Effet operationnel:

- toute modification ou documentation significative de `next.config*`, App Router, route handlers, proxy, images, metadata, cache, headers ou build Next.js doit commencer par la doc locale Next;
- la doc locale du package installe prime sur les souvenirs ou exemples externes;
- les changements Next.js doivent citer le fichier de doc locale lu dans la note de travail si le changement est non trivial.

## `DEVELOPMENT_GUIDELINES.md`

Copie documentaire complete:

```text
docs/architecture/development-guidelines.md
```

Cette guideline est une lecture obligatoire avant toute implementation. Elle fixe le comportement educatif attendu de l'IA et des contributeurs:

- chercher d'abord dans tout le codebase avant de creer;
- respecter DRY;
- explorer presentation, design system, hooks, infrastructure, domain, application, shared et lib;
- reutiliser, etendre ou refactoriser l'existant avant de creer;
- eviter les optimisations reflexes;
- appliquer les regles de memoization, lazy loading, code splitting, portals, fallback, verification honnete;
- suivre les conventions de commit FINFORM quand l'utilisateur demande un commit.

Regle pratique: aucun nouveau composant, hook, utilitaire, service, schema, type, API call ou logique metier ne doit etre cree sans avoir consulte cette guideline et recherche l'existant.

## Architecture Des Configs

```text
next.config.ts
  -> NODE_ENV === "production"
      -> next.config.prod.ts
      -> next.config.base.ts
  -> sinon
      -> next.config.dev.ts
      -> next.config.base.ts
```

`next.config.ts` est le point d'entree canonique consomme par Next.js. Il ne contient pas de configuration lourde; il choisit la variante selon `process.env.NODE_ENV`.

## `next.config.base.ts`

Responsabilites:

- options communes dev/prod;
- flags React/Next stables;
- configuration images;
- experimental config partagee;
- optimisation des imports packages lourds.

Options actives:

| Option | Role |
| --- | --- |
| `reactStrictMode: true` | Detecter plus tot les effets de bord React |
| `reactCompiler: true` | Activer le compilateur React supporte par la stack |
| `typedRoutes: true` | Typer les routes et liens internes |
| `experimental.viewTransition: true` | Activer les transitions natives quand possible |
| `experimental.optimizeCss: true` | Optimiser le CSS au build |
| `experimental.optimizePackageImports` | Optimiser les imports de librairies lourdes |
| `images.formats` | Autoriser AVIF/WebP |
| `images.minimumCacheTTL` | Cache images 30 jours |
| `images.deviceSizes` / `imageSizes` | Breakpoints image du projet |
| `images.remotePatterns` | Autoriser `companiesmarketcap.com` |

Regles:

- ne mettre ici que ce qui doit s'appliquer en dev et prod;
- ne pas ajouter de config experimentale sans verifier la doc locale Next;
- toute nouvelle dependance dans `optimizePackageImports` doit exister dans `package.json`;
- ne pas retirer `remotePatterns` sans verifier les usages images.

## `next.config.dev.ts`

Responsabilites:

- ameliorer la DX;
- accelerer les iterations;
- rendre les logs client visibles;
- reduire les effets de cache pendant le dev.

Options actives:

| Option | Role |
| --- | --- |
| `logging.browserToTerminal: true` | Forward des logs navigateur vers terminal dev |
| `experimental.serverComponentsHmrCache: false` | Eviter un cache HMR RSC trop agressif |
| `experimental.turbopackFileSystemCacheForDev: true` | Cache Turbopack disque en dev |
| `experimental.staleTimes.dynamic: 0` | Revalidation plus rapide des routes dynamiques |
| `experimental.staleTimes.static: 30` | Cache court pour routes statiques en dev |
| `headers()` images statiques | Cache immutable pour assets images |

Regles:

- garder les options DX dans `next.config.dev.ts`, pas dans prod;
- ne pas copier les headers de securite prod dans dev si cela ralentit le debug;
- ne pas desactiver les caches sans raison mesuree.

## `next.config.prod.ts`

Responsabilites:

- durcissement production;
- headers securite;
- compression;
- reduction d'exposition technique.

Options actives:

| Option | Role |
| --- | --- |
| `poweredByHeader: false` | Masquer `X-Powered-By: Next.js` |
| `compress: true` | Compression HTTP |
| `headers()` globaux | `nosniff`, `DENY`, HSTS, referrer policy |
| `headers()` images statiques | Cache immutable pour assets images |

Regles:

- tout header global doit etre verifie contre les besoins embarquement, iframe, OAuth et assets;
- garder HSTS uniquement si HTTPS est garanti sur le domaine cible;
- ne pas ajouter de CSP globale sans audit complet des scripts tiers (reCAPTCHA, Bootstrap, etc.).

## Regles De Modification

Avant de modifier `next.config*`:

1. Lire la doc locale pertinente sous `node_modules/next/dist/docs/`.
2. Identifier si l'option est commune, dev-only ou prod-only.
3. Modifier le bon fichier:
   - commun -> `next.config.base.ts`;
   - DX -> `next.config.dev.ts`;
   - securite/perf prod -> `next.config.prod.ts`;
   - routage d'environnement uniquement -> `next.config.ts`.
4. Verifier que l'option existe dans la version Next installee.
5. Documenter l'impact dans ce fichier si l'option change le build, les headers, le cache, les images ou la securite.

## Ecarts Et Points De Vigilance

| ID | Zone | Vigilance | Action |
| --- | --- | --- | --- |
| NEXT-GAP-001 | `next.config.base.ts` | Options `experimental.*` sensibles aux changements Next.js | Revalider a chaque upgrade Next |
| NEXT-GAP-002 | `next.config.prod.ts` | HSTS global suppose HTTPS stable | Confirmer domaine/proxy de production |
| NEXT-GAP-003 | `next.config.dev.ts` | `browserToTerminal: true` peut etre verbeux | Garder dev-only |
| NEXT-GAP-004 | `images.remotePatterns` | Domaine externe autorise | Verifier usages avant retrait ou ajout |
| NEXT-GAP-005 | `AGENTS.md` | Obligation doc Next locale avant travail Next | Maintenir cette regle dans les audits futurs |
