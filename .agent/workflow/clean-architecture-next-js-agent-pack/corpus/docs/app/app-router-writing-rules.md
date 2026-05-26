# Regles Canoniques App Router

Date: 2026-05-22.

Ce document definit comment ecrire les fichiers sous `src/app`.

Sources Next.js locales consultees:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Principe Central

`src/app` est la surface Next.js: routage, layouts, pages, metadata, route handlers et fichiers conventionnels.

`src/app` doit rester leger. Les vrais composants interactifs, hooks, providers, widgets et layouts client lourds doivent vivre sous `src/core/presentation`.

## Regle Stricte: Pas De Client Lourd Dans `app`

Par defaut, les fichiers `page.tsx` et `layout.tsx` dans `src/app` doivent rester des Server Components.

Interdit dans `src/app/page.tsx` et `src/app/**/layout.tsx` sauf exception documentee:

- `'use client'`;
- `useState`;
- `useEffect`;
- logique de widget;
- orchestration Redux;
- appels API client;
- logique metier longue;
- composants de charting lourds directement inline.

Pattern attendu:

```tsx
import ClientWidget from "@/core/presentation/components/pages/Widget/ClientWidget";

export default function Page() {
  return <ClientWidget />;
}
```

Si le composant doit etre client-only et lourd:

```tsx
import dynamic from "next/dynamic";

const TechnicalAnalysis = dynamic(
  () => import("@/core/presentation/components/pages/Widget/TechnicalAnalysis/TechnicalAnalysis"),
  { ssr: false, loading: () => <PageContentSkeleton /> }
);

export default function TechnicalAnalysisRoute() {
  return <TechnicalAnalysis />;
}
```

## Pourquoi

Next.js garde les pages/layouts Server Components par defaut pour:

- reduire le JavaScript envoye au navigateur;
- accelerer le premier rendu;
- garder les secrets cote serveur;
- streamer le HTML plus tot;
- eviter que toute une branche devienne client bundle.

La directive `'use client'` cree une frontiere: tous les imports enfants du fichier deviennent partie du graphe client. Il faut donc la placer le plus bas possible.

## Pattern Actuel A Conserver

### Root page

`src/app/page.tsx` reste serveur et delegue:

```text
src/app/page.tsx
  -> core/presentation/components/pages/SplashPageAnimate/SplashPageLoader
```

### Home layout

`src/app/(Algoway)/home/layout.tsx` reste serveur et delegue:

```text
home/layout.tsx
  -> ClientHomeLayoutWrapper
    -> composants presentation
```

### Technical Analysis

`src/app/(Algoway)/home/(screens)/equity/technical-analysis/page.tsx` utilise un dynamic import client-only:

```text
page.tsx
  -> dynamic(...TechnicalAnalysis, { ssr: false, loading })
```

Ce pattern est correct pour un widget graphique lourd.

## Ou Mettre Quoi

| Besoin | Emplacement |
| --- | --- |
| Route publique | `src/app/**/page.tsx` |
| Layout serveur | `src/app/**/layout.tsx` |
| Metadata / viewport / sitemap | `src/app` |
| Route handler API | `src/app/api/**/route.ts` |
| Proxy / garde HTTP | `src/app/api/proxy` et `src/proxy.ts` |
| Composant interactif | `src/core/presentation/components` |
| Hook React | `src/core/presentation/hooks` |
| Provider global | `src/core/presentation/components/providers` |
| Etat client partage | `src/core/infrastructure/store/slices` |
| API client cachee | RTK Query sous `src/core/infrastructure/store/api` |

## Regle App Router + Redux Toolkit

Si une page App Router a besoin d'un etat interactif:

1. Garder la page/layout serveur.
2. Creer un enfant client dans `core/presentation`.
3. Si l'etat est partage, persistant entre composants, ou utile a plusieurs vues, le mettre dans un slice Redux Toolkit.
4. Si l'etat est purement local et ephemere, `useState` est autorise dans l'enfant client.
5. Si l'effet synchronise un systeme externe, `useEffect` est autorise dans l'enfant client.

## Exceptions Autorisees Dans `src/app`

Un fichier client dans `src/app` est acceptable seulement si:

- il est un wrapper minimal de route;
- il ne contient pas de logique metier;
- il delegue immediatement vers `core/presentation`;
- il est documente comme exception;
- aucune alternative serveur simple n'existe.

Exemples acceptables:

- `BootstrapClient.ts`: charge le bundle JS Bootstrap cote client.
- wrapper client tres fin pour une contrainte Next.js specifique.

## Checklist Avant Merge

- La page/layout est Server Component par defaut.
- Aucun `useState/useEffect` n'est ajoute dans `src/app` sans justification.
- Les widgets client vivent sous `core/presentation`.
- Les composants lourds sont charges par dynamic import si necessaire.
- L'etat partage est dans Redux Toolkit.
- Les routes API ne touchent pas React.
- Toute modification de routes App Router est suivie par `next typegen`.

## Ecarts Actifs

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| APP-ROUTER-GAP-001 | `ClientHomeLayoutWrapper.tsx` | Beaucoup d'etat local client et effets dans un wrapper lourd | Migrer les etats partages/long-lived vers un slice Redux Toolkit progressivement |
| APP-ROUTER-GAP-002 | `src/app` | Besoin de maintenir la discipline Server Component par defaut | Refuser les nouveaux `'use client'` dans `app` sans justification |
