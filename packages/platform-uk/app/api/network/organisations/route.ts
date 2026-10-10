import { NextResponse } from "next/server";

import { listOrganisations } from "@/lib/synthetic-world/queries";
import type { MarketCode, OrgKind } from "@/lib/synthetic-world/types";

export const dynamic = "force-dynamic";

const MARKETS = new Set(["GB", "IN", "US", "AE"]);
const KINDS = new Set(["primary_care_clinic", "diabetes_centre", "hospital", "community_pharmacy", "laboratory", "payer", "research_institute", "device_partner"]);

/** GET /api/network/organisations — clinics, pharmacies, labs, payers and partners (synthetic). */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const market = sp.get("market");
  const kind = sp.get("kind");
  return NextResponse.json({
    rows: listOrganisations({
      market: market && MARKETS.has(market) ? (market as MarketCode) : undefined,
      kind: kind && KINDS.has(kind) ? (kind as OrgKind) : undefined,
    }),
  });
}
