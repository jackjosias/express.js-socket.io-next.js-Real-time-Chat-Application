export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly tokenHash: string,
    public readonly csrfTokenHash: string,
    public readonly familyId: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null = null,
    public readonly revokedReason: string | null = null,
    public readonly replacedByTokenId: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
