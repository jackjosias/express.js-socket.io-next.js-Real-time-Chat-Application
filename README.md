# JJK Messenger

Application de messagerie temps reel construite avec Next.js 16, React 19,
Express 5, Socket.IO, Prisma et PostgreSQL.

## Etat actuel

- Backend Express en Clean Architecture, expose sur `http://localhost:3002`
  par defaut.
- Frontend Next.js App Router, expose sur `http://localhost:3000` par
  defaut.
- Authentification par cookies HttpOnly: `jjk_access` pour l access token et
  `jjk_refresh` pour la session longue.
- Rotation de refresh token persistente en base avec stockage de hash, familles
  de tokens, revocation en cas de reutilisation et garde concurrente single-winner.
- Protection CSRF par cookie lisible `jjk_csrf` et header `x-csrf-token` sur
  les mutations sensibles.
- Rate limiting auth partage en PostgreSQL via `RateLimitBucket`, donc compatible
  avec plusieurs instances backend.
- WebSocket Socket.IO authentifie par cookie `jjk_access`, sans fallback token
  handshake, avec quotas connexion et message.
- Frontend sans JWT dans `localStorage` ni dans Redux; Redux garde seulement
  l etat applicatif et l identite de session.

## Fonctionnalites

- Inscription, connexion, session courante, refresh et logout.
- Liste des utilisateurs avec statut en ligne.
- Historique de messages par conversation.
- Envoi et reception de messages en temps reel.
- Dashboard sombre/clair avec fond anime.
- Nettoyage preventif des attributs injectes par certaines extensions navigateur
  avant hydratation React.

## Structure du depot

```text
.
|-- jjk-messenger/
|   |-- backend/
|   |   |-- index.ts
|   |   |-- prisma/
|   |   `-- src/
|   |       |-- domain/
|   |       |-- application/
|   |       |-- infrastructure/
|   |       |-- presentation/
|   |       `-- config/
|   `-- frontend/
|       |-- docs/
|       |-- public/
|       `-- src/
|           |-- app/
|           |-- core/
|           `-- shared/
|-- AGENT-MEMOIRE_PROJECT_STATUS.scribe
|-- graphify-out/
|-- .agent/workflow/
|-- ARCHITECTURE.md
`-- INSTALLATION.md
```

Les anciens dossiers frontend top-level `src/components`, `src/store` et
`src/utils` ont ete retires. Les surfaces canoniques sont maintenant:

- `src/app` pour les routes Next.js minces.
- `src/core` pour le domaine, les cas d usage, l infrastructure et la
  presentation React.
- `src/shared` pour les utilitaires transverses qui ne dependent pas de React ni
  de Redux.

Ne pas recreer de dossiers adapters legacy a la racine de `src`.

## Backend

Le backend suit une Clean Architecture stricte:

- `src/domain`: entites et contrats repository.
- `src/application`: services applicatifs et use cases.
- `src/infrastructure`: Prisma, auth JWT, securite, logging et Socket.IO.
- `src/presentation`: routes, controllers, middlewares, validation et cookies.
- `src/config`: lecture centralisee des variables d environnement.

Modeles Prisma principaux:

- `User`
- `Message`
- `ConnectionLog`
- `RefreshToken`
- `RateLimitBucket`

Endpoints principaux:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users`
- `GET /api/messages/:userId`
- `GET /health`
- `GET /ready`
- `GET /metrics`
- Socket.IO event `sendMessage`

## Frontend

Le frontend est organise par couches:

- `src/app`: pages App Router et layout global.
- `src/core/domain`: types, schemas, entites client et ports.
- `src/core/application`: cas d usage frontend.
- `src/core/infrastructure`: RTK Query, Redux store, repositories, config,
  realtime et helpers navigateur.
- `src/core/presentation`: composants, hooks, providers et pages composees.
- `src/shared`: erreurs et helpers partages.

La configuration API par defaut pointe vers `http://localhost:3002`. Elle peut
etre surchargee avec `NEXT_PUBLIC_API_URL`.

## Demarrage rapide

Backend:

```bash
cd jjk-messenger/backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

Frontend:

```bash
cd jjk-messenger/frontend
npm install
printf "NEXT_PUBLIC_API_URL=http://localhost:3002\n" > .env.local
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Validation

Backend:

```bash
cd jjk-messenger/backend
npx prisma validate
npx prisma generate
npm run lint
npm run build
npm run test:refresh-rotation
```

Frontend:

```bash
cd jjk-messenger/frontend
npx next typegen
npm run lint
npx tsc --noEmit
npm run build
```

Graph structure:

```bash
graphify update .
```

Si le graphe refuse une baisse de noeuds apres une suppression intentionnelle,
forcer uniquement apres avoir confirme que la baisse vient bien du nettoyage
DRY.

## Garanties production ajoutees

- Le rate limiting auth n est plus process-local: les compteurs sont atomiques
  dans PostgreSQL et partages entre instances.
- La rotation refresh token est single-winner: une seconde rotation concurrente
  declenche la revocation de famille comme reutilisation suspecte.
- Le WebSocket est cookie-only cote serveur et limite les connexions par
  utilisateur, par IP, ainsi que la cadence `sendMessage`.
- `TRUST_PROXY_HOPS` reste a configurer explicitement derriere un reverse proxy;
  ne jamais faire confiance aux headers proxy sans topologie controlee.
- Les endpoints `/health`, `/ready` et `/metrics` exposent le liveness, la
  readiness DB/auth/WebSocket et les compteurs runtime HTTP/rate-limit/refus.
- Chaque requete HTTP recoit un `X-Request-Id` et produit un log structure
  quand `DEBUG=app:*` ou un namespace compatible est actif.
- `.github/workflows/ci.yml` valide backend, frontend et SCRIBE sur push et PR.

## Documentation

- `ARCHITECTURE.md`: architecture detaillee et flux.
- `INSTALLATION.md`: installation locale et production.
- `jjk-messenger/frontend/docs/`: carte clean architecture du frontend.
- `AGENT-MEMOIRE_PROJECT_STATUS.scribe`: memoire causale projet.
- `graphify-out/GRAPH_REPORT.md`: memoire structurelle generee.
