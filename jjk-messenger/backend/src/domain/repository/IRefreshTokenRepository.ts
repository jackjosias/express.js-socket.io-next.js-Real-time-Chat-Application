import { type RefreshToken } from "../entity/RefreshToken";

export class RefreshTokenRotationConflictError extends Error {
  constructor() {
    super("Refresh token rotation conflict");
    this.name = "RefreshTokenRotationConflictError";
  }
}

export interface IRefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  rotate(currentTokenId: string, nextToken: RefreshToken): Promise<RefreshToken>;
  revokeByTokenHash(tokenHash: string, reason: string): Promise<void>;
  revokeFamily(familyId: string, reason: string): Promise<void>;
}
