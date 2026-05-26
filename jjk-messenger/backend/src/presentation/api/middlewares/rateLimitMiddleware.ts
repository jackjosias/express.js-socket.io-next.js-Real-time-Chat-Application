import { type Request, type RequestHandler, type Response } from "express";
import { type RateLimitStore } from "../../../infrastructure/security/RateLimitStore";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

type RateLimitOptions = {
  scope: string;
  windowMs: number;
  maxRequests: number;
  message: string;
  keyResolver: (req: Request) => string;
  store: RateLimitStore;
};

const AUTH_RATE_LIMIT_MESSAGE = "Trop de tentatives. Reessayez plus tard.";
const UNKNOWN_CLIENT_KEY = "unknown";

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || UNKNOWN_CLIENT_KEY;
}

function getBodyUsername(req: Request): string {
  const body = req.body as { username?: unknown } | undefined;
  return typeof body?.username === "string" ? body.username.trim().toLowerCase() : "anonymous";
}

function normalizeRateLimitKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9:._-]/g, "_").slice(0, 256) || UNKNOWN_CLIENT_KEY;
}

function setRateLimitHeaders(res: Response, limit: number, remaining: number, resetAt: Date): void {
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt.getTime() / 1000)));
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  return async (req, res, next): Promise<void> => {
    try {
      const decision = await options.store.consume({
        scope: options.scope,
        key: normalizeRateLimitKey(options.keyResolver(req)),
        maxRequests: options.maxRequests,
        windowMs: options.windowMs,
      });

      setRateLimitHeaders(res, decision.limit, decision.remaining, decision.resetAt);
      runtimeMetrics.recordRateLimitDecision(options.scope, decision.allowed);

      if (!decision.allowed) {
        res.setHeader("Retry-After", String(decision.retryAfterSeconds));
        res.status(429).json({ message: options.message });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createAuthRateLimiters(store: RateLimitStore): {
  registerIp: RequestHandler;
  registerIdentity: RequestHandler;
  loginIp: RequestHandler;
  loginIdentity: RequestHandler;
} {
  const ipKey = (req: Request): string => getClientIp(req);
  const identityKey = (req: Request): string => `${getClientIp(req)}:${getBodyUsername(req)}`;

  return {
    registerIp: createRateLimitMiddleware({
      store,
      scope: "auth:register:ip",
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
      message: AUTH_RATE_LIMIT_MESSAGE,
      keyResolver: ipKey,
    }),
    registerIdentity: createRateLimitMiddleware({
      store,
      scope: "auth:register:identity",
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
      message: AUTH_RATE_LIMIT_MESSAGE,
      keyResolver: identityKey,
    }),
    loginIp: createRateLimitMiddleware({
      store,
      scope: "auth:login:ip",
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      message: AUTH_RATE_LIMIT_MESSAGE,
      keyResolver: ipKey,
    }),
    loginIdentity: createRateLimitMiddleware({
      store,
      scope: "auth:login:identity",
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: AUTH_RATE_LIMIT_MESSAGE,
      keyResolver: identityKey,
    }),
  };
}
