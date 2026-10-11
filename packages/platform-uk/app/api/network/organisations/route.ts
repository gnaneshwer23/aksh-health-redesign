import { NextResponse } from "next/server";

import { requestNetworkContext } from "@/lib/network/context";
import { errorResponse } from "@/lib/network/http";
import { listOrganisations } from "@/lib/network/read";

export const dynamic = "force-dynamic";

/** GET /api/network/organisations?region= — the caller's organisations. */
export async function GET(request: Request) {
  const ctx = await requestNetworkContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to see your organisations" }, { status: 401 });
  try {
    // Patients see their clinic on their own record; the organisation directory is for staff.
    if (ctx.role === "patient") return NextResponse.json({ rows: [] });
    return NextResponse.json({ rows: await listOrganisations(ctx, { region: new URL(request.url).searchParams.get("region")?.slice(0, 64) || undefined }) });
  } catch (error) {
    return errorResponse(error);
  }
}
