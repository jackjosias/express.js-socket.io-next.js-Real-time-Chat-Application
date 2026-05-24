import { Request, RequestHandler, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

const AUTH_RATE_LIMIT_MESSAGE = 'Trop de tentatives. Réessayez plus tard.';

const getClientKey = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const createEntry = (now: number, windowMs: number): RateLimitEntry => ({
  count: 0,
  resetAt: now + windowMs,
});

const cleanupExpiredEntries = (entries: Map<string, RateLimitEntry>, now: number): void => {
  for (const [key, entry] of entries.entries()) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
};

const setRateLimitHeaders = (
  res: Response,
  maxRequests: number,
  remaining: number,
  resetAt: number
): void => {
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
};

export const createRateLimitMiddleware = (options: RateLimitOptions): RequestHandler => {
  const attempts = new Map<string, RateLimitEntry>();

  return (req, res, next): void => {
    const now = Date.now();
    cleanupExpiredEntries(attempts, now);

    const key = getClientKey(req);
    const currentEntry = attempts.get(key);
    const entry = currentEntry && currentEntry.resetAt > now
      ? currentEntry
      : createEntry(now, options.windowMs);

    entry.count += 1;
    attempts.set(key, entry);

    const remaining = Math.max(options.maxRequests - entry.count, 0);
    setRateLimitHeaders(res, options.maxRequests, remaining, entry.resetAt);

    if (entry.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ message: options.message });
      return;
    }

    next();
  };
};

export const registerRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: AUTH_RATE_LIMIT_MESSAGE,
});

export const loginRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: AUTH_RATE_LIMIT_MESSAGE,
});
