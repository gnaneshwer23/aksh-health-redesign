import { timingSafeEqual } from "node:crypto";

/** Scheduled jobs authenticate with CRON_SECRET (Vercel sends it as a bearer token). Constant-time comparison. */
export function isAuthorisedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  return Boolean(secret) && secret!.length >= 16 && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
}
