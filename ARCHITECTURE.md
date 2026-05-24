# Architecture du projet JJK Messenger

Ce document détaille l'architecture technique du projet JJK Messenger, expliquant les choix de conception et l'organisation du code.

## Backend (Express.js avec Clean Architecture)

Le backend d'JJK Messenger est construit selon les principes de la Clean Architecture, qui permet une séparation claire des responsabilités et facilite la maintenance et les tests.

### Couches de l'architecture

1. **Domain / Entities** (Couche centrale)
   - Contient les entités métier pures (User, Message, ConnectionLog)
   - Indépendant de tout framework ou technologie
   - Définit les règles métier fondamentales

2. **Application / Use Cases** (Couche intermédiaire)
   - Contient la logique applicative
   - Orchestration des flux de travail
   - Dépend uniquement du Domain
   - Définit les interfaces (ports) pour les repositories et services

3. **Infrastructure** (Couche externe)
   - Implémentations concrètes des interfaces définies dans l'Application
   - Intégration avec les technologies externes (Prisma, WebSockets, JWT)
   - Adaptateurs pour les frameworks et bibliothèques

4. **Presentation / API** (Couche externe)
   - Point d'entrée de l'application
   - Contrôleurs et routes Express
   - Validation des entrées et sérialisation des réponses

### Flux de données

1. Les requêtes HTTP arrivent via les routes Express (Presentation)
2. Les contrôleurs valident les entrées et appellent les cas d'utilisation appropriés (Application)
3. Les cas d'utilisation orchestrent les opérations en utilisant les entités (Domain) et les interfaces de repository
4. Les implémentations concrètes des repositories (Infrastructure) interagissent avec la base de données
5. Les résultats remontent la chaîne jusqu'au client

### Inversion de dépendance

Un principe clé de la Clean Architecture est l'inversion de dépendance :
- Les couches internes ne dépendent jamais des couches externes
- Les dépendances pointent vers l'intérieur
- Les interfaces (ports) sont définies dans les couches internes
- Les implémentations (adaptateurs) sont dans les couches externes

## Frontend (Next.js avec Redux Toolkit)

Le frontend d'JJK Messenger est construit avec Next.js et utilise Redux Toolkit pour la gestion de l'état.

### Organisation du code

1. **App Router**
   - Structure basée sur le système de routage App Router de Next.js
   - Organisation des pages par fonctionnalité (/login, /register, /dashboard)
   - Utilisation des layouts pour le partage de composants entre les routes

2. **Components**
   - Organisation par domaine fonctionnel (auth, chat, layout, ui)
   - Composants réutilisables et modulaires
   - Séparation des préoccupations (présentation vs logique)

3. **State Management**
   - Redux Toolkit pour la gestion de l'état global
   - Slices organisés par domaine (auth, users, chat)
   - RTK Query pour les appels API et la gestion du cache

4. **WebSockets**
   - Hook personnalisé (useWebSocket) pour encapsuler la logique WebSocket
   - Intégration avec Redux pour mettre à jour l'état en fonction des événements WebSocket
   - Gestion de la reconnexion automatique

### Flux de données

1. Les actions utilisateur déclenchent des actions Redux ou des appels API via RTK Query
2. Les reducers mettent à jour l'état global
3. Les composants se re-rendent en fonction des changements d'état
4. Les événements WebSocket sont traités et déclenchent des actions Redux
5. Les composants réagissent aux mises à jour en temps réel

## Communication entre Frontend et Backend

1. **API REST**
   - Utilisée pour les opérations CRUD standard
   - Authentification via JWT
   - Endpoints organisés par ressource (/api/auth, /api/users, /api/messages)

2. **WebSockets**
   - Communication bidirectionnelle en temps réel
   - Utilisée pour les messages instantanés et les mises à jour de statut
   - Authentification via token dans l'URL de connexion

## Base de données

Le schéma de base de données est conçu pour optimiser les requêtes fréquentes :

1. **Tables principales**
   - User: stocke les informations utilisateur et le statut
   - Message: stocke les messages échangés entre utilisateurs
   - ConnectionLog: enregistre les connexions et déconnexions

2. **Relations**
   - One-to-Many entre User et Message (un utilisateur peut envoyer/recevoir plusieurs messages)
   - One-to-Many entre User et ConnectionLog (un utilisateur peut avoir plusieurs journaux de connexion)

3. **Optimisations**
   - Index sur les colonnes fréquemment interrogées
   - Relations bien définies pour faciliter les jointures

## Justification des choix techniques

1. **Clean Architecture (Backend)**
   - Séparation claire des responsabilités
   - Facilité de test (les cas d'utilisation peuvent être testés indépendamment)
   - Flexibilité pour changer de technologies (ex: passer de Prisma à un autre ORM)

2. **Next.js avec App Router (Frontend)**
   - Routage moderne et performant
   - Rendu côté serveur pour de meilleures performances
   - Organisation intuitive du code

3. **Redux Toolkit et RTK Query**
   - Gestion simplifiée de l'état global
   - Réduction du code boilerplate
   - Gestion efficace du cache pour les requêtes API

4. **WebSockets pour la communication en temps réel**
   - Communication bidirectionnelle instantanée
   - Faible latence pour les messages
   - Mises à jour en temps réel des statuts utilisateur

5. **Prisma ORM**
   - API typée pour une meilleure sécurité
   - Migrations automatisées
   - Excellent support TypeScript
