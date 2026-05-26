import { RefreshToken } from "../../../domain/entity/RefreshToken";
import {
  type IRefreshTokenRepository,
  RefreshTokenRotationConflictError,
} from "../../../domain/repository/IRefreshTokenRepository";
import { type IUserRepository } from "../../../domain/repository/IUserRepository";
import { type IAuthService } from "../../service/IAuthService";
import { REFRESH_TOKEN_TTL_MS } from "../../../infrastructure/security/authConstants";
import { type AuthSessionTokens } from "./AuthSessionTypes";

const createUnauthorizedError = (): Error & { statusCode?: number } => {
  const error = new Error("Session invalide ou expiree") as Error & { statusCode?: number };
  error.statusCode = 401;
  return error;
};

const createForbiddenError = (): Error & { statusCode?: number } => {
  const error = new Error("Jeton CSRF invalide") as Error & { statusCode?: number };
  error.statusCode = 403;
  return error;
};

export class RefreshSessionUseCase {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(refreshToken: string, csrfToken: string): Promise<AuthSessionTokens> {
    const tokenHash = this.authService.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw createUnauthorizedError();
    }

    if (storedToken.isRevoked()) {
      await this.refreshTokenRepository.revokeFamily(storedToken.familyId, "reuse-detected");
      throw createUnauthorizedError();
    }

    if (storedToken.isExpired()) {
      await this.refreshTokenRepository.revokeByTokenHash(tokenHash, "expired");
      throw createUnauthorizedError();
    }

    if (storedToken.csrfTokenHash !== this.authService.hashToken(csrfToken)) {
      throw createForbiddenError();
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      await this.refreshTokenRepository.revokeFamily(storedToken.familyId, "missing-user");
      throw createUnauthorizedError();
    }

    const nextRefreshToken = this.authService.generateRefreshToken();
    const nextCsrfToken = this.authService.generateCsrfToken();
    const nextRefreshRecord = new RefreshToken(
      "",
      this.authService.hashToken(nextRefreshToken),
      this.authService.hashToken(nextCsrfToken),
      storedToken.familyId,
      user.id,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    );

    try {
      await this.refreshTokenRepository.rotate(storedToken.id, nextRefreshRecord);
    } catch (error) {
      if (error instanceof RefreshTokenRotationConflictError) {
        await this.refreshTokenRepository.revokeFamily(storedToken.familyId, "reuse-detected");
        throw createUnauthorizedError();
      }
      throw error;
    }

    return {
      accessToken: this.authService.generateToken(user.id, user.username),
      refreshToken: nextRefreshToken,
      csrfToken: nextCsrfToken,
      userId: user.id,
      username: user.username,
    };
  }
}
