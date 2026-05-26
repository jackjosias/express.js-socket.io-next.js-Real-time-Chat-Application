import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

type CookieSameSite = "lax" | "strict" | "none";

interface WebSocketLimitsConfig {
  maxSocketsPerUser: number;
  maxSocketsPerIp: number;
  messageWindowMs: number;
  maxMessagesPerWindow: number;
}

interface Config {
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  nodeEnv: string;
  frontendOrigins: string[];
  cookieSecure: boolean;
  cookieSameSite: CookieSameSite;
  trustProxyHops: number;
  webSocketLimits: WebSocketLimitsConfig;
}

function parseFrontendOrigins(): string[] {
  const rawOrigins = process.env.FRONTEND_URL || "http://localhost:3000";
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseCookieSameSite(): CookieSameSite {
  const rawValue = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  if (rawValue === "strict" || rawValue === "none") {
    return rawValue;
  }
  return "lax";
}

function parseIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSameSite = parseCookieSameSite();

const config: Config = {
  port: parseIntegerEnv("PORT", 3002),
  jwtSecret: process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/JJK_messenger",
  nodeEnv,
  frontendOrigins: parseFrontendOrigins(),
  cookieSameSite,
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : nodeEnv === "production" || cookieSameSite === "none",
  trustProxyHops: parseIntegerEnv("TRUST_PROXY_HOPS", 0),
  webSocketLimits: {
    maxSocketsPerUser: parseIntegerEnv("WS_MAX_SOCKETS_PER_USER", 5),
    maxSocketsPerIp: parseIntegerEnv("WS_MAX_SOCKETS_PER_IP", 50),
    messageWindowMs: parseIntegerEnv("WS_MESSAGE_RATE_WINDOW_MS", 10_000),
    maxMessagesPerWindow: parseIntegerEnv("WS_MAX_MESSAGES_PER_WINDOW", 20),
  },
};

if (!config.jwtSecret) {
  console.error("ERREUR CRITIQUE: La variable JWT_SECRET est absente.");
  throw new Error("JWT_SECRET doit etre defini pour demarrer l application.");
}

export default config;
