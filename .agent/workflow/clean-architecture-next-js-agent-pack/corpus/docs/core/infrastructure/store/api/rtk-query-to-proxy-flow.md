# Flux Canonique RTK Query Vers `/api/proxy`

Derniere verification: 2026-05-21.

Ce document est la source canonique pour le flux `Presentation -> Application -> Infrastructure -> RTK Query -> Proxy HTTP` sur la famille `command`. Il decrit l'etat actif de `src`, pas les notes historiques.

## Resume Executif

```text
Composant UI
  -> useCommandsHook()
    -> useAdapterCommandRepository(params)
      -> useCommandApiRepository(params)
        -> useGetAllCommandsQuery(params)
          -> commandApi.injectEndpoints(...)
            -> baseApi
              -> baseQueryWithRetry
                -> fetchBaseQuery({ baseUrl: "/api/proxy" })
                  -> /api/proxy/1/commands/
                    -> src/app/api/proxy/[...path]/route.ts
                      -> API_TARGET_1 + /commands/
```

Le composant React ne connait jamais l'URL backend finale. Il pilote un hook de presentation. Le hook injecte un repository concret dans les use cases. Le repository concret utilise les hooks RTK Query. RTK Query appelle le proxy interne Next.js. Le proxy resout ensuite l'identifiant `1` vers `API_TARGET_1`.

## Fichiers Actifs

| Etape | Fichier | Responsabilite |
| --- | --- | --- |
| Hook de presentation | `src/core/presentation/hooks/pages/Home/useCommandsHooks.ts` | Expose l'API ergonomique pour l'UI et gere les `params` de liste |
| Adapter repository | `src/core/infrastructure/repositories/command/command.repository.adapter.ts` | Choisit API ou mock sans changer le hook UI |
| Repository API | `src/core/infrastructure/repositories/command/command.createapi.repository.impl.ts` | Appelle les hooks RTK Query et respecte `ICommandRepository` |
| Endpoint RTK Query | `src/core/infrastructure/store/api/rtk-endpoints/command/command.api.ts` | Declare les queries, mutations, tags et invalidations |
| Base API RTK Query | `src/core/infrastructure/store/api/rtkApi-query/baseApi.ts` | Configure `createApi`, `reducerPath`, `tagTypes`, refetch policies |
| Base query | `src/core/infrastructure/store/api/rtkApi-query/baseQuery.ts` | Prefixe `/api/proxy` et applique le retry conditionnel |
| Config API cliente | `src/core/infrastructure/store/api/config.ts` | Definit `baseUrl: "/api/proxy"` et `authApiId: "1"` |
| Store Redux | `src/core/infrastructure/store/index.ts` | Monte `baseApi.reducer` et `baseApi.middleware` |
| Proxy HTTP | `src/app/api/proxy/[...path]/route.ts` | Valide, rate-limit, cache, injecte le token et relaie vers la cible |
| Config proxy | `src/app/api/proxy/config.ts` | Mappe `1` vers `process.env.API_TARGET_1` |

## Detail Du Flux

### 1. Presentation: `useCommandsHook`

`useCommandsHook` maintient les parametres de requete:

```text
{ page: 1, page_size: 40 }
```

Quand `searchCommands(searchTerm)` est appele, le hook met a jour les `params`. Ce changement declenche declarativement une nouvelle requete RTK Query via le repository. Il n'y a pas de `fetch` manuel dans le composant.

Le hook expose a l'UI:

- `flattenedCommands`
- `paginatedCommands`
- `isLoading`
- `isFetching`
- `error`
- `errorType`
- `createNewCommand`
- `updateExistingCommand`
- `deleteExistingCommand`
- `refetchAllCommands`

### 2. Application: use cases purs

Le hook construit les use cases avec le repository injecte:

```text
createCommandUseCase(commandRepository)
updateCommandUseCase(commandRepository)
deleteCommandUseCase(commandRepository)
getCommandByIdUseCase(commandRepository)
getAllCommandsUseCase(commandRepository)
```

