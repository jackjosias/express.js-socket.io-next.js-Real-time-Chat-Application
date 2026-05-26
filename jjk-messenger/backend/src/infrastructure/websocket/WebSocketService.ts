import { type Server as HttpServer } from "http";
import { type CorsOptions } from "cors";
import { Server as SocketIOServer, type DefaultEventsMap, type Socket } from "socket.io";
import { type IWebSocketService, type WebSocketHealthSnapshot } from "../../application/service/IWebSocketService";
import { type IAuthService } from "../../application/service/IAuthService";
import { type User } from "../../domain/entity/User";
import { type IUserRepository } from "../../domain/repository/IUserRepository";
import { type Message } from "../../domain/entity/Message";
import logger from "../logging/logger";
import { ACCESS_TOKEN_COOKIE_NAME } from "../security/authConstants";
import { parseCookieHeader } from "../../presentation/api/security/cookieUtils";
import { runtimeMetrics } from "../observability/runtimeMetrics";

interface SocketMessageData {
  content: string;
  receiverId: string;
}

interface AuthenticatedSocketData {
  userId?: string;
  remoteAddress?: string;
}

type AuthenticatedSocket = Socket<
DefaultEventsMap,
DefaultEventsMap,
DefaultEventsMap,
AuthenticatedSocketData
>;

type AuthenticatedSocketServer = SocketIOServer<
DefaultEventsMap,
DefaultEventsMap,
DefaultEventsMap,
AuthenticatedSocketData
>;

export interface WebSocketLimits {
  maxSocketsPerUser: number;
  maxSocketsPerIp: number;
  messageWindowMs: number;
  maxMessagesPerWindow: number;
}

type RateWindow = {
  count: number;
  resetAt: number;
};

const DEFAULT_LIMITS: WebSocketLimits = {
  maxSocketsPerUser: 5,
  maxSocketsPerIp: 50,
  messageWindowMs: 10_000,
  maxMessagesPerWindow: 20,
};

const MAX_MESSAGE_CONTENT_LENGTH = 5000;
const MAX_USER_ID_LENGTH = 128;
const UNKNOWN_REMOTE_ADDRESS = "unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSocketMessageData(value: unknown): SocketMessageData | null {
  if (!isRecord(value)) {
    return null;
  }

  const content = typeof value.content === "string" ? value.content.trim() : "";
  const receiverId = typeof value.receiverId === "string" ? value.receiverId.trim() : "";

  if (!content || content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return null;
  }

  if (!receiverId || receiverId.length > MAX_USER_ID_LENGTH) {
    return null;
  }

  return { content, receiverId };
}

function getSocketAddress(socket: Socket): string {
  return socket.handshake.address || UNKNOWN_REMOTE_ADDRESS;
}

function incrementCounter(counters: Record<string, number>, key: string): void {
  counters[key] = (counters[key] ?? 0) + 1;
}

