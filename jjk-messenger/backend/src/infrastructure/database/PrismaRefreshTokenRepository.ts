import { type Prisma, type PrismaClient, type RefreshToken as PrismaRefreshToken } from "@prisma/client";
import { RefreshToken } from "../../domain/entity/RefreshToken";
import {
  type IRefreshTokenRepository,
  RefreshTokenRotationConflictError,
} from "../../domain/repository/IRefreshTokenRepository";

type PrismaRefreshTokenClient = PrismaClient | Prisma.TransactionClient;

const toDomain = (record: PrismaRefreshToken): RefreshToken => {
  return new RefreshToken(
    record.id,
    record.tokenHash,
    record.csrfTokenHash,
    record.familyId,
    record.userId,
    record.expiresAt,
    record.revokedAt,
    record.revokedReason,
    record.replacedByTokenId,
    record.createdAt,
    record.updatedAt
  );
};

const hasTransaction = (client: PrismaRefreshTokenClient): client is PrismaClient => {
  return "$transaction" in client;
};

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private prisma: PrismaRefreshTokenClient) {}

  withTx(tx: Prisma.TransactionClient): PrismaRefreshTokenRepository {
    return new PrismaRefreshTokenRepository(tx);
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const created = await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshToken.tokenHash,
        csrfTokenHash: refreshToken.csrfTokenHash,
        familyId: refreshToken.familyId,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
        revokedAt: refreshToken.revokedAt,
        revokedReason: refreshToken.revokedReason,
        replacedByTokenId: refreshToken.replacedByTokenId,
      },
    });

    return toDomain(created);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    return record ? toDomain(record) : null;
  }

  async rotate(currentTokenId: string, nextToken: RefreshToken): Promise<RefreshToken> {
    const rotateInClient = async (client: Prisma.TransactionClient) => {
      const rotatedAt = new Date();
      const revokeResult = await client.refreshToken.updateMany({
        where: {
          id: currentTokenId,
          revokedAt: null,
        },
        data: {
          revokedAt: rotatedAt,
          revokedReason: "rotated",
        },
      });

      if (revokeResult.count !== 1) {
        throw new RefreshTokenRotationConflictError();
      }

      const created = await client.refreshToken.create({
        data: {
          tokenHash: nextToken.tokenHash,
          csrfTokenHash: nextToken.csrfTokenHash,
          familyId: nextToken.familyId,
          userId: nextToken.userId,
          expiresAt: nextToken.expiresAt,
        },
      });

      await client.refreshToken.update({
        where: { id: currentTokenId },
        data: {
          replacedByTokenId: created.id,
        },
      });

      return created;
    };

    const rotated = hasTransaction(this.prisma)
      ? await this.prisma.$transaction(rotateInClient)
      : await rotateInClient(this.prisma);

    return toDomain(rotated);
  }

  async revokeByTokenHash(tokenHash: string, reason: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async revokeFamily(familyId: string, reason: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }
}