La couche `application` ne depend pas de RTK Query, React, Redux, `fetch`, ni du proxy. Elle depend du contrat domaine `ICommandRepository`.

### 3. Infrastructure: adapter API ou mock

`useAdapterCommandRepository(params)` appelle toujours:

```text
useCommandApiRepository(params)
useCommandMockRepository()
```

Puis il retourne le repository mock seulement si:

```text
NEXT_PUBLIC_USE_MOCK_API === "true"
```

Cette forme respecte les regles des hooks React: les hooks sont appeles de maniere inconditionnelle, le choix se fait apres.

### 4. Repository API: hooks RTK Query

`useCommandApiRepository(params)` connecte le contrat domaine aux hooks RTK Query:

```text
useGetAllCommandsQuery(params)
useGetCommandByIdQuery({ id }, { skip })
useCreateCommandMutation()
useUpdateCommandMutation()
useDeleteCommandMutation()
```

Le repository convertit ces hooks en surface compatible `ICommandRepository`: donnees, loading states, erreurs, mutations et `refetchAllCommands`.

### 5. Endpoint RTK Query: URL logique

`command.api.ts` injecte ses endpoints dans `baseApi`.

Pour la liste:

```text
GET /1/commands/
```

Le `1` vient de:

```text
apiConfig.authApiId = "1"
```

La requete finale cote navigateur devient:

```text
/api/proxy/1/commands/?page=1&page_size=40
```

car `baseQuery.ts` configure:

```text
fetchBaseQuery({ baseUrl: apiConfig.baseUrl })
apiConfig.baseUrl = "/api/proxy"
```

## Cache RTK Query

RTK Query cree un cache normalise par endpoint + arguments. Pour `getAllCommands`, la cle de cache varie selon les `params`.

Exemples:

```text
getAllCommands({ page: 1, page_size: 40 })
getAllCommands({ search_param: "abc", page: 1, page_size: 40 })
```

Ces deux appels ne partagent pas la meme entree de cache, car leurs arguments different.

### Duree De Conservation

`getAllCommands` declare:

```text
keepUnusedDataFor: 300
```

Une entree de cache inutilisee reste disponible pendant 300 secondes. Si l'utilisateur revient sur les memes `params` pendant cette fenetre, RTK Query peut servir les donnees deja connues tout en gerant un refetch si la politique le demande.

### Refetch Automatique

`baseApi.ts` active:

```text
refetchOnFocus: true
refetchOnReconnect: true
```

Effet pratique:

- retour focus navigateur -> donnees rafraichies;
- reconnexion reseau -> donnees rafraichies;
- cache conserve -> moins de requetes inutiles;
- UI reactive -> l'ancien resultat peut rester affichable pendant `isFetching`.

## Invalidation De Cache

`command.api.ts` utilise le tag RTK Query `Commands`.

### Lecture

`getAllCommands` fournit:

```text
{ type: "Commands", id: "LIST" }
{ type: "Commands", id: command.id }
```

Chaque commande recue fournit son propre tag. La liste fournit aussi le tag special `LIST`.

### Creation

`createCommand` invalide:

```text
{ type: "Commands", id: "LIST" }
```

Effet: apres creation, les listes de commandes concernees deviennent stale et RTK Query peut les refetch.

### Mise A Jour

`updateCommand` invalide:

```text
{ type: "Commands", id }
```

Effet: le detail ou les listes qui dependent de cette commande sont rafraichis selon leurs abonnements actifs.

### Suppression

`deleteCommand` invalide:

```text
{ type: "Commands", id }
{ type: "Commands", id: "LIST" }
```

Effet: la commande supprimee et les listes sont marquees stale. C'est le bon comportement pour eviter une ligne fantome dans l'UI.

## Retry Et Gestion D'Erreur

`baseQueryWithRetry` enveloppe `fetchBaseQuery`.

Regle active:

