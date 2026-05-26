import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import { PrismaClient } from "@prisma/client";
import config from "./src/config/config";
import { LogoutSessionUseCase } from "./src/application/use-cases/Auth/LogoutSessionUseCase";
import { RefreshSessionUseCase } from "./src/application/use-cases/Auth/RefreshSessionUseCase";
import { GetMessageHistoryUseCase } from "./src/application/use-cases/Message/GetMessageHistoryUseCase";
import { SendMessageUseCase } from "./src/application/use-cases/Message/SendMessageUseCase";
import { GetUserListUseCase } from "./src/application/use-cases/User/GetUserListUseCase";
import { LoginUserUseCase } from "./src/application/use-cases/User/LoginUserUseCase";
import { RegisterUserUseCase } from "./src/application/use-cases/User/RegisterUserUseCase";
import { AuthService } from "./src/infrastructure/auth/AuthService";
import { PrismaConnectionLogRepository } from "./src/infrastructure/database/PrismaConnectionLogRepository";
import { PrismaMessageRepository } from "./src/infrastructure/database/PrismaMessageRepository";
import { PrismaRefreshTokenRepository } from "./src/infrastructure/database/PrismaRefreshTokenRepository";
import { PrismaUserRepository } from "./src/infrastructure/database/PrismaUserRepository";
import { PrismaRateLimitStore } from "./src/infrastructure/security/RateLimitStore";
import logger from "./src/infrastructure/logging/logger";
import { WebSocketService } from "./src/infrastructure/websocket/WebSocketService";
import { AuthController } from "./src/presentation/api/controllers/AuthController";
import { HealthController } from "./src/presentation/api/controllers/HealthController";
import { MessageController } from "./src/presentation/api/controllers/MessageController";
import { UserController } from "./src/presentation/api/controllers/UserController";
import { errorMiddleware } from "./src/presentation/api/middlewares/errorMiddleware";
import { createOriginPolicyMiddleware } from "./src/presentation/api/middlewares/originPolicyMiddleware";
import { requestLoggerMiddleware } from "./src/presentation/api/middlewares/requestLoggerMiddleware";
import { createAuthRoutes } from "./src/presentation/api/routes/authRoutes";
import { createMessageRoutes } from "./src/presentation/api/routes/messageRoutes";
import { createHealthRoutes } from "./src/presentation/api/routes/healthRoutes";
import { createUserRoutes } from "./src/presentation/api/routes/userRoutes";

const app = express();
const server = http.createServer(app);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin non autorisee"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
};

if (config.trustProxyHops > 0) {
  app.set("trust proxy", config.trustProxyHops);
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(requestLoggerMiddleware);
app.use(createOriginPolicyMiddleware(config.frontendOrigins, config.nodeEnv));
app.use(express.json());

const prisma = new PrismaClient();
const authService = new AuthService(config.jwtSecret);

const userRepository = new PrismaUserRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const connectionLogRepository = new PrismaConnectionLogRepository(prisma);
const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
const rateLimitStore = new PrismaRateLimitStore(prisma);
const webSocketService = new WebSocketService(authService, userRepository, config.webSocketLimits);

const registerUserUseCase = new RegisterUserUseCase(userRepository, authService);
const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  authService,
  connectionLogRepository,
  refreshTokenRepository,
  prisma
);
const refreshSessionUseCase = new RefreshSessionUseCase(
  refreshTokenRepository,
  userRepository,
  authService
);
const logoutSessionUseCase = new LogoutSessionUseCase(
  refreshTokenRepository,
  authService
);
const getUserListUseCase = new GetUserListUseCase(userRepository);
const getMessageHistoryUseCase = new GetMessageHistoryUseCase(messageRepository, userRepository);
const sendMessageUseCase = new SendMessageUseCase(messageRepository, userRepository);

const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  refreshSessionUseCase,
  logoutSessionUseCase
);
const healthController = new HealthController(prisma, authService, webSocketService);
const userController = new UserController(getUserListUseCase);
const messageController = new MessageController(getMessageHistoryUseCase);

const healthRoutes = createHealthRoutes(healthController);
const authRoutes = createAuthRoutes(authController, authService, rateLimitStore);
const userRoutes = createUserRoutes(userController, authService);
const messageRoutes = createMessageRoutes(messageController, authService);

app.use(healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

webSocketService.initialize(server, corsOptions);

webSocketService.onConnection(async (userId: string) => {
  try {
    const user = await userRepository.updateOnlineStatus(userId, true);
    webSocketService.broadcastUserStatus(user);
  } catch (error) {
    logger.error({
      message: "Echec de la gestion post-connexion",
      userId,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }
});

webSocketService.onDisconnection(async (userId: string) => {
  try {
    const user = await userRepository.updateOnlineStatus(userId, false);
    await connectionLogRepository.closeActiveConnection(userId);
    webSocketService.broadcastUserStatus(user);
  } catch (error) {
    logger.error({
      message: "Echec de la gestion post-deconnexion",
      userId,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }
});

webSocketService.onMessage(async (messageData) => {
  try {
    const message = await sendMessageUseCase.execute(
      messageData.content,
      messageData.senderId,
      messageData.receiverId
    );
    const users = await userRepository.findManyByIds([
      messageData.senderId,
      messageData.receiverId,
    ]);
    const sender = users.find((user) => user.id === messageData.senderId);
    const receiver = users.find((user) => user.id === messageData.receiverId);

    if (sender) {
      webSocketService.sendMessageToUser(message, sender);
    }
    if (receiver) {
      webSocketService.sendMessageToUser(message, receiver);
    }
  } catch (error) {
    logger.error("Erreur lors de la reception du message Socket.IO", error);
  }
});

app.get("/", (_req, res) => {
  res.json({ message: "API JJK Messenger operationnelle" });
});

app.use(errorMiddleware);

server.listen(config.port, () => {
  logger.info("Serveur demarre sur le port " + config.port + " en mode " + config.nodeEnv);
});
