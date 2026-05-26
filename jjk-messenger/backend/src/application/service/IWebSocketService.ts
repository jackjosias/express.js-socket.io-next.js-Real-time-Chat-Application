import { type CorsOptions } from "cors";
import { type Server as HttpServer } from "http";
import { type User } from "../../domain/entity/User";
import { type Message } from "../../domain/entity/Message";

export interface WebSocketHealthSnapshot {
  initialized: boolean;
  connectedSockets: number;
  trackedUsers: number;
  trackedIps: number;
  rejectedConnectionsByReason: Record<string, number>;
  messageRateLimitRejectionsTotal: number;
}

export interface IWebSocketService {
  initialize(server: HttpServer, corsOptions: CorsOptions): void;
  broadcastUserStatus(user: User): void;
  sendMessageToUser(message: Message, user: User): void;
  getHealthSnapshot(): WebSocketHealthSnapshot;
  onConnection(callback: (userId: string) => void): void;
  onDisconnection(callback: (userId: string) => void): void;
  onMessage(callback: (message: { content: string; senderId: string; receiverId: string }) => void): void;
}
