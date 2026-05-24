// --- Fichier Final Corrigé: backend/index.ts ---
/**
 * Point d'entrée principal du serveur Express
 * Configure et démarre le serveur avec toutes les dépendances.
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import logger from './src/infrastructure/logging/logger';
import config from './src/config/config';

// Importation des services d'infrastructure
import { AuthService } from './src/infrastructure/auth/AuthService';
import { WebSocketService } from './src/infrastructure/websocket/WebSocketService';

// Importation des repositories (à implémenter avec Prisma)
import { PrismaUserRepository } from './src/infrastructure/database/PrismaUserRepository';
import { PrismaMessageRepository } from './src/infrastructure/database/PrismaMessageRepository';
import { PrismaConnectionLogRepository } from './src/infrastructure/database/PrismaConnectionLogRepository';

// Importation des cas d'utilisation
import { RegisterUserUseCase } from './src/application/use-cases/User/RegisterUserUseCase';
import { LoginUserUseCase } from './src/application/use-cases/User/LoginUserUseCase';
import { GetUserListUseCase } from './src/application/use-cases/User/GetUserListUseCase';
import { GetMessageHistoryUseCase } from './src/application/use-cases/Message/GetMessageHistoryUseCase';
import { SendMessageUseCase } from './src/application/use-cases/Message/SendMessageUseCase';

// Importation des contrôleurs
import { AuthController } from './src/presentation/api/controllers/AuthController';
import { UserController } from './src/presentation/api/controllers/UserController';
import { MessageController } from './src/presentation/api/controllers/MessageController';

// Importation des routes
import { createAuthRoutes } from './src/presentation/api/routes/authRoutes';
import { createUserRoutes } from './src/presentation/api/routes/userRoutes';
import { createMessageRoutes } from './src/presentation/api/routes/messageRoutes';
import { errorMiddleware } from './src/presentation/api/middlewares/errorMiddleware';

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);

// 🧬 Configuration CORS centralisée et robuste
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true // Souvent nécessaire pour les WebSockets
};

// Middleware de base
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Initialisation de Prisma
const prisma = new PrismaClient();

// Initialisation des services
const authService = new AuthService(config.jwtSecret);

// Initialisation des repositories
const userRepository = new PrismaUserRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const connectionLogRepository = new PrismaConnectionLogRepository(prisma);
const webSocketService = new WebSocketService(authService, userRepository);

// Initialisation des cas d'utilisation
const registerUserUseCase = new RegisterUserUseCase(userRepository, authService);
const loginUserUseCase = new LoginUserUseCase(userRepository, authService, connectionLogRepository, prisma);
const getUserListUseCase = new GetUserListUseCase(userRepository);
const getMessageHistoryUseCase = new GetMessageHistoryUseCase(messageRepository, userRepository);
const sendMessageUseCase = new SendMessageUseCase(messageRepository, userRepository);

// Initialisation des contrôleurs
const authController = new AuthController(registerUserUseCase, loginUserUseCase);
const userController = new UserController(getUserListUseCase);
const messageController = new MessageController(getMessageHistoryUseCase);

// 🧬 Utilisation des routeurs modulaires pour une meilleure organisation
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController, authService);
const messageRoutes = createMessageRoutes(messageController, authService);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Initialisation du service WebSocket
webSocketService.initialize(server, corsOptions); // ✨ Passe les options CORS

// Gestion des événements WebSocket
webSocketService.onConnection(async (userId: string) => {
    try {
        // Mettre à jour le statut de l'utilisateur
        const user = await userRepository.updateOnlineStatus(userId, true);
        // Notifier les autres utilisateurs
        webSocketService.broadcastUserStatus(user);
    } catch (error) {
        // 🛡️ Log d'erreur enrichi pour un meilleur diagnostic
        logger.error({
            message: `Échec de la gestion post-connexion pour userId: ${userId}`,
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
    }
});

webSocketService.onDisconnection(async (userId: string) => {
    try {
        // Mettre à jour le statut de l'utilisateur
        const user = await userRepository.updateOnlineStatus(userId, false);
        // Fermer la connexion active dans les logs
        await connectionLogRepository.closeActiveConnection(userId);
        // Notifier les autres utilisateurs
        webSocketService.broadcastUserStatus(user);
    } catch (error) {
        // 🛡️ Log d'erreur enrichi pour un meilleur diagnostic
        logger.error({
            message: `Échec de la gestion post-déconnexion pour userId: ${userId}`,
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
    }
});

webSocketService.onMessage(async (messageData) => {
    try {
        // 🧬 1. Le Use Case persiste le message et retourne l'entité complète
        const message = await sendMessageUseCase.execute(
            messageData.content,
            messageData.senderId,
            messageData.receiverId
        );

        // 🚀 2. Optimisation: On récupère les deux utilisateurs en une seule requête
        const users = await userRepository.findManyByIds([messageData.senderId, messageData.receiverId]);
        const sender = users.find(u => u.id === messageData.senderId);
        const receiver = users.find(u => u.id === messageData.receiverId);

        // 🧬 3. On envoie le message au destinataire ET à l'expéditeur (pour synchroniser ses autres onglets)
        if (sender) {
            webSocketService.sendMessageToUser(message, sender);
        }
        if (receiver) {
            webSocketService.sendMessageToUser(message, receiver);
        }
    } catch (error) {
        logger.error('Erreur lors de la réception d\'un message WebSocket:', error);
    }
});

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.json({ message: 'API JJK Messenger opérationnelle' });
});

// 🧬 Middleware de gestion d'erreurs. DOIT être le dernier middleware.
app.use(errorMiddleware);

// Démarrage du serveur
server.listen(config.port, () => {
    logger.info(`Serveur démarré sur le port ${config.port} en mode ${config.nodeEnv}`);
});