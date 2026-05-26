import { type PrismaClient } from "@prisma/client";
import { type Request, type Response } from "express";
import { type IAuthService } from "../../../application/service/IAuthService";
import { type IWebSocketService } from "../../../application/service/IWebSocketService";
import { runtimeMetrics } from "../../../infrastructure/observability/runtimeMetrics";

type ComponentHealth = {
  status: "ok" | "error";
  details?: unknown;
};

export class HealthController {
  constructor(
    private prisma: PrismaClient,
    private authService: IAuthService,
    private webSocketService: IWebSocketService
  ) {}

  health = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  };

  ready = async (_req: Request, res: Response): Promise<void> => {
    const database = await this.checkDatabase();
    const auth = this.checkAuth();
    const websocket = this.checkWebSocket();
    const healthy = database.status === "ok" && auth.status === "ok" && websocket.status === "ok";

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ready" : "not_ready",
      components: {
        database,
        auth,
        websocket,
      },
      timestamp: new Date().toISOString(),
    });
  };

  metrics = (_req: Request, res: Response): void => {
    res.status(200).json({
      runtime: runtimeMetrics.snapshot(),
      websocket: this.webSocketService.getHealthSnapshot(),
    });
  };

  private async checkDatabase(): Promise<ComponentHealth> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch (error) {
      return {
        status: "error",
        details: { message: error instanceof Error ? error.message : "unknown database error" },
      };
    }
  }

  private checkAuth(): ComponentHealth {
    const token = this.authService.generateToken("healthcheck", "healthcheck");
    const decoded = this.authService.verifyToken(token);
    if (decoded?.userId === "healthcheck") {
      return { status: "ok" };
    }

    return { status: "error", details: { message: "JWT self-check failed" } };
  }

  private checkWebSocket(): ComponentHealth {
    const snapshot = this.webSocketService.getHealthSnapshot();
    return {
      status: snapshot.initialized ? "ok" : "error",
      details: snapshot,
    };
  }
}
