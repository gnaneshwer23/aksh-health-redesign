import { NextResponse } from "next/server";

import { exportOwnData } from "@/lib/export/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/me/export — the signed-in patient's own data as JSON (audited). */
export async function GET() {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const data = await exportOwnData(r.ctx, r.actor.email);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aksh-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error, "/api/me/export");
  }
}
