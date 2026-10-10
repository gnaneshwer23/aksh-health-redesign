import { NextResponse } from "next/server";

import { requestNetworkContext } from "@/lib/network/context";
import { errorResponse } from "@/lib/network/http";
import { networkSummary } from "@/lib/network/read";

export const dynamic = "force-dynamic";

/** GET /api/network/summary?region= — aggregates over what the caller's organisations can see (RLS-scoped). */
export async function GET(request: Request) {
  const ctx = await requestNetworkContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to see your care network" }, { status: 401 });
  try {
    const region = new URL(request.url).searchParams.get("region")?.slice(0, 64) || undefined;
    return NextResponse.json(await networkSummary(ctx, region));
  } catch (error) {
    return errorResponse(error);
  }
}
