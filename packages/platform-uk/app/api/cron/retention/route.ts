import { NextResponse } from "next/server";

import { isAuthorisedCron } from "@/lib/cron/auth";
import { reportError } from "@/lib/observability/errors";
import { runRetention } from "@/lib/retention/service";

export const dynamic = "force-dynamic";

/** GET /api/cron/retention — daily: removes expired error events and rate-limit windows. Requires CRON_SECRET. */
export async function GET(request: Request) {
  if (!isAuthorisedCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runRetention());
  } catch (error) {
    await reportError(error, { source: "cron", route: "/api/cron/retention" });
    return NextResponse.json({ error: "Retention failed" }, { status: 500 });
  }
}
