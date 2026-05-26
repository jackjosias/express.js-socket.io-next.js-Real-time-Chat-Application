# Architecture JJK Messenger

Ce document decrit l architecture actuelle du projet apres restructuration Clean
Architecture frontend et durcissement de l authentification.

## Vue globale

```text
Browser
  |
  |-- HTTP credentials include + CSRF header
  |       |
  |       v
  |   Next.js 16 frontend
  |       |
  |-- REST /api/*
  |       |
  |       v
  |   Express 5 backend
  |       |
  |-- Socket.IO cookie auth
  |       |
  |       v
  |   Application use cases
  |       |
  |       v
  |   Domain entities and repository contracts
  |       |
  |       v
  |   Prisma repositories
  |       |
  |       v
  |   PostgreSQL
```

Responsabilites:

- `jjk-messenger/backend`: API REST, session, securite, realtime et
  persistence.
- `jjk-messenger/frontend`: experience utilisateur, orchestration client,
  cache RTK Query et Socket.IO client.
- `.agent/workflow/*`: workflows portables et corpus de reference. Ce n est
  pas du code applicatif runtime.
- `graphify-out/`: graphe structurel genere du projet.
- `AGENT-MEMOIRE_PROJECT_STATUS.scribe`: memoire causale et decisions.

## Backend

Le backend est organise en Clean Architecture. Les dependances vont vers
l interieur: presentation et infrastructure dependent de application/domain,
jamais l inverse.

| Couche | Chemin | Role |
| --- | --- | --- |
| Domain | `backend/src/domain` | Entites pures et contrats repository |
| Application | `backend/src/application` | Use cases et services applicatifs |
| Infrastructure | `backend/src/infrastructure` | Prisma, JWT, cookies, security, Socket.IO |
| Presentation | `backend/src/presentation` | Express routes, controllers, middlewares |
| Config | `backend/src/config` | Variables d environnement normalisees |

God nodes observes par Graphify:

- `PrismaUserRepository`
- `PrismaConnectionLogRepository`
- `AuthService`
- `WebSocketService`
- `PrismaMessageRepository`

Ces noeuds ont le plus fort blast radius. Toute modification dessus demande
build, lint/typecheck et verification des flux auth/realtime.

### Entites et persistence

Modeles Prisma:

- `User`: identite, mot de passe hash, statut online, horodatages.
- `Message`: contenu, sender, receiver, readAt.
- `ConnectionLog`: historique de connexion WebSocket.
- `RefreshToken`: hash de refresh token, hash CSRF, familyId, expiration,
  revocation et remplacement.
- `RateLimitBucket`: compteur auth partage par scope et cle client.

Les repositories Prisma restent dans `src/infrastructure/database` et
implementent les ports de `src/domain/repository`.

### Authentification

Flux login/register:

1. Le controller valide l entree.
2. Le use case authentifie ou cree l utilisateur.
3. `AuthService` genere un access token court, un refresh token et un CSRF
   token.
4. Le backend stocke uniquement les hash du refresh token et du CSRF token.
5. Le backend pose:
   - `jjk_access`: cookie HttpOnly.
   - `jjk_refresh`: cookie HttpOnly.
   - `jjk_csrf`: cookie lisible par le frontend.
6. Le frontend garde l utilisateur et l etat de session, pas le JWT.

Flux refresh:

1. Le frontend appelle `/api/auth/refresh` avec credentials inclus.
2. `x-csrf-token` doit correspondre au cookie `jjk_csrf`.
3. Le backend verifie le refresh token hash.
4. Le repository effectue une rotation single-winner dans une transaction.
5. Le refresh token courant est revoque et remplace.
6. Une reutilisation de token revoque ou une rotation concurrente perdante
   entraine la revocation de la famille.

Flux logout:

1. Le frontend appelle `/api/auth/logout` avec header CSRF.
2. La famille de refresh tokens active est revoquee.
3. Les cookies de session sont nettoyes.

### CSRF et origin policy

- `FRONTEND_URL` definit les origins autorisees, separees par virgule.
- Les mutations sensibles exigent `x-csrf-token`.
- `COOKIE_SAME_SITE` vaut `lax` par defaut.
- `COOKIE_SECURE` devient automatiquement vrai en production ou si
  `COOKIE_SAME_SITE=none`.

