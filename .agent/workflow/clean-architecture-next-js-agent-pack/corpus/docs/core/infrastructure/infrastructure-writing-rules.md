# Regles Canoniques D'Ecriture De L'Infrastructure

Derniere verification: 2026-05-21.

Ce document definit comment ecrire les fichiers sous `src/core/infrastructure`, avec un accent particulier sur `src/core/infrastructure/store`.

Il complete:

- `docs/core/infrastructure/README.md`
- `docs/core/infrastructure/store/README.md`
- `docs/core/infrastructure/store/api/rtk-query-to-proxy-flow.md`

## Principe Central

La couche `infrastructure` contient les details techniques. Elle implemente les contrats du domaine et fournit les outils concrets aux use cases et a la presentation.

```text
Autorise:
  infrastructure -> core/domain
  infrastructure -> libraries techniques
  infrastructure -> shared utils techniques

Interdit:
  infrastructure -> logique UI
  infrastructure -> composants React de presentation
  infrastructure -> use cases application
  infrastructure -> secrets hardcodes
```

Exception active connue: `store/index.ts` importe aujourd'hui le slice `technicalAnalysis` depuis `src/core/presentation/components/pages/Widget/TechnicalAnalysis/store/technicalAnalysisSlice.ts`. Cette exception existe pour connecter un etat UI volumineux au store global. Elle doit rester documentee et ne doit pas devenir un precedent pour importer d'autres modules presentation sans decision explicite.

## Carte Active

```text
src/core/infrastructure/
├── repositories/        adapters et implementations API/mock des repositories domaine
├── security/            rate limiting, recaptcha, protections runtime
└── store/               Redux Toolkit, RTK Query, slices, hooks typés
```

## Store: Source De Verite

Le store actif est cree par:

```text
src/core/infrastructure/store/index.ts
```

Il configure:

```text
reducer:
  [baseApi.reducerPath]: baseApi.reducer
  auth: authReducer
  technicalAnalysis: technicalAnalysisReducer

middleware:
  getDefaultMiddleware(...)
    .concat(baseApi.middleware)

types:
  AppStore
  RootState
  AppDispatch
```

## Store: Regles De Configuration

### `makeStore`

Le store doit etre cree via une fonction:

```typescript
export const makeStore = () => configureStore(...)
```

Raison: en Next.js, le store doit pouvoir etre instancie proprement par contexte de rendu. Eviter un singleton global non controle.

### Reducers

Regles:

- monter `baseApi.reducer` sous `[baseApi.reducerPath]`;
- monter les slices Redux sous des cles stables (`auth`, `technicalAnalysis`, etc.);
- ne pas monter plusieurs instances RTK Query concurrentes sans raison forte;
- ne pas stocker de token sensible dans Redux.

### Middleware

Regles:

- toujours concatener `baseApi.middleware`;
- garder les exceptions `serializableCheck` et `immutableCheck` strictement ciblees;
- ne jamais desactiver globalement les checks Redux Toolkit sans justification documentee;
- documenter tout `ignoredActions` ou `ignoredPaths`.

Exception actuelle:

```text
ignoredActions: ["technicalAnalysis/updateMarketData"]
ignoredPaths: ["technicalAnalysis.marketData"]
```

Justification: gros tableaux de candles, verification dev trop couteuse, risque de freeze UI.

## Store Hooks

Les hooks typés vivent dans:

```text
src/core/infrastructure/store/hooks.ts
```

Pattern actif:

