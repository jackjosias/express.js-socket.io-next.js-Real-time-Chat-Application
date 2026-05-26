import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { io } from "socket.io-client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type HeaderSource = {
  get(name: string): string | null;
  getSetCookie?: () => string[];
};

type SmokeSocket = {
  close(): void;
  emit(eventName: string, payload: unknown): void;
  on(eventName: string, listener: (payload: SmokeMessage) => void): void;
  once(eventName: "connect", listener: () => void): void;
  once(eventName: "connect_error", listener: (error: Error) => void): void;
  once(eventName: "connectionError", listener: (error: unknown) => void): void;
};

type SmokeUser = {
  id: string;
  username: string;
};

type SmokeSession = {
  userId: string;
  username: string;
};

type SmokeMessage = {
  id: string;
  content: string;
};

type MessageHistory = {
  messages: SmokeMessage[];
};

const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:3002";
const ORIGIN = process.env.SMOKE_ORIGIN ?? "http://localhost:3000";
const PASSWORD = "SmokePass123!";
const LOOPBACK_KEYS = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
const SMOKE_USERNAME_PREFIXES = ["smoke_sender_", "smoke_recv_"];

class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(headers: HeaderSource): void {
    const setCookies =
      typeof headers.getSetCookie === "function" ? headers.getSetCookie() : splitSetCookie(headers.get("set-cookie"));

    for (const cookie of setCookies) {
      const [pair] = cookie.split(";");
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (value) {
        this.cookies.set(name, value);
      } else {
        this.cookies.delete(name);
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

function splitSetCookie(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^;,\s]+=)/g).map((value) => value.trim());
}

function parseJsonBody(text: string, path: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON response from ${path}: ${(error as Error).message}`);
  }
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function parseUser(value: unknown): SmokeUser {
  assertRecord(value, "user");
  assertString(value.id, "user.id");
  assertString(value.username, "user.username");
  return { id: value.id, username: value.username };
}

function parseSession(value: unknown): SmokeSession {
  assertRecord(value, "session");
  assertString(value.userId, "session.userId");
  assertString(value.username, "session.username");
  return { userId: value.userId, username: value.username };
}

function parseMessageHistory(value: unknown): MessageHistory {
  assertRecord(value, "message history");
  if (!Array.isArray(value.messages)) {
    throw new Error("message history.messages must be an array");
  }

  return { messages: value.messages as SmokeMessage[] };
}

function buildIdentityRateLimitKeys(usernames: string[]): string[] {
  return LOOPBACK_KEYS.flatMap((clientIp) => usernames.map((username) => `${clientIp}:${username.toLowerCase()}`));
}

async function resetSmokeRateLimitBuckets(prisma: PrismaClient, usernames: string[] = []): Promise<void> {
  const identityKeys = buildIdentityRateLimitKeys(usernames);
  await prisma.rateLimitBucket.deleteMany({
    where: {
      OR: [
        {
          scope: {
            in: ["auth:register:ip", "auth:login:ip"],
          },
          key: {
            in: LOOPBACK_KEYS,
          },
        },
        {
          scope: {
            in: ["auth:register:identity", "auth:login:identity"],
          },
          key: {
            in: identityKeys,
          },
        },
      ],
    },
  });
}

async function cleanupSmokeUsers(prisma: PrismaClient, knownUserIds: string[] = []): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          id: {
            in: knownUserIds,
          },
        },
        ...SMOKE_USERNAME_PREFIXES.map((prefix) => ({
          username: {
            startsWith: prefix,
          },
        })),
      ],
    },
    select: {
      id: true,
    },
  });
  const userIds = [...new Set(users.map((user) => user.id))];
  if (userIds.length === 0) {
    return;
  }

  await prisma.message.deleteMany({
    where: {
      OR: [
        {
          senderId: {
            in: userIds,
          },
        },
        {
          receiverId: {
            in: userIds,
          },
        },
      ],
    },
  });
  await prisma.connectionLog.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });
  await prisma.refreshToken.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
}

async function request(path: string, options: RequestInit = {}, jar: CookieJar | null = null): Promise<unknown> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: ORIGIN,
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  const cookieHeader = jar?.header();
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  jar?.store(response.headers);

  const text = await response.text();
  const body = parseJsonBody(text, path);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} -> ${response.status}: ${text}`);
  }

  return body;
}

