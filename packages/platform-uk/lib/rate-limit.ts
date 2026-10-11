import { createHash } from "node:crypto";

import { getPgPool, isPostgresConfigured } from "./db/client";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, RateLimitEntry>();

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
};

/**
 * Rate limit shared across all server instances: a fixed window counted in the database (one atomic upsert per call).
 * Falls back to a per-instance memory counter when the database is not configured or unreachable, so a database
 * outage never turns into "no limit at all". DISABLE_RATE_LIMIT=true switches limits off (CI and local tests only).
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (process.env.DISABLE_RATE_LIMIT === "true") return { success: true, limit, remaining: limit };
  if (!isPostgresConfigured()) return checkMemoryRateLimit(key, limit, windowMs);
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  try {
    const r = await getPgPool().query<{ count: number }>(
      `INSERT INTO aksh.rate_limits (key_hash, window_start, count) VALUES ($1, $2, 1)
       ON CONFLICT (key_hash, window_start) DO UPDATE SET count = aksh.rate_limits.count + 1
       RETURNING count`,
      [createHash("sha256").update(key).digest("hex"), new Date(windowStart)]
    );
    const count = r.rows[0]!.count;
    if (count > limit) {
      return { success: false, limit, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)) };
    }
    return { success: true, limit, remaining: limit - count };
  } catch {
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}

/** Per-instance fallback (and the previous behaviour). */
export function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { success: true, limit, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return { success: true, limit, remaining: limit - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function rateLimitResponse(result: RateLimitResult, message: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (result.retryAfterSeconds) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return new Response(
    JSON.stringify({
      error: message,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers,
    }
  );
}
