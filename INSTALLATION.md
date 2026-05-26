# Installation JJK Messenger

Ce guide installe l application actuelle: backend Express sur `3002`, frontend
Next.js sur `3000`, PostgreSQL via Prisma et authentification par cookies
HttpOnly.

## Prerequis

- Node.js 20.x ou plus recent.
- npm.
- PostgreSQL accessible localement ou via conteneur.
- Un `JWT_SECRET` fort, different par environnement.

## Backend

Depuis la racine du depot:

```bash
cd jjk-messenger/backend
npm install
cp .env.example .env
```

Configuration minimale dans `.env`:

```env
PORT=3002
NODE_ENV=development
JWT_SECRET=change-me-with-a-long-random-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/JJK_messenger
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
TRUST_PROXY_HOPS=0
WS_MAX_SOCKETS_PER_USER=5
WS_MAX_SOCKETS_PER_IP=50
WS_MESSAGE_RATE_WINDOW_MS=10000
WS_MAX_MESSAGES_PER_WINDOW=20
```

Initialiser Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

Demarrer le backend:

```bash
npm run dev
```

Le backend doit afficher un demarrage sur le port `3002`.

## Frontend

Dans un deuxieme terminal:

```bash
cd jjk-messenger/frontend
npm install
printf "NEXT_PUBLIC_API_URL=http://localhost:3002\n" > .env.local
npm run dev
```

Ouvrir `http://localhost:3000`.

## Variables d environnement backend

| Variable | Requis | Valeur locale | Role |
| --- | --- | --- | --- |
| `PORT` | non | `3002` | Port Express et Socket.IO |
| `NODE_ENV` | non | `development` | Mode runtime |
| `JWT_SECRET` | oui | secret long | Signature des access tokens |
| `DATABASE_URL` | oui | PostgreSQL local | Connexion Prisma |
| `FRONTEND_URL` | oui | `http://localhost:3000` | Origins autorisees, separees par virgule |
| `COOKIE_SECURE` | non | `false` local, `true` prod | Cookies HTTPS only |
| `COOKIE_SAME_SITE` | non | `lax` | Politique SameSite: `lax`, `strict`, `none` |
| `TRUST_PROXY_HOPS` | non | `0` | Nombre de hops proxy Express explicitement fiables |
| `WS_MAX_SOCKETS_PER_USER` | non | `5` | Limite de sockets actifs par utilisateur et par instance |
| `WS_MAX_SOCKETS_PER_IP` | non | `50` | Limite de sockets actifs par adresse distante et par instance |
| `WS_MESSAGE_RATE_WINDOW_MS` | non | `10000` | Fenetre de quota message WebSocket |
| `WS_MAX_MESSAGES_PER_WINDOW` | non | `20` | Messages `sendMessage` autorises par utilisateur et par fenetre |

En production cross-site HTTPS, utiliser generalement:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
FRONTEND_URL=https://votre-frontend.example
```

En production same-site, preferer `COOKIE_SAME_SITE=lax` ou `strict` selon le
flux produit.

## Base de donnees

Le schema Prisma cible PostgreSQL. Ne pas modifier `provider` vers SQLite pour
ce projet sans migration explicite, car les migrations, le rate limiting partage
et la posture production sont calibres sur PostgreSQL.

Commandes utiles:

```bash
cd jjk-messenger/backend
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

Deploiement production:

```bash
cd jjk-messenger/backend
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

## Build et verification locale

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

Smoke tests apres demarrage:

```bash
curl -I http://localhost:3000/login
curl http://localhost:3002/health
curl http://localhost:3002/ready
curl http://localhost:3002/metrics
```

Le smoke E2E complet a verifier avant livraison manuelle reste:
inscription, connexion, refresh, dashboard, Socket.IO `sendMessage`, historique
messages et logout, avec PostgreSQL migre par `npx prisma migrate dev` ou
`npx prisma migrate deploy` selon l environnement.

## Production

Backend:

1. Definir un `JWT_SECRET` long et aleatoire.
2. Definir `DATABASE_URL` vers PostgreSQL production.
3. Definir `FRONTEND_URL` avec les origins exactes autorisees.
4. Activer `COOKIE_SECURE=true`.
5. Choisir `COOKIE_SAME_SITE` selon le mode de deploiement.
6. Definir `TRUST_PROXY_HOPS` seulement si un reverse proxy fiable termine le trafic.
7. Ajuster les limites `WS_*` selon le profil de charge.
8. Executer `npx prisma migrate deploy`.
9. Executer `npm run build` puis `npm start`.
10. Brancher l orchestrateur sur `/health` pour le liveness et `/ready` pour la
    readiness.
11. Restreindre `/metrics` au reseau d exploitation si l API est exposee
    publiquement.

Frontend:

1. Definir `NEXT_PUBLIC_API_URL` vers le backend public.
2. Executer `npm run build`.
3. Executer `npm start` ou deployer via la plateforme cible.

## CI

Le workflow `.github/workflows/ci.yml` lance trois jobs separes:

- Backend: `npm ci`, Prisma validate/generate, lint/typecheck, build et
  verification refresh rotation.
- Frontend: `npm ci`, Next typegen, lint, typecheck et build.
- SCRIBE: tests Python, doctor et build du graphe bundle.

## Depannage

### Le backend refuse de demarrer

- Verifier que `JWT_SECRET` est defini.
- Verifier que PostgreSQL accepte la connexion `DATABASE_URL`.
- Verifier que les migrations Prisma ont ete appliquees.

### Les requetes frontend ne gardent pas la session

- Verifier que `NEXT_PUBLIC_API_URL` pointe vers le backend.
- Verifier que `FRONTEND_URL` contient exactement l origin du frontend.
- En HTTPS cross-site, verifier `COOKIE_SECURE=true` et
  `COOKIE_SAME_SITE=none`.
- En local HTTP, garder `COOKIE_SECURE=false` et `COOKIE_SAME_SITE=lax`.

### Les mutations auth echouent en CSRF

- Verifier que le cookie `jjk_csrf` est present apres login ou refresh.
- Verifier que le frontend envoie `x-csrf-token` sur refresh/logout et les
  requetes mutantes protegees.
- Verifier que le domaine et le protocole des cookies correspondent a l URL
  frontend.

### Le WebSocket ne s authentifie pas

- Verifier que le backend tourne sur `3002`.
- Verifier que le cookie `jjk_access` est pose par le backend.
- Verifier que le client Socket.IO utilise la meme base URL que
  `NEXT_PUBLIC_API_URL`.
- Le serveur WebSocket attend le cookie `jjk_access`; ne pas envoyer de bearer
  token dans handshake auth.