async function postJson(
  path: string,
  payload: unknown,
  jar: CookieJar | null = null,
  headers: Record<string, string> = {}
): Promise<unknown> {
  return request(
    path,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    },
    jar
  );
}

async function register(username: string): Promise<SmokeUser> {
  const body = await postJson("/api/auth/register", { username, password: PASSWORD });
  assertRecord(body, "register response");
  return parseUser(body.user);
}

async function login(username: string, jar: CookieJar): Promise<SmokeSession> {
  const body = await postJson("/api/auth/login", { username, password: PASSWORD }, jar);
  return parseSession(body);
}

async function refresh(jar: CookieJar): Promise<SmokeSession> {
  const csrfToken = jar.get("jjk_csrf");
  if (!csrfToken) {
    throw new Error("Missing jjk_csrf cookie before refresh");
  }

  const body = await postJson("/api/auth/refresh", {}, jar, {
    "x-csrf-token": csrfToken,
  });
  return parseSession(body);
}

async function logout(jar: CookieJar): Promise<void> {
  const csrfToken = jar.get("jjk_csrf");
  if (!csrfToken) {
    throw new Error("Missing jjk_csrf cookie before logout");
  }

  await request(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "x-csrf-token": csrfToken },
    },
    jar
  );
}

function connectSocket(jar: CookieJar, label: string): Promise<SmokeSocket> {
  return new Promise((resolve, reject) => {
    const socket = io(API_BASE, {
      transports: ["websocket"],
      extraHeaders: {
        cookie: jar.header(),
        origin: ORIGIN,
      },
      timeout: 5000,
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`${label} socket connection timed out`));
    }, 6000);

    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });
    socket.once("connectionError", (error) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(`${label} connectionError: ${JSON.stringify(error)}`));
    });
  });
}

function waitForMessage(socket: SmokeSocket, expectedContent: string): Promise<SmokeMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for newMessage"));
    }, 6000);

    socket.on("newMessage", (message) => {
      if (message?.content === expectedContent) {
        clearTimeout(timer);
        resolve(message);
      }
    });
  });
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const senderName = `smoke_sender_${suffix}`.slice(0, 30);
  const receiverName = `smoke_recv_${suffix}`.slice(0, 30);
  const senderJar = new CookieJar();
  const receiverJar = new CookieJar();
  const createdUserIds: string[] = [];
  let receiverSocket: SmokeSocket | undefined;
  let senderSocket: SmokeSocket | undefined;

  try {
    await resetSmokeRateLimitBuckets(prisma);
    await cleanupSmokeUsers(prisma);

    const senderUser = await register(senderName);
    const receiverUser = await register(receiverName);
    createdUserIds.push(senderUser.id, receiverUser.id);

    const senderSession = await login(senderName, senderJar);
    const receiverSession = await login(receiverName, receiverJar);
    await request("/api/auth/session", {}, senderJar);
    await refresh(senderJar);
    await request("/api/users", {}, senderJar);

    receiverSocket = await connectSocket(receiverJar, "receiver");
    senderSocket = await connectSocket(senderJar, "sender");
    const content = `smoke message ${suffix}`;
    const messagePromise = waitForMessage(receiverSocket, content);

    senderSocket.emit("sendMessage", {
      content,
      receiverId: receiverSession.userId,
    });

    const message = await messagePromise;
    const history = parseMessageHistory(await request(`/api/messages/${receiverSession.userId}`, {}, senderJar));

    senderSocket.close();
    receiverSocket.close();
    await logout(senderJar);
    await logout(receiverJar);

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          senderId: senderSession.userId,
          receiverId: receiverSession.userId,
          websocketMessageId: message.id,
          historyCount: history.messages.length,
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    senderSocket?.close();
    receiverSocket?.close();
    await cleanupSmokeUsers(prisma, createdUserIds);
    await resetSmokeRateLimitBuckets(prisma, [senderName, receiverName]);
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
