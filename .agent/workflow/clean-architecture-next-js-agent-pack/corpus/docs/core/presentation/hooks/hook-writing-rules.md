# Regles Canoniques Des Hooks Presentation

Derniere verification: 2026-05-21.

Ce document definit comment ecrire les hooks sous `src/core/presentation/hooks`.

Il complete:

- `docs/core/presentation/hooks/README.md`
- `docs/core/presentation/components/component-writing-rules.md`
- `docs/core/application/use-case-writing-rules.md`
- `docs/core/infrastructure/infrastructure-writing-rules.md`

## Principe Central

Un hook de presentation orchestre l'experience UI. Il peut composer React state/effects, use cases, repositories, providers, hooks store typés et hooks RTK Query exposes par l'infrastructure.

Il ne doit pas devenir une deuxieme couche metier.

```text
Autorise:
  hooks -> application use cases
  hooks -> infrastructure adapters
  hooks -> infrastructure RTK Query hooks si le hook est explicitement un hook d'integration
  hooks -> domain types
  hooks -> providers/context presentation
  hooks -> browser APIs avec garde client

Interdit:
  hooks -> secrets
  hooks -> API_TARGET_*
  hooks -> fetch direct si un endpoint RTK Query/proxy existe
  hooks -> duplication durable du cache RTK Query
  hooks -> logique metier profonde
```

## Regle Forte: Ne Pas Semer `useState` / `useEffect` Partout

Un hook ou composant peut utiliser `useState` et `useEffect`, mais seulement pour un etat local, ephemere, ou une synchronisation avec un systeme externe.

Si l'etat est partage, durable, rehydrate, necessaire a plusieurs composants, ou sert a coordonner un shell applicatif, il doit etre deplace vers Redux Toolkit.

Decision rapide:

| Situation | Choix |
| --- | --- |
| champ local d'un formulaire isole | `useState` local |
| hover/dropdown strictement local | `useState` local |
| listener `online/offline`, timer, geolocation | `useEffect` avec cleanup |
| cache serveur / donnees API | RTK Query |
| shell UI partage: footer actif, dropdown global, modal globale, recent items | slice Redux Toolkit |
| etat utilise par plusieurs widgets/pages | slice Redux Toolkit |
| etat a conserver pendant navigation | slice Redux Toolkit |

Regle: si un etat local commence a etre passe a plus de deux niveaux, duplique dans plusieurs hooks, ou synchronise par effets, il doit etre extrait vers un slice.

## Carte Active

```text
src/core/presentation/hooks/
├── common/      hooks transverses UI/browser
├── pages/       hooks par page, feature ou domaine UI
└── useReCaptcha.ts
```

## Familles De Hooks

### 1. Hooks Transverses

Exemples:

```text
common/useDelayedLoader.ts
common/useNetworkStatus.ts
common/useSessionAutoRefresh.ts
```

Responsabilites:

- encapsuler un comportement UI/browser reutilisable;
- exposer un etat simple;
- nettoyer les listeners/intervals dans `useEffect`;
- eviter les dependances metier.

Regles:

- guarder `window`, `navigator`, `document` avec `typeof`;
- nettoyer tout event listener;
- eviter les side effects globaux non documentes;
- garder le retour minimal.

### 2. Hooks D'Orchestration Clean Architecture

Exemples:

```text
pages/Home/useCommandsHooks.ts
pages/Auth/Signin/useUser/useUserMutationsHooks.ts
pages/Auth/Signin/useUser/useUserQueriesHooks.ts
pages/Auth/Signup/useCompany/useCompanyMutationsHooks.ts
```

Pattern attendu:

```text
hook presentation
  -> obtient un repository via adapter infrastructure
  -> construit les use cases application avec useMemo
  -> expose des callbacks stables avec useCallback
  -> retourne un view model simple pour le composant
```

Regles:

- l'adapter repository est le point d'entree infrastructure;
- les mutations passent par les use cases application;
- les queries peuvent exposer les donnees reactives du repository si le contrat actuel le demande;
- ne pas importer une implementation concrete `*.createapi.repository.impl.ts` directement depuis un hook UI;
- ne pas construire d'URL;
- ne pas dupliquer les validations Zod deja faites par les use cases.

### 3. Hooks D'Integration RTK Query Directe

Exemple:

```text
pages/Home/useFetchLocation-geolocation-weather.ts
```

Ce hook utilise des lazy queries RTK Query geo directement, car il orchestre plusieurs providers externes de geolocalisation, fallback IP, geolocation precise navigateur et meteo.

Regles:

- nommer clairement le hook comme hook d'integration;
- utiliser les hooks RTK Query fournis par l'infrastructure;
- ne jamais appeler les APIs externes en direct;
- garder la logique de fallback lisible;
- nettoyer timers et effets;
- ne pas stocker de donnees sensibles;
- documenter tout ordre de fallback provider.

### 4. Hooks De Contexte Presentation

Exemple:

```text
pages/Auth/Signup/useSignupForm.ts
```

Responsabilites:

