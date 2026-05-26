import { type NextFunction, type Request, type Response } from "express";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../../../infrastructure/security/authConstants";
import { getCookie } from "../security/cookieUtils";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const csrfCookie = getCookie(req, CSRF_COOKIE_NAME);
  const csrfHeader = req.header(CSRF_HEADER_NAME);

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    runtimeMetrics.recordCsrfRejection();
    res.status(403).json({ message: "Protection CSRF invalide" });
    return;
  }

  next();
};
