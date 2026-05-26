import crypto from "crypto";
import { type Prisma, type PrismaClient } from "@prisma/client";
import { RefreshToken } from "../../../domain/entity/RefreshToken";
import { type IConnectionLogRepository } from "../../../domain/repository/IConnectionLogRepository";
import { type IRefreshTokenRepository } from "../../../domain/repository/IRefreshTokenRepository";
import { type IUserRepository } from "../../../domain/repository/IUserRepository";
import { REFRESH_TOKEN_TTL_MS } from "../../../infrastructure/security/authConstants";
import { ConnectionLog } from "../../../domain/entity/ConnectionLog";
import { type IAuthService } from "../../service/IAuthService";
import { type AuthSessionTokens } from "../Auth/AuthSessionTypes";

type TransactionalUserRepository = IUserRepository & {
  withTx(tx: Prisma.TransactionClient): IUserRepository;
};

type TransactionalConnectionLogRepository = IConnectionLogRepository & {
  withTx(tx: Prisma.TransactionClient): IConnectionLogRepository;
};

type TransactionalRefreshTokenRepository = IRefreshTokenRepository & {
  withTx(tx: Prisma.TransactionClient): IRefreshTokenRepository;
};

const createInvalidCredentialsError = (): Error & { statusCode?: number } => {
  const error = new Error("Identifiants invalides") as Error & { statusCode?: number };
  error.statusCode = 401;
  return error;
};

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
    private connectionLogRepository: IConnectionLogRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private prisma: PrismaClient
  ) {}

  async execute(username: string, password: string): Promise<AuthSessionTokens> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw createInvalidCredentialsError();
    }

    const isPasswordValid = await this.authService.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw createInvalidCredentialsError();
    }

    const refreshToken = this.authService.generateRefreshToken();
    const csrfToken = this.authService.generateCsrfToken();
    const refreshRecord = new RefreshToken(
      "",
      this.authService.hashToken(refreshToken),
      this.authService.hashToken(csrfToken),
      crypto.randomUUID(),
      user.id,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    );

    await this.prisma.$transaction(async (tx) => {
      const userRepoTx = (this.userRepository as TransactionalUserRepository).withTx(tx);
      const connectionLogRepoTx = (this.connectionLogRepository as TransactionalConnectionLogRepository).withTx(tx);
      const refreshTokenRepoTx = (this.refreshTokenRepository as TransactionalRefreshTokenRepository).withTx(tx);

      await userRepoTx.updateOnlineStatus(user.id, true);
      await userRepoTx.updateLastSeen(user.id, new Date());
      await connectionLogRepoTx.create(new ConnectionLog("", user.id, new Date(), null));
      await refreshTokenRepoTx.create(refreshRecord);
    });

    return {
      accessToken: this.authService.generateToken(user.id, user.username),
      refreshToken,
      csrfToken,
      userId: user.id,
      username: user.username,
    };
  }
}
