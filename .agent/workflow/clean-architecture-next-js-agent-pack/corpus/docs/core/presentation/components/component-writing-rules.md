# Regles Canoniques Des Composants Presentation

Derniere verification: 2026-05-21.

Ce document definit comment ecrire les composants sous `src/core/presentation/components`, avec un focus particulier sur `src/core/presentation/components/providers`.

Il complete:

- `docs/core/presentation/README.md`
- `docs/core/presentation/components/README.md`
- `docs/core/infrastructure/infrastructure-writing-rules.md`

## Principe Central

La presentation porte l'experience utilisateur. Elle compose les providers globaux, layouts, composants, widgets et interactions utilisateur.

```text
Autorise:
  presentation -> application use cases
  presentation -> infrastructure adapters/hooks typés
  presentation -> domain types
  presentation -> design-system
  presentation -> app client helpers si necessaire

Interdit:
  presentation -> logique metier profonde
  presentation -> secrets
  presentation -> appels backend directs si RTK Query/proxy existe
  presentation -> duplication de cache serveur
```

## Regle Forte: Etat Local Minimal

Les composants presentation ne doivent pas accumuler des `useState` / `useEffect` pour piloter un etat partage de shell ou de page.

Autorise en local:

- etat ephemere strictement local;
- champ de formulaire non partage;
- animation locale;
- mesure DOM locale;
- effet avec cleanup vers `window`, `document`, `navigator`.

Doit aller dans Redux Toolkit:

- dropdown global;
- modal globale;
- onglet/section actif partage;
- etat conserve entre navigations;
- liste recente ou preference partagee;
- coordination entre header/footer/main;
- etat passe a travers plusieurs niveaux de composants.

Les composants doivent consommer les slices via les hooks typés du store, pas recreer un mini-store avec props drilling et effets.

Les routes Next.js restent dans `src/app`. Les composants reels restent dans `core/presentation`.

## Carte Active Des Composants

```text
src/core/presentation/components/
├── providers/       providers globaux app
├── design-system/   composants communs, layouts, features
└── pages/           pages metier et widgets
```

## Providers: Point D'Entree

Le provider actif est:

```text
src/core/presentation/components/providers/AppProvider.wrapper.tsx
```

Il est monte dans:

```text
src/app/layout.tsx
```

Flux actif:

```text
RootLayout
  -> <AppProviders>
    -> <SessionProvider>
      -> <StoreProvider>
        -> <BootstrapThemeProvider>
          -> <ReCaptchaProvider>
            -> <TerminalTabsProvider>
              -> children
              -> <BootstrapClient />
```

## Providers: Ordre Canonique

### 1. `SessionProvider`

Source active: `next-auth/react`, directement dans `AppProvider.wrapper.tsx`.

Responsabilites:

- fournir le contexte NextAuth;
- refetch session toutes les 5 minutes;
- refetch au focus fenetre;
- ne pas refetch offline.

Regles:

- ne pas stocker les tokens dans Redux;
- garder la session au-dessus du store si des composants enfants ont besoin des deux contextes;
- ne pas dupliquer un autre `SessionProvider` global.

### 2. `StoreProvider`

Source:

```text
src/core/presentation/components/providers/StoreProvider.tsx
```

Responsabilites:

- creer une instance stable via `makeStore()`;
- exposer le store Redux Toolkit avec `<Provider>`;
- conserver le store dans `useRef` pour eviter les recreations client.

Regles:

- ne pas creer le store directement dans les composants metier;
- utiliser `useAppDispatch`, `useAppSelector`, `useAppStore` depuis `core/infrastructure/store/hooks`;
- ne pas mettre de logique metier dans `StoreProvider`;
- ne pas initialiser des donnees serveur sensibles ici.

### 3. `BootstrapThemeProvider`

Source:

```text
src/core/presentation/components/providers/Bootstrap-theme-provider.tsx
```

Responsabilites:

- stocker le theme Bootstrap courant;
- appliquer `data-bs-theme` sur `document.documentElement`;
- exposer `useTheme()`.

Regles:

- rester limite au theme UI;
- ne pas manipuler le store Redux pour un simple toggle local si le contexte suffit;
- ne pas faire de side effects hors theme.

### 4. `ReCaptchaProvider`

Source:

```text
src/core/presentation/components/providers/ReCaptchaProvider.tsx
```

Responsabilites:

- charger `react-google-recaptcha-v3`;
- utiliser `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`;
- fallback sans provider en developpement si la cle publique est absente.

