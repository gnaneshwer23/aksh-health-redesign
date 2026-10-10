import { NextResponse } from "next/server";

import { networkSummary } from "@/lib/synthetic-world/queries";
import type { MarketCode } from "@/lib/synthetic-world/types";

export const dynamic = "force-dynamic";

const MARKETS = new Set(["GB", "IN", "US", "AE"]);

/** GET /api/network/summary?market= — aggregate view of the synthetic care network (any role). */
export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market");
  return NextResponse.json(networkSummary(market && MARKETS.has(market) ? (market as MarketCode) : undefined));
}