- pas de retry sur les erreurs `4xx`;
- jusqu'a 2 retries sur erreurs reseau ou `5xx`;
- logging detaille en developpement.

Pourquoi: un `400`, `401`, `403` ou `404` indique une requete invalide ou interdite. La retenter ne corrige rien. Une erreur reseau ou serveur peut etre transitoire.

## Passage Dans Le Proxy

La requete:

```text
/api/proxy/1/commands/
```

arrive dans:

```text
src/app/api/proxy/[...path]/route.ts
```

Le proxy extrait:

```text
apiIdentifier = "1"
actualPath = "/commands/"
```

Puis il resout:

```text
proxyConfig.apiTargets["1"] = process.env.API_TARGET_1
targetUrl = API_TARGET_1 + "/commands/"
```

Le proxy applique ensuite:

- blocage navigation directe vers le proxy;
- limite de taille body;
- cache GET selon `proxyConfig.cache`;
- sanitation du chemin;
- controle origine;
- verification identifiant API;
- rate limiting Redis avec fallback local;
- validation cible pour limiter SSRF;
- slash final force pour `POST`, `PUT`, `PATCH`, `DELETE`;
- suppression des headers client sensibles;
- injection `Authorization: Bearer <accessToken>` si session disponible;
- `fetchWithRetry` vers l'API cible;
- headers de reponse securises.

## Deux Caches Differents

Il existe deux niveaux de cache, avec deux objectifs distincts.

| Niveau | Emplacement | Role |
| --- | --- | --- |
| Cache RTK Query | navigateur / store Redux | Eviter les refetchs inutiles pour une meme query et garder une UI reactive |
| Cache proxy GET | route Next.js proxy | Reduire les appels backend pour les routes GET cacheables |

Le cache RTK Query connait les arguments frontend et les tags d'invalidation. Le cache proxy connait les URLs HTTP et les TTLs. Les deux ne remplacent pas l'autre.

## Benefices Dans Cette Clean Architecture

### 1. UI Decouplee Du Transport

Le composant UI consomme `useCommandsHook`. Il ignore:

- RTK Query;
- `/api/proxy`;
- `API_TARGET_1`;
- les tokens;
- la politique de retry;
- le cache proxy.

### 2. Domaine Protege

Le domaine expose des types et contrats. Il ne depend pas de Redux Toolkit, React ou Next.js.

### 3. Application Testable

Les use cases recoivent un `ICommandRepository`. Ils peuvent etre testes avec un repository fake sans monter Redux ni Next.js.

### 4. Infrastructure Remplacable

L'adapter peut retourner l'API ou le mock. Une autre implementation pourrait remplacer RTK Query sans toucher aux use cases.

### 5. Cache Declaratif

Les endpoints declarent `providesTags` et `invalidatesTags`. Les composants n'ont pas a orchestrer manuellement les refetchs apres creation, modification ou suppression.

### 6. Securite Centralisee

Le navigateur ne connait pas les URLs backend finales. Les tokens sont manipules cote proxy. La politique SSRF, rate limit, headers et retry reste centralisee.

### 7. Performance Stable

Redux Toolkit Query fournit:

- deduplication de requetes identiques actives;
- cache par arguments;
- etats `isLoading` / `isFetching`;
- invalidation selective;
- refetch sur focus/reconnect;
- integration store et middleware unique via `baseApi`.

## Regles A Respecter

- Ajouter tout nouveau endpoint via `baseApi.injectEndpoints`.
- Declarer les nouveaux `tagTypes` dans `baseApi.ts`.
- Typer les endpoints avec les types du domaine.
- Ne jamais appeler directement `fetch('/api/proxy/...')` depuis un composant si un endpoint RTK Query existe.
- Ne pas mettre de logique metier dans `route.ts` du proxy.
- Ne pas exposer `API_TARGET_*` au client.
- Ne pas retenter les mutations non idempotentes cote proxy.
- Garder l'adapter comme seul point de choix API vs mock.
