type CounterMap = Record<string, number>;

export type RuntimeMetricsSnapshot = {
  startedAt: string;
  uptimeSeconds: number;
  httpRequestsTotal: number;
  httpResponsesByStatus: CounterMap;
  authRejectionsByReason: CounterMap;
  csrfRejectionsTotal: number;
  originRejectionsTotal: number;
  rateLimitDecisionsByScope: Record<string, { allowed: number; blocked: number }>;
  websocketRejectionsByReason: CounterMap;
  websocketMessageRateLimitRejectionsTotal: number;
};

const startedAtMs = Date.now();
const httpResponsesByStatus: CounterMap = {};
const authRejectionsByReason: CounterMap = {};
const websocketRejectionsByReason: CounterMap = {};
const rateLimitDecisionsByScope: Record<string, { allowed: number; blocked: number }> = {};

let httpRequestsTotal = 0;
let csrfRejectionsTotal = 0;
let originRejectionsTotal = 0;
let websocketMessageRateLimitRejectionsTotal = 0;

function increment(map: CounterMap, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function cloneRateLimitDecisions(): Record<string, { allowed: number; blocked: number }> {
  return Object.fromEntries(
    Object.entries(rateLimitDecisionsByScope).map(([scope, counters]) => [
      scope,
      { ...counters },
    ])
  );
}

export const runtimeMetrics = {
  recordHttpResponse(statusCode: number): void {
    httpRequestsTotal += 1;
    increment(httpResponsesByStatus, String(statusCode));
  },

  recordAuthRejection(reason: string): void {
    increment(authRejectionsByReason, reason);
  },

  recordCsrfRejection(): void {
    csrfRejectionsTotal += 1;
  },

  recordOriginRejection(): void {
    originRejectionsTotal += 1;
  },

  recordRateLimitDecision(scope: string, allowed: boolean): void {
    const counters = rateLimitDecisionsByScope[scope] ?? { allowed: 0, blocked: 0 };
    if (allowed) {
      counters.allowed += 1;
    } else {
      counters.blocked += 1;
    }
    rateLimitDecisionsByScope[scope] = counters;
  },

  recordWebSocketRejection(reason: string): void {
    increment(websocketRejectionsByReason, reason);
  },

  recordWebSocketMessageRateLimitRejection(): void {
    websocketMessageRateLimitRejectionsTotal += 1;
  },

  snapshot(): RuntimeMetricsSnapshot {
    return {
      startedAt: new Date(startedAtMs).toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      httpRequestsTotal,
      httpResponsesByStatus: { ...httpResponsesByStatus },
      authRejectionsByReason: { ...authRejectionsByReason },
      csrfRejectionsTotal,
      originRejectionsTotal,
      rateLimitDecisionsByScope: cloneRateLimitDecisions(),
      websocketRejectionsByReason: { ...websocketRejectionsByReason },
      websocketMessageRateLimitRejectionsTotal,
    };
  },
};
