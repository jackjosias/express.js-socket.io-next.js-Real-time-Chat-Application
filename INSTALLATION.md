# Guide d'installation et de démarrage

Ce document fournit les instructions détaillées pour installer et démarrer l'application JJK Messenger.

## Installation du Backend

1. Accédez au dossier backend :
   ```bash
   cd JJK-messenger/backend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement :
   - Copiez le fichier `.env.example` vers `.env`
   - Modifiez les valeurs selon votre environnement

4. Générez le client Prisma :
   ```bash
   npx prisma generate
   ```

5. Exécutez les migrations de base de données :
   ```bash
   npx prisma migrate dev --name init
   ```

6. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

## Installation du Frontend

1. Accédez au dossier frontend :
   ```bash
   cd JJK-messenger/frontend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez un fichier `.env.local` avec le contenu suivant :
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

5. Accédez à l'application dans votre navigateur à l'adresse `http://localhost:3000`

## Configuration pour la Production

### Backend

Pour utiliser PostgreSQL en production :

1. Modifiez le fichier `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Mettez à jour la variable `DATABASE_URL` dans le fichier `.env` :
   ```
   DATABASE_URL=postgresql://utilisateur:motdepasse@hote:port/base_de_donnees
   ```

3. Générez le client Prisma et appliquez les migrations :
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Construisez l'application pour la production :
   ```bash
   npm run build
   ```

5. Démarrez le serveur :
   ```bash
   npm start
   ```

### Frontend

1. Mettez à jour le fichier `.env.local` avec l'URL de l'API en production :
   ```
   NEXT_PUBLIC_API_URL=https://votre-api-backend.com
   ```

2. Construisez l'application pour la production :
   ```bash
   npm run build
   ```

3. Démarrez le serveur :
   ```bash
   npm start
   ```

## Dépannage

### Problèmes de connexion à la base de données

- Vérifiez que les informations de connexion dans `.env` sont correctes
- Assurez-vous que le serveur de base de données est en cours d'exécution
- Vérifiez les permissions de l'utilisateur de la base de données

### Problèmes de WebSocket

- Vérifiez que le port 3001 est ouvert et accessible
- Assurez-vous que le backend est en cours d'exécution
- Vérifiez les logs du serveur pour les erreurs de connexion WebSocket

### Problèmes d'authentification

- Vérifiez que la variable JWT_SECRET est correctement définie
- Assurez-vous que les tokens JWT ne sont pas expirés
- Vérifiez les logs du serveur pour les erreurs d'authentification