export class WebSocketService implements IWebSocketService {
  private io: AuthenticatedSocketServer | null = null;
  private clients: Map<string, AuthenticatedSocket[]> = new Map();
  private socketsByIp: Map<string, Set<string>> = new Map();
  private messageWindows: Map<string, RateWindow> = new Map();
  private rejectedConnectionsByReason: Record<string, number> = {};
  private messageRateLimitRejectionsTotal = 0;
  private connectionCallback: ((userId: string) => void) | null = null;
  private disconnectionCallback: ((userId: string) => void) | null = null;
  private messageCallback: ((message: { content: string; senderId: string; receiverId: string }) => void) | null = null;
  private limits: WebSocketLimits;

  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository,
    limits: Partial<WebSocketLimits> = {}
  ) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  initialize(server: HttpServer, corsOptions: CorsOptions): void {
    this.io = new SocketIOServer<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    AuthenticatedSocketData
    >(server, {
      cors: corsOptions,
    });

    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });

    this.io.on("error", (err) => {
      logger.error("Socket.IO global error", err);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    logger.info(`Socket.IO connection opened: ${socket.id}`);

    const token = parseCookieHeader(socket.handshake.headers.cookie)[ACCESS_TOKEN_COOKIE_NAME] ?? null;
    if (!token) {
      this.rejectSocket(socket, "missing_cookie_auth", "Authentication required.");
      return;
    }

    const decoded = this.authService.verifyToken(token);
    if (!decoded || typeof decoded.userId !== "string") {
      this.rejectSocket(socket, "invalid_cookie_auth", "Authentication required.");
      return;
    }

    const userId = decoded.userId;
    const remoteAddress = getSocketAddress(socket);

    if (!this.canAcceptConnection(userId, remoteAddress)) {
      this.rejectSocket(socket, "socket_quota_exceeded", "Too many active realtime sessions.");
      return;
    }

    socket.data.userId = userId;
    socket.data.remoteAddress = remoteAddress;
    this.addClient(userId, remoteAddress, socket);
    logger.info(`User ${userId} connected via Socket.IO socket ${socket.id}`);

    this.connectionCallback?.(userId);
    this.bindSocketEvents(socket);
  }

  private rejectSocket(socket: AuthenticatedSocket, reason: string, message: string): void {
    incrementCounter(this.rejectedConnectionsByReason, reason);
    runtimeMetrics.recordWebSocketRejection(reason);
    logger.warn({ message: "Socket.IO connection rejected", socketId: socket.id, reason });
    socket.emit("connectionError", { message });
    socket.disconnect(true);
  }

  private canAcceptConnection(userId: string, remoteAddress: string): boolean {
    const userSocketCount = this.clients.get(userId)?.length ?? 0;
    const ipSocketCount = this.socketsByIp.get(remoteAddress)?.size ?? 0;

    return userSocketCount < this.limits.maxSocketsPerUser && ipSocketCount < this.limits.maxSocketsPerIp;
  }

  private addClient(userId: string, remoteAddress: string, socket: AuthenticatedSocket): void {
    const userSockets = this.clients.get(userId) ?? [];
    userSockets.push(socket);
    this.clients.set(userId, userSockets);

    const ipSockets = this.socketsByIp.get(remoteAddress) ?? new Set<string>();
    ipSockets.add(socket.id);
    this.socketsByIp.set(remoteAddress, ipSockets);
  }

  private removeClient(socket: AuthenticatedSocket): void {
    const userId = socket.data.userId;
    const remoteAddress = socket.data.remoteAddress;

    if (remoteAddress) {
      const ipSockets = this.socketsByIp.get(remoteAddress);
      ipSockets?.delete(socket.id);
      if (ipSockets && ipSockets.size === 0) {
        this.socketsByIp.delete(remoteAddress);
      }
    }

    if (!userId) {
      return;
    }

    const remainingSockets = (this.clients.get(userId) ?? []).filter((candidate) => candidate.id !== socket.id);
    if (remainingSockets.length > 0) {
      this.clients.set(userId, remainingSockets);
      return;
    }

    this.clients.delete(userId);
    this.messageWindows.delete(userId);
    logger.info(`User ${userId} fully disconnected from Socket.IO`);
    this.disconnectionCallback?.(userId);
  }

  private bindSocketEvents(socket: AuthenticatedSocket): void {
    socket.on("sendMessage", (messageData: unknown) => {
      this.handleIncomingMessage(socket, messageData);
    });

    socket.on("disconnect", () => {
      this.removeClient(socket);
    });

    socket.on("error", (err) => {
      logger.error("Socket.IO socket error", socket.data.userId || socket.id, err);
    });
  }

  private handleIncomingMessage(socket: AuthenticatedSocket, messageData: unknown): void {
    const userId = socket.data.userId;
    if (!userId) {
      socket.emit("messageError", { message: "Authentication required." });
      return;
    }

    if (!this.consumeMessageQuota(userId)) {
      this.messageRateLimitRejectionsTotal += 1;
      runtimeMetrics.recordWebSocketMessageRateLimitRejection();
      logger.warn({ message: "Socket.IO message quota exceeded", userId });
      socket.emit("messageError", { message: "Too many messages. Slow down." });
      return;
    }

    const validatedMessage = parseSocketMessageData(messageData);
    if (!validatedMessage) {
      logger.warn({ message: "Socket.IO invalid sendMessage payload", userId });
      socket.emit("messageError", { message: "Message invalide." });
      return;
    }

    logger.info(`Message received from ${userId} for ${validatedMessage.receiverId} (${validatedMessage.content.length} chars)`);
    this.messageCallback?.({
      content: validatedMessage.content,
      senderId: userId,
      receiverId: validatedMessage.receiverId,
    });
  }

  private consumeMessageQuota(userId: string): boolean {
    const now = Date.now();
    const current = this.messageWindows.get(userId);
    const window = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + this.limits.messageWindowMs };

    window.count += 1;
    this.messageWindows.set(userId, window);

    return window.count <= this.limits.maxMessagesPerWindow;
  }

  getHealthSnapshot(): WebSocketHealthSnapshot {
    const connectedSockets = [...this.clients.values()]
      .reduce((total, sockets) => total + sockets.length, 0);

    return {
      initialized: this.io !== null,
      connectedSockets,
      trackedUsers: this.clients.size,
      trackedIps: this.socketsByIp.size,
      rejectedConnectionsByReason: { ...this.rejectedConnectionsByReason },
      messageRateLimitRejectionsTotal: this.messageRateLimitRejectionsTotal,
    };
  }

  broadcastUserStatus(user: User): void {
    if (!this.io) return;
    const event = {
      type: "userStatusUpdate",
      user: {
        id: user.id,
        username: user.username,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
      },
    };
    this.io.emit("userStatusUpdate", event.user);
    logger.info(`Broadcasted status for ${user.username}: ${user.isOnline}`);
  }

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
        readAt: message.readAt,
      };
      clientSockets.forEach((socket) => {
        socket.emit("newMessage", messagePayload);
      });
      logger.info(`Message sent to ${user.username} (${user.id}) on ${clientSockets.length} socket(s)`);
    } else {
      logger.info(`Cannot send message to ${user.username} (${user.id}); user is not connected.`);
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
