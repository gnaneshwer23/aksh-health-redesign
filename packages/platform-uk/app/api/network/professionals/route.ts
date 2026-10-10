import { NextResponse } from "next/server";

import { requestNetworkContext } from "@/lib/network/context";
import { errorResponse } from "@/lib/network/http";
import { listProfessionals } from "@/lib/network/read";

export const dynamic = "force-dynamic";

/** GET /api/network/professionals?role=&region= — staff of the caller's organisations. */
export async function GET(request: Request) {
  const ctx = await requestNetworkContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to see your organisation" }, { status: 401 });
  const sp = new URL(request.url).searchParams;
  try {
    return NextResponse.json({ rows: await listProfessionals(ctx, { role: sp.get("role")?.slice(0, 40) || undefined, region: sp.get("region")?.slice(0, 64) || undefined }) });
  } catch (error) {
    return errorResponse(error);
  }
}
