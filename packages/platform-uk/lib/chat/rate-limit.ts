import { checkRateLimit } from "../rate-limit";

/** Public chat: 12 requests a minute per address, counted across all server instances. */
export async function checkChatRateLimit(key: string): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const r = await checkRateLimit(`chat:${key}`, 12, 60_000);
  return r.success ? { ok: true } : { ok: false, retryAfterSec: r.retryAfterSeconds ?? 60 };
}

export function clientKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
