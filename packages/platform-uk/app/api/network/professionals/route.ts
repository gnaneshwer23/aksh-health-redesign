import { NextResponse } from "next/server";

import { listProfessionals } from "@/lib/synthetic-world/queries";
import type { MarketCode } from "@/lib/synthetic-world/types";

export const dynamic = "force-dynamic";

const MARKETS = new Set(["GB", "IN", "US", "AE"]);

/** GET /api/network/professionals — synthetic professional directory (no patient data). */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const market = sp.get("market");
  return NextResponse.json({
    rows: listProfessionals({
      market: market && MARKETS.has(market) ? (market as MarketCode) : undefined,
      role: sp.get("role")?.slice(0, 40) || undefined,
      q: sp.get("q")?.slice(0, 80) || undefined,
    }),
  });
}
