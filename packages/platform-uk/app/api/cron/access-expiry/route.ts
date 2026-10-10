import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sweepExpiredSlots } from "@/lib/access/service";

export const dynamic = "force-dynamic";

/** GET /api/cron/access-expiry — scheduled backstop that closes slots whose offer window has passed. Requires CRON_SECRET. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const ok = Boolean(secret) && secret!.length >= 16 && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await sweepExpiredSlots());
  } catch (error) {
    console.error("[cron/access-expiry]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
