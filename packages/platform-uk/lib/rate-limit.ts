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
 * Lightweight in-memory sliding-window rate limiter for serverless instances.
 * Limits are per-instance, not global across Vercel regions.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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