```typescript
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

Regles:

- les composants doivent utiliser ces hooks typés;
- ne pas importer `useDispatch` ou `useSelector` brut dans la presentation si les hooks typés suffisent;
- ne pas mettre de logique metier dans `hooks.ts`.

## RTK Query: `baseApi`

Source:

```text
src/core/infrastructure/store/api/rtkApi-query/baseApi.ts
```

Responsabilites:

- creer l'instance `createApi`;
- definir `reducerPath: "api"`;
- utiliser `baseQueryWithRetry`;
- declarer tous les `tagTypes`;
- definir les politiques globales `refetchOnFocus` et `refetchOnReconnect`;
- rester vide cote endpoints: `endpoints: () => ({})`.

Regles:

- chaque nouveau tag utilise par un endpoint doit etre ajoute dans `tagTypes`;
- chaque famille endpoint doit utiliser `baseApi.injectEndpoints`;
- ne pas creer un `createApi` par famille sans justification;
- garder les policies globales lisibles et documentees.

## RTK Query: `baseQuery`

Source:

```text
src/core/infrastructure/store/api/rtkApi-query/baseQuery.ts
```

Responsabilites:

- configurer `fetchBaseQuery({ baseUrl: "/api/proxy" })`;
- centraliser le retry conditionnel;
- refuser le retry sur les erreurs 4xx;
- limiter les retries aux erreurs reseau ou serveur;
- logger les erreurs en developpement sans exposer de secrets.

Regles:

- ne jamais pointer directement vers une URL backend externe depuis `baseQuery`;
- ne pas retenter les erreurs client 4xx;
- ne pas ajouter de logique metier ici;
- ne pas ajouter de token client ici: le proxy gere l'injection serveur.

## API Config

Source:

```text
src/core/infrastructure/store/api/config.ts
```

Responsabilites:

- definir `baseUrl: "/api/proxy"`;
- definir les identifiants API (`authApiId`, `githubRawId`, etc.);
- definir les routes publiques;
- definir les methodes qui imposent un slash final cote proxy.

Regles:

- les identifiants doivent correspondre a `proxyConfig.apiTargets`;
- ne jamais exposer `API_TARGET_*` au client;
- garder les routes publiques minimales;
- standardiser les chemins publics sans slash final si le proxy attend cette forme.

## Endpoints RTK Query

Sources:

```text
src/core/infrastructure/store/api/rtk-endpoints/user/user.api.ts
src/core/infrastructure/store/api/rtk-endpoints/company/company.api.ts
src/core/infrastructure/store/api/rtk-endpoints/command/command.api.ts
src/core/infrastructure/store/api/rtk-endpoints/geo/geo.api.ts
```

Regles:

- importer les types depuis `core/domain/types`;
- injecter dans `baseApi`;
- declarer `providesTags` pour les queries cacheables;
- declarer `invalidatesTags` pour les mutations qui changent les donnees;
- utiliser `apiConfig.<id>` pour construire le chemin proxy logique;
- ne pas construire d'URL backend finale;
- ne pas importer de composant React;
- ne pas melanger schema validation et endpoint: la validation appartient aux use cases ou aux schemas domaine.

Pattern attendu:

```typescript
export const commandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCommands: builder.query<Response, Params | void>({
      query: (params) => ({
        url: `/${apiConfig.authApiId}/commands/`,
        method: "GET",
        params: params || {},
      }),
      providesTags: ...
    }),
  }),
});
```

## Cache Et Invalidation

RTK Query cache par:

```text
endpoint + arguments serialises
```

Regles:

- toute liste doit fournir un tag `LIST`;
- tout item doit fournir un tag par `id` si la reponse contient des ids;
- creation: invalider `LIST` sauf cas explicitement documente;
- update: invalider l'item et souvent `LIST`;
- delete: invalider l'item et `LIST`;
- ne pas refetch manuellement depuis les composants si les tags suffisent.

Exception actuelle connue:

```text
createCompany.invalidatesTags est commente
```

Raison documentee dans le code: eviter une requete GET parasite apres inscription. Cette exception doit rester explicite.

## Slices Redux

Les slices Redux doivent stocker uniquement l'etat client qui n'est pas mieux gere par RTK Query.

Bon usage:

- session UI non sensible;
- preferences locales;
- etat de widget;
- donnees volumineuses gerees explicitement si RTK Query n'est pas adapte.
- etat UI partage ou long-lived qui evite une proliferation de `useState` / `useEffect`;
- coordination de shell applicatif: footer actif, dropdown actif, modal globale, recently used, etats de panneaux.

Mauvais usage:

- dupliquer un cache serveur deja gere par RTK Query;
- stocker des access tokens;
- stocker des secrets;
- copier des responses API entieres sans raison;
- melanger etat UI et logique metier.

`auth.slice.ts` suit une bonne regle: il ne stocke pas les tokens.

Regle de migration: quand un composant client accumule plusieurs etats locaux qui coordonnent des zones differentes de l'UI, creer un slice dedie avant d'ajouter de nouveaux `useState`.

## Thunks

RTK Query remplace la plupart des thunks CRUD.

Regles:

- ne pas creer un thunk pour un CRUD deja couvert par RTK Query;
- reserver les thunks a une orchestration client locale qui ne rentre pas dans RTK Query;
- si un thunk devient vide ou obsolète, l'archiver ou le supprimer lors d'un refactor dedie.

## Repositories Infrastructure

Les repositories infrastructure font le pont entre les contrats domaine et les outils concrets.

Pattern actif:

```text
*.repository.adapter.ts
*.createapi.repository.impl.ts
*.mock.repository.impl.ts
```

Regles:

- l'adapter choisit API ou mock;
- les hooks API et mock doivent etre appeles inconditionnellement si ce sont des hooks React;
- l'implementation API peut utiliser les hooks RTK Query;
- l'implementation mock doit respecter le meme contrat domaine;
- la conversion d'erreurs infrastructure vers erreurs domaine doit se faire ici;
- ne pas mettre de logique UI dans les repositories.

## Securite Infrastructure

Sources:

```text
security/rate/in-memory-rate-limiter.ts
security/rate/redis-rate-limiter.ts
security/recaptcha/verifyRecaptchaToken.ts
```

Regles:

- ne pas hardcoder de secret;
- detecter les placeholders de configuration;
- prevoir un fallback local uniquement si le mode de degradation est explicite;
- ne pas laisser un fail-open silencieux sur une protection critique.

## Checklist Avant Merge

- `store/index.ts` monte `baseApi.reducer` et `baseApi.middleware`.
- Aucun token sensible n'est stocke dans Redux.
- Les endpoints passent par `/api/proxy`.
- Les endpoints utilisent les types du domaine.
- Les nouveaux tags sont declares dans `baseApi.tagTypes`.
- Les mutations ont une strategie d'invalidation documentee.
- Les slices ne dupliquent pas inutilement le cache RTK Query.
- Les adapters appellent les hooks inconditionnellement.
- Les mocks respectent le meme contrat que l'API.
- Les exceptions architecturales sont documentees.

## Ecarts Actifs A Corriger

Ces ecarts sont connus au 2026-05-21.

| ID | Zone | Probleme | Correction attendue |
| --- | --- | --- | --- |
| INFRA-GAP-001 | `store/index.ts` | Le store importe `technicalAnalysisSlice` depuis `core/presentation` | Deplacer le slice vers `core/infrastructure/store/slices` ou documenter durablement cette exception |
| INFRA-GAP-002 | `store/slices/command.slice.ts` | Fichier vide ou non significatif | Supprimer/archiver si inutilise ou implementer clairement |
| INFRA-GAP-003 | `store/thunks/command.thunk.ts` | Fichier vide ou legacy | Supprimer/archiver si RTK Query couvre le besoin |
| INFRA-GAP-004 | `store/states/command.state.ts` | Interface `CommandState` contient `users: CommandType[]` | Renommer en `commands` si ce state redevient actif |
| INFRA-GAP-005 | `company.api.ts` | `createCompany.invalidatesTags` desactive volontairement | Garder la justification ou remplacer par une invalidation controlee quand le flux inscription est stabilise |