- lire un contexte React;
- lever une erreur claire si le provider manque;
- ne pas embarquer de logique metier.

Pattern attendu:

```typescript
const context = useContext(SomeContext);
if (context === undefined) {
  throw new Error("useX doit etre utilise dans XProvider");
}
return context;
```

### 5. Hooks Provider/Service Client

Exemple:

```text
useReCaptcha.ts
```

Responsabilites:

- encapsuler une lib client;
- exposer `isLoading`, `error`, `isReady`, `execute`;
- garder les details de la lib hors des composants.

Regles:

- lire uniquement des variables publiques `NEXT_PUBLIC_*` cote client;
- ne pas hardcoder de token de production;
- limiter les fallbacks dev;
- ne pas conserver un bypass dev en production;
- documenter tout mode degrade.

## `'use client'`

Tout hook utilisant React state/effect, navigateur, NextAuth client, reCAPTCHA ou RTK Query hooks doit etre execute dans un contexte client.

Regles:

- ajouter `'use client'` si le fichier est consomme directement par un Server Component ou depend d'APIs client;
- ne pas ajouter `'use client'` dans un fichier purement type-only;
- les hooks appeles uniquement par des composants client peuvent rester sans directive si l'arbre garantit deja le client, mais la directive explicite est preferable pour les hooks browser.

## Retour D'Un Hook

Le retour doit etre un view model stable:

```typescript
return {
  data,
  isLoading,
  error,
  action,
};
```

Regles:

- exposer des noms orientés UI (`isLoading`, `isFetching`, `errorType`);
- cacher les details RTK Query si le composant n'en a pas besoin;
- exposer `refetch` seulement si l'UI a une vraie action de retry;
- memoriser les callbacks exposes avec `useCallback`;
- utiliser `useMemo` pour les objets couteux ou les use cases construits depuis repository.

## Gestion D'Erreur

Regles:

- transformer les erreurs techniques en etats UI simples si possible;
- ne pas afficher/logguer des payloads sensibles;
- separer `error` query et `mutationError` quand les deux existent;
- eviter de propager des types RTK Query bruts dans les composants de design-system.

## Effects Et Boucles

Regles:

- tout `setInterval` doit etre nettoye;
- tout listener doit etre retire;
- ne pas utiliser `useEffect` pour simuler un store global;
- ne pas utiliser une cascade de `useState` quand un slice Redux Toolkit peut representer l'etat;
- les fetchs au mount doivent etre proteges par `useRef` si le double render peut les relancer;
- les dependances `useEffect` doivent etre completes;
- eviter les effets qui dispatchent en boucle sans garde.

## Frontieres Avec Les Couches

### Hooks -> Application

Autorise pour les intentions metier:

```text
useCommandsHook -> createCommandUseCase(repository)
```

### Hooks -> Infrastructure

Autorise pour:

- adapters repository;
- hooks RTK Query deja exportes par infrastructure;
- hooks store typés;
- providers techniques.

Mais:

- ne pas importer `baseApi`, `baseQuery`, `configureStore`;
- ne pas creer d'endpoint RTK Query dans presentation;
- ne pas pointer vers `API_TARGET_*`.

### Hooks -> Domain

Autorise pour:

- types de payload;
- params;
- enums;
- schemas de formulaire partages.

## Checklist Avant Merge

- Le hook a une responsabilite claire.
- Le hook ne fait pas de fetch direct si RTK Query/proxy existe.
- Les callbacks exposes sont stables.
- Les effects nettoient listeners/intervals.
- Les browser APIs sont gardees par `typeof`.
- Le hook ne stocke pas de secret.
- Les mutations passent par les use cases quand la famille a un use case.
- Les hooks RTK Query directs sont limites aux hooks d'integration documentes.
- Le retour du hook est comprehensible par le composant consommateur.

## Ecarts Actifs A Corriger

Ces ecarts sont connus au 2026-05-21.

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| HOOK-GAP-001 | `docs/core/presentation/hooks/genèse_...doc` | Document historique non canonique | Convertir en `.md` ou archiver |
| HOOK-GAP-002 | `useCommandsHooks.ts` | Typage local `RTKQueryError` dans presentation | Remplacer apres correction domaine par un type d'erreur neutre |
| HOOK-GAP-003 | `useFetchLocation-geolocation-weather.ts` | Hook d'integration volumineux avec plusieurs fallbacks et effets | Garder documente ou extraire le fallback provider si le hook grossit |
| HOOK-GAP-004 | `useReCaptcha.ts` | Fallback dev retourne `DEV_BYPASS_RECAPTCHA_TOKEN` avec note temporaire | Verifier que le bypass ne peut pas etre accepte en production |
| HOOK-GAP-005 | `useNetworkStatus.ts` | Hook transverse affiche directement des toasts | Accepter pour UX globale ou rendre le notifier injectable si reutilisation stricte requise |
| HOOK-GAP-006 | `ClientHomeLayoutWrapper.tsx` et hooks associes | Plusieurs etats UI shell sont encore locaux | Migrer les etats partages/long-lived vers Redux Toolkit slice |