Regles:

- seule la cle publique `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` peut etre lue cote client;
- la verification serveur reste dans l'infrastructure/securite;
- ne pas hardcoder de cle;
- ne pas bloquer tout le rendu en developpement quand la cle publique manque.

### 5. `TerminalTabsProvider`

Source:

```text
src/core/presentation/components/design-system/layouts/Home/HeaderHome/context/TerminalTabsContext
```

Responsabilites:

- fournir le contexte des onglets du terminal Home;
- rester proche du layout qui le consomme.

Regles:

- ne pas y stocker des donnees serveur;
- ne pas y dupliquer un cache RTK Query;
- si le contexte devient global non-Home, le deplacer vers un emplacement provider plus explicite.

### 6. `BootstrapClient`

Source:

```text
src/app/BootstrapClient.ts
```

Responsabilites:

- charger dynamiquement `bootstrap/dist/js/bootstrap.bundle.min.js`;
- executer ce chargement uniquement cote client.

Regles:

- garder ce composant sans rendu;
- ne pas y ajouter de logique app;
- capturer les erreurs de chargement sans casser toute l'UI.

## Service Worker

`AppProvider.wrapper.tsx` enregistre `/sw.js` uniquement en production.

Regles:

- ne pas enregistrer le service worker en developpement;
- garder le scope `/`;
- ne pas multiplier les registrations ailleurs;
- logger les erreurs sans bloquer l'application.

## Design System

Le dossier `design-system` contient des composants reutilisables.

Regles:

- `commons`: composants reutilisables transverses;
- `features`: composants metier reutilisables mais encore UI;
- `layouts`: composition UI de sections;
- eviter de faire importer `src/app` depuis le design-system;
- eviter les appels API directs depuis les composants communs.

## Pages Et Widgets

Le dossier `pages` contient les pages metier et widgets.

Regles:

- les widgets lourds doivent deleguer aux hooks et sous-composants;
- les widgets critiques doivent avoir une doc dediee;
- les pages ne doivent pas recréer des providers globaux;
- les pages peuvent orchestrer use cases, hooks infrastructure et composants UI.

## Frontieres Avec Les Autres Couches

### Presentation -> Application

Autorise pour executer une intention metier:

```text
useCommandsHook -> createCommandUseCase(repository)
```

### Presentation -> Infrastructure

Autorise pour:

- adapters repository;
- hooks store typés;
- providers techniques;
- selecteurs et dispatchs Redux.

Mais:

- ne pas appeler directement `fetch('/api/proxy/...')` si un endpoint RTK Query existe;
- ne pas manipuler les URLs backend finales;
- ne pas exposer de secrets.

### Presentation -> Domain

Autorise pour:

- types;
- schemas de formulaire si le schema est vraiment partage;
- enums d'affichage.

Si le schema devient purement UI, il doit etre localise cote presentation.

## Checklist Avant Merge

- Le composant est client seulement si necessaire (`'use client'`).
- Les providers globaux sont ajoutes dans `AppProvider.wrapper.tsx`, pas disperses dans les pages.
- L'ordre des providers est justifie.
- Aucun token ou secret n'est stocke dans un provider client.
- Les composants utilisent les hooks typés Redux.
- Les appels serveur passent par use cases / repositories / RTK Query / proxy.
- Les composants communs ne contiennent pas de logique metier profonde.
- Les widgets lourds ont une documentation dediee ou un gap documente.

## Ecarts Actifs A Corriger

Ces ecarts sont connus au 2026-05-21.

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| PRES-GAP-001 | `providers/sessionProvider.tsx` | Wrapper `SessionProviderWrapper` non reference par l'arbre actif | Supprimer/archiver si confirme inutilise |
| PRES-GAP-002 | `AppProvider.wrapper.tsx` | `SessionProvider` est importe directement alors qu'un wrapper legacy existe | Garder une seule strategie de session provider |
| PRES-GAP-003 | `AppProvider.wrapper.tsx` | Enregistrement service worker dans provider global | Conserver si voulu, mais eviter toute duplication ailleurs |
| PRES-GAP-004 | `providers` | Providers peu documentes individuellement dans le code | Garder cette doc comme source canonique et ajouter commentaires seulement si necessaire |
| PRES-GAP-005 | `components/pages/Widget/*` | Documentation dediee surtout pour Technical Analysis, widgets secondaires peu documentes | Ajouter README dedies au fil des changements non triviaux |
