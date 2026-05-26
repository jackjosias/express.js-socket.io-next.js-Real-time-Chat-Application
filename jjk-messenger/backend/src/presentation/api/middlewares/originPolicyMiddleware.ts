import { type NextFunction, type Request, type Response } from "express";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const createOriginPolicyMiddleware = (
  allowedOrigins: string[],
  nodeEnv: string
) => {
  const allowed = new Set(allowedOrigins);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!UNSAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.header("origin");
    if (!origin) {
      if (nodeEnv === "production") {
        runtimeMetrics.recordOriginRejection();
        res.status(403).json({ message: "Origine absente" });
        return;
      }
      next();
      return;
    }

    if (!allowed.has(origin)) {
      runtimeMetrics.recordOriginRejection();
      res.status(403).json({ message: "Origine non autorisee" });
      return;
    }

    next();
  };
};
