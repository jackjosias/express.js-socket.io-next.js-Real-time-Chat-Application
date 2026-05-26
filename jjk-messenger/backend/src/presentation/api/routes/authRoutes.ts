import { Router } from "express";
import { type IAuthService } from "../../../application/service/IAuthService";
import { type RateLimitStore } from "../../../infrastructure/security/RateLimitStore";
import { type AuthController } from "../controllers/AuthController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authMiddleware } from "../middlewares/authMiddleware";
import { csrfMiddleware } from "../middlewares/csrfMiddleware";
import { createAuthRateLimiters } from "../middlewares/rateLimitMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { loginSchema, registerSchema } from "../validators/authValidators";

export const createAuthRoutes = (
  authController: AuthController,
  authService: IAuthService,
  rateLimitStore: RateLimitStore
): Router => {
  const router = Router();
  const rateLimiters = createAuthRateLimiters(rateLimitStore);

  router.post(
    "/register",
    rateLimiters.registerIp,
    rateLimiters.registerIdentity,
    validate(registerSchema),
    asyncHandler(authController.register)
  );
  router.post(
    "/login",
    rateLimiters.loginIp,
    rateLimiters.loginIdentity,
    validate(loginSchema),
    asyncHandler(authController.login)
  );
  router.get("/session", authMiddleware(authService), asyncHandler(authController.session));
  router.post("/refresh", csrfMiddleware, asyncHandler(authController.refresh));
  router.post("/logout", csrfMiddleware, asyncHandler(authController.logout));

  return router;
};
