import { type IRefreshTokenRepository } from "../../../domain/repository/IRefreshTokenRepository";
import { type IAuthService } from "../../service/IAuthService";

export class LogoutSessionUseCase {
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private authService: IAuthService
  ) {}

  async execute(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokenRepository.revokeByTokenHash(
      this.authService.hashToken(refreshToken),
      "logout"
    );
  }
}
