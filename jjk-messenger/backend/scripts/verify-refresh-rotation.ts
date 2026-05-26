import assert from "assert";
import { RefreshSessionUseCase } from "../src/application/use-cases/Auth/RefreshSessionUseCase";
import { RefreshToken } from "../src/domain/entity/RefreshToken";
import { User } from "../src/domain/entity/User";
import {
  RefreshTokenRotationConflictError,
} from "../src/domain/repository/IRefreshTokenRepository";
import { PrismaRefreshTokenRepository } from "../src/infrastructure/database/PrismaRefreshTokenRepository";

type StoredToken = {
  id: string;
  tokenHash: string;
  csrfTokenHash: string;
  familyId: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  replacedByTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UpdateManyArgs = {
  where: { id?: string; revokedAt?: Date | null };
  data: Partial<StoredToken>;
};

type CreateArgs = {
  data: Pick<StoredToken, "tokenHash" | "csrfTokenHash" | "familyId" | "userId" | "expiresAt">;
};

type UpdateArgs = {
  where: { id: string };
  data: Partial<StoredToken>;
};

const futureDate = (): Date => new Date(Date.now() + 60_000);
const resolved = <T>(value: T): Promise<T> => Promise.resolve(value);
const resolvedVoid = (): Promise<void> => Promise.resolve();

const createStoredToken = (): StoredToken => ({
  id: "current-token",
  tokenHash: "hash:refresh",
  csrfTokenHash: "hash:csrf",
  familyId: "family-1",
  userId: "user-1",
  expiresAt: futureDate(),
  revokedAt: null,
  revokedReason: null,
  replacedByTokenId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

async function verifyRepositorySingleWinner(): Promise<void> {
  const current = createStoredToken();
  let createdCount = 0;

  const prismaLikeClient = {
    refreshToken: {
      updateMany: (args: UpdateManyArgs): Promise<{ count: number }> => {
        if (args.where.id !== current.id || args.where.revokedAt !== null || current.revokedAt !== null) {
          return resolved({ count: 0 });
        }

        Object.assign(current, args.data, { updatedAt: new Date() });
        return resolved({ count: 1 });
      },
      create: (args: CreateArgs): Promise<StoredToken> => {
        createdCount += 1;
        return resolved({
          id: `next-token-${createdCount}`,
          ...args.data,
          revokedAt: null,
          revokedReason: null,
          replacedByTokenId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
      update: (args: UpdateArgs): Promise<StoredToken> => {
        assert.equal(args.where.id, current.id);
        Object.assign(current, args.data, { updatedAt: new Date() });
        return resolved(current);
      },
    },
  };

  const repository = new PrismaRefreshTokenRepository(prismaLikeClient as never);
  const firstRotation = await repository.rotate(
    current.id,
    new RefreshToken("", "hash:next-1", "hash:csrf-next-1", current.familyId, current.userId, futureDate())
  );

  assert.equal(firstRotation.id, "next-token-1");
  assert.equal(current.revokedReason, "rotated");
  assert.equal(current.replacedByTokenId, "next-token-1");

  await assert.rejects(
    () => repository.rotate(
      current.id,
      new RefreshToken("", "hash:next-2", "hash:csrf-next-2", current.familyId, current.userId, futureDate())
    ),
    RefreshTokenRotationConflictError
  );
  assert.equal(createdCount, 1);
}

async function verifyUseCaseMapsConflictToReuseDetection(): Promise<void> {
  let revokedFamily: { familyId: string; reason: string } | null = null;
  const storedToken = new RefreshToken(
    "current-token",
    "hash:refresh",
    "hash:csrf",
    "family-1",
    "user-1",
    futureDate()
  );

  const refreshTokenRepository = {
    create: (refreshToken: RefreshToken) => resolved(refreshToken),
    findByTokenHash: () => resolved(storedToken),
    rotate: () => Promise.reject(new RefreshTokenRotationConflictError()),
    revokeByTokenHash: resolvedVoid,
    revokeFamily: (familyId: string, reason: string): Promise<void> => {
      revokedFamily = { familyId, reason };
      return resolvedVoid();
    },
  };

  const userRepository = {
    findById: () => resolved(new User("user-1", "yuji", "hashed", new Date(), new Date(), new Date(), true)),
  };

  const authService = {
    hashPassword: (password: string) => resolved(`hash:${password}`),
    comparePassword: () => resolved(true),
    generateToken: () => "access-token",
    verifyToken: () => ({ userId: "user-1", username: "yuji" }),
    generateRefreshToken: () => "next-refresh",
    generateCsrfToken: () => "next-csrf",
    hashToken: (token: string) => `hash:${token}`,
  };

  const useCase = new RefreshSessionUseCase(
    refreshTokenRepository,
    userRepository as never,
    authService
  );

  await assert.rejects(
    () => useCase.execute("refresh", "csrf"),
    (error: unknown) => {
      return error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 401;
    }
  );
  assert.deepEqual(revokedFamily, { familyId: "family-1", reason: "reuse-detected" });
}

async function main(): Promise<void> {
  await verifyRepositorySingleWinner();
  await verifyUseCaseMapsConflictToReuseDetection();
  process.stdout.write("refresh rotation verification passed\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
