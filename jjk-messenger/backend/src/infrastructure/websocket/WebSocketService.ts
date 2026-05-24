// --- Fichier Modifié: backend/src/infrastructure/websocket/WebSocketService.ts ---
/**
 * Implémentation du service WebSocket en utilisant Socket.IO
 * Gère les connexions WebSocket et la communication en temps réel
 */
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CorsOptions } from 'cors'; // Importe le type pour les options CORS
import logger from '../logging/logger'; // Reste inchangé, l'implémentation a changé
import { IWebSocketService } from '../../application/service/IWebSocketService';
import { IAuthService } from '../../application/service/IAuthService';
import { User } from '../../domain/entity/User';
import { IUserRepository } from '../../domain/repository/IUserRepository';
import { Message } from '../../domain/entity/Message';

interface SocketMessageData {
  content: string;
  receiverId: string;
}

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    userId?: string;
  };
}

const MAX_MESSAGE_CONTENT_LENGTH = 5000;
const MAX_USER_ID_LENGTH = 128;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parseSocketMessageData = (value: unknown): SocketMessageData | null => {
  if (!isRecord(value)) {
    return null;
  }

  const content = typeof value.content === 'string' ? value.content.trim() : '';
  const receiverId = typeof value.receiverId === 'string' ? value.receiverId.trim() : '';

  if (!content || content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return null;
  }

  if (!receiverId || receiverId.length > MAX_USER_ID_LENGTH) {
    return null;
  }

  return { content, receiverId };
};

export class WebSocketService implements IWebSocketService {
  private io: SocketIOServer | null = null;
  // 🧬 Gère plusieurs connexions par utilisateur
  private clients: Map<string, Socket[]> = new Map();
  private connectionCallback: ((userId: string) => void) | null = null;
  private disconnectionCallback: ((userId: string) => void) | null = null;
  private messageCallback: ((message: { content: string; senderId: string; receiverId: string }) => void) | null = null;

  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository // 🧬 Injection du repository
  ) {}

  initialize(server: HttpServer, corsOptions: CorsOptions): void {
    // ✨ Accepte les options CORS
    // Initialise le serveur Socket.IO
    this.io = new SocketIOServer(server, {
      cors: corsOptions, // ✨ Applique les options CORS unifiées
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Nouvelle connexion Socket.IO: ${socket.id}`);

      const token = socket.handshake.auth.token as string;

      if (!token) {
        logger.warn(`Socket.IO: Token d'authentification manquant, déconnexion du socket: ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded || typeof decoded.userId !== 'string') {
        logger.warn(`Socket.IO: Token invalide ou userId manquant, déconnexion du socket: ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      const userId = decoded.userId;
      socket.data.userId = userId;

      // 🧬 Ajoute le nouveau socket à la liste des sockets de l'utilisateur
      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId)?.push(socket);
      logger.info(`Utilisateur ${userId} connecté via Socket.IO sur le socket ${socket.id}`);

      // Notifier la connexion
      if (this.connectionCallback) {
        this.connectionCallback(userId);
      }

      // Gérer les messages entrants
      socket.on('sendMessage', (messageData: unknown) => {
        const validatedMessage = parseSocketMessageData(messageData);
        if (!validatedMessage) {
          logger.warn(`Socket.IO: Invalid sendMessage payload from ${userId}`);
          socket.emit('messageError', { message: 'Message invalide.' });
          return;
        }

        if (this.messageCallback && userId) {
          logger.info(`Message reçu de ${userId} pour ${validatedMessage.receiverId} (${validatedMessage.content.length} chars)`);
          this.messageCallback({
            content: validatedMessage.content,
            senderId: userId,
            receiverId: validatedMessage.receiverId
          });
        }
      });

      // Gérer la déconnexion
      socket.on('disconnect', () => {
        if (socket.data.userId) {
          const disconnectedUserId = socket.data.userId;
          const userSockets = this.clients.get(disconnectedUserId) || [];

          // 🧬 Retire le socket déconnecté de la liste
          const remainingSockets = userSockets.filter(s => s.id !== socket.id);
          if (remainingSockets.length > 0) {
            this.clients.set(disconnectedUserId, remainingSockets);
          } else {
            // 🧬 Si c'était le dernier socket, supprime l'utilisateur et notifie la déconnexion
            this.clients.delete(disconnectedUserId);
            logger.info(`Utilisateur ${disconnectedUserId} complètement déconnecté de Socket.IO`);
            if (this.disconnectionCallback) {
              this.disconnectionCallback(disconnectedUserId);
            }
          }
        }
      });

      socket.on('error', (err) => {
        logger.error('Socket.IO Erreur sur le socket:', socket.data.userId || socket.id, err);
      });
    });

    this.io.on('error', (err) => {
      logger.error('Socket.IO Erreur globale:', err);
    });
  }

  // Diffuser un statut utilisateur à tous les clients connectés (sauf l'expéditeur)
  broadcastUserStatus(user: User): void {
    if (!this.io) return;
    const event = {
      type: 'userStatusUpdate',
      user: {
        id: user.id,
        username: user.username,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt
      }
    };
    this.io.emit('userStatusUpdate', event.user);
    logger.info(`Diffusion du statut utilisateur pour ${user.username}: ${user.isOnline}`);
  }

  // Envoyer un message spécifique à un utilisateur
  sendMessageToUser(message: Message, user: User): void {
    if (!this.io) return;
    const clientSockets = this.clients.get(user.id);
    if (clientSockets && clientSockets.length > 0) {
      const messagePayload = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        readAt: message.readAt
      };
      clientSockets.forEach(socket => {
        socket.emit('newMessage', messagePayload);
      });
      logger.info(`Message envoyé à ${user.username} (${user.id}) sur ${clientSockets.length} socket(s)`);
    } else {
      logger.info(`Impossible d'envoyer un message à ${user.username} (${user.id}), car l'utilisateur n'est pas connecté.`);
    }
  }

  onConnection(callback: (userId: string) => void): void {
    this.connectionCallback = callback;
  }

  onDisconnection(callback: (userId: string) => void): void {
    this.disconnectionCallback = callback;
  }

  onMessage(callback: (message: { content: string; senderId: string; receiverId: string }) => void): void {
    this.messageCallback = callback;
  }
}