### WebSocket

Socket.IO partage le backend Express. Le chemin d auth cible est le cookie
`jjk_access`.

Le serveur WebSocket ne lit plus `handshake auth token`: la session realtime
est cookie-only. La pression est bornee par quotas de sockets par utilisateur,
quotas de sockets par IP et fenetre de messages par utilisateur.

## Observabilite backend

Le backend expose trois surfaces operationnelles hors `/api`:

- `GET /health`: liveness process, sans dependance externe.
- `GET /ready`: readiness avec ping PostgreSQL, self-check JWT et etat
  WebSocket initialise.
- `GET /metrics`: snapshot JSON des compteurs runtime HTTP, refus auth/CSRF/
  origin, decisions de rate-limit et refus WebSocket.

`requestLoggerMiddleware` ajoute un `X-Request-Id` par requete et logue la
completion HTTP avec methode, chemin, statut, duree et userId quand disponible.
Les compteurs restent process-local par design: ils servent au diagnostic et au
smoke local, pas au stockage historique. En production multi-instance, un
collecteur externe doit agreger ces snapshots ou remplacer cette surface par un
exporter dedie.

## Frontend

Le frontend suit le workflow Clean Architecture Next.js applique dans
`jjk-messenger/frontend`.

| Couche | Chemin | Role |
| --- | --- | --- |
| App Router | `frontend/src/app` | Routes minces et layout |
| Domain | `frontend/src/core/domain` | Types, schemas, entites client, ports |
| Application | `frontend/src/core/application` | Use cases frontend |
| Infrastructure | `frontend/src/core/infrastructure` | API, store, realtime, repositories, config |
| Presentation | `frontend/src/core/presentation` | Composants, hooks, providers, pages |
| Shared | `frontend/src/shared` | Erreurs et helpers transverses |

Les dossiers legacy top-level `src/components`, `src/store` et `src/utils` ne
font plus partie de l architecture. Les composants vivent sous
`src/core/presentation/components`, le store sous
`src/core/infrastructure/store`, et les erreurs transverses sous `src/shared`.

### Etat client

- Redux Toolkit centralise l etat applicatif.
- RTK Query gere les appels REST et la reauth.
- Les cookies sont envoyes par `credentials: "include"`.
- Le header CSRF est ajoute aux requetes mutantes quand `jjk_csrf` est present.
- Le client ne lit pas et ne stocke pas le JWT.

### Realtime client

- La configuration API est centralisee dans
  `src/core/infrastructure/config/api.ts`.
- Le Socket.IO client utilise la meme base URL que l API.
- La session WebSocket est conservee par cookie.

### Hydratation React

Le layout racine garde un SSR deterministe. Le nettoyage des mutations DOM
injectees par extensions navigateur est isole dans
`ExtensionDomSanitizer`, un provider client monte apres hydratation.

## Politique DRY des dossiers

Les noms de dossiers repetes ne sont pas automatiquement des doublons:

- `domain`, `application`, `infrastructure` et `presentation` existent cote
  backend et cote frontend parce que chaque runtime possede sa propre Clean
  Architecture.
- `docs` existe dans le frontend et dans les workflows `.agent` parce que les
  docs applicatives et les corpus portables n ont pas le meme ownership.
- `config` existe cote backend et frontend parce que les variables runtime ne
  sont pas les memes.
- `security` existe dans infrastructure et presentation backend parce que les
  helpers bas niveau et la politique HTTP ne sont pas au meme niveau.

Un dossier est considere doublon a supprimer seulement si:

1. Il porte la meme responsabilite runtime.
2. Il n a pas de ownership distinct.
3. Aucun import ou document canonique ne justifie son existence.
4. Sa suppression ne casse ni build ni generation Graphify.

## Dettes production remboursees

- `DEBT-001`: remboursee par `PrismaRateLimitStore` et le modele
  `RateLimitBucket`, avec increments atomiques PostgreSQL.
- `DEBT-004`: remboursee par rotation refresh single-winner et verification
  `npm run test:refresh-rotation`.
- `DEBT-005`: remboursee par WebSocket cookie-only et quotas de pression
  connexion/message.

Pour du trafic edge massif, conserver un WAF ou gateway rate limiter devant
l application reste recommande, mais ce n est plus requis pour partager les
compteurs auth entre instances Node.js.
