import { type NextFunction, type Request, type Response } from "express";
import { type IAuthService } from "../../../application/service/IAuthService";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../../infrastructure/security/authConstants";
import { getCookie } from "../security/cookieUtils";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

export const authMiddleware = (authService: IAuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = getCookie(req, ACCESS_TOKEN_COOKIE_NAME);

    if (!token) {
      runtimeMetrics.recordAuthRejection("missing_token");
      res.status(401).json({ message: "Acces non autorise" });
      return;
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      runtimeMetrics.recordAuthRejection("invalid_token");
      res.status(401).json({ message: "Token invalide ou expire" });
      return;
    }

    req.user = decoded;
    next();
  };
};
