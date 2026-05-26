import { randomUUID } from "crypto";
import { Prisma, type PrismaClient } from "@prisma/client";

export interface RateLimitConsumeInput {
  scope: string;
  key: string;
  maxRequests: number;
  windowMs: number;
  now?: Date;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  consume(input: RateLimitConsumeInput): Promise<RateLimitDecision>;
  cleanupExpired(now?: Date): Promise<void>;
}

type RateLimitRow = {
  count: number;
  resetAt: Date | string;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export class PrismaRateLimitStore implements RateLimitStore {
  constructor(private prisma: PrismaClient) {}

  async consume(input: RateLimitConsumeInput): Promise<RateLimitDecision> {
    const now = input.now ?? new Date();
    const nextResetAt = new Date(now.getTime() + input.windowMs);
    const rows = await this.prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
      INSERT INTO "RateLimitBucket" ("id", "scope", "key", "count", "resetAt", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${input.scope}, ${input.key}, 1, ${nextResetAt}, ${now}, ${now})
      ON CONFLICT ("scope", "key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${nextResetAt}
          ELSE "RateLimitBucket"."resetAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt"
    `);

    const row = rows[0];
    if (!row) {
      throw new Error("Rate limit store returned no decision");
    }

    const resetAt = toDate(row.resetAt);
    const remaining = Math.max(input.maxRequests - row.count, 0);
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));

    return {
      allowed: row.count <= input.maxRequests,
      limit: input.maxRequests,
      remaining,
      resetAt,
      retryAfterSeconds,
    };
  }

  async cleanupExpired(now: Date = new Date()): Promise<void> {
    await this.prisma.rateLimitBucket.deleteMany({
      where: {
        resetAt: {
          lte: now,
        },
      },
    });
  }
}
