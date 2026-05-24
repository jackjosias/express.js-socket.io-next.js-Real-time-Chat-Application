/**
 * Interface WebSocket
 * Définit les contrats que les implémentations concrètes doivent respecter
 */
import { CorsOptions } from 'cors';
import { User } from '../../domain/entity/User';
import { Message } from '../../domain/entity/Message';

export interface IWebSocketService {
  initialize(server: any, corsOptions: CorsOptions): void; // ✨ Met à jour la signature
  broadcastUserStatus(user: User): void;
  sendMessageToUser(message: Message, user: User): void;
  onConnection(callback: (userId: string) => void): void;
  onDisconnection(callback: (userId: string) => void): void;
  onMessage(callback: (message: { content: string; senderId: string; receiverId: string }) => void): void;
}