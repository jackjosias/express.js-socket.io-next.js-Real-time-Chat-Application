import { randomUUID } from "crypto";
import { type NextFunction, type Request, type Response } from "express";
import logger from "../../../infrastructure/logging/logger";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

function getDurationMs(startedAt: bigint): number {
  const elapsedNs = process.hrtime.bigint() - startedAt;
  return Number(elapsedNs / 1_000_000n);
}

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    runtimeMetrics.recordHttpResponse(res.statusCode);
    logger.info({
      message: "http_request_completed",
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: getDurationMs(startedAt),
      userId: req.user?.userId ?? null,
    });
  });

  next();
};
