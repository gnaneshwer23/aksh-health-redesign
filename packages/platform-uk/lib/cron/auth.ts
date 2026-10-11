import { timingSafeEqual } from "node:crypto";

/** Scheduled jobs authenticate with CRON_SECRET (Vercel sends it as a bearer token). Constant-time comparison. */
export function isAuthorisedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!secret || secret.length < 16) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b); // compare byte lengths first: timingSafeEqual throws otherwise
}
