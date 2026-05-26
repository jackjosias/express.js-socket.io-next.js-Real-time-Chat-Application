import { Router } from "express";
import { type HealthController } from "../controllers/HealthController";
import { asyncHandler } from "../middlewares/asyncHandler";

export const createHealthRoutes = (healthController: HealthController): Router => {
  const router = Router();

  router.get("/health", healthController.health);
  router.get("/ready", asyncHandler(healthController.ready));
  router.get("/metrics", healthController.metrics);

  return router;
};
