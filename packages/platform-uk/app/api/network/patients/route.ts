import { NextResponse } from "next/server";

import { patientLevelAccess } from "@/lib/synthetic-world/access";
import { listPatients } from "@/lib/synthetic-world/queries";
import type { DiabetesType, MarketCode } from "@/lib/synthetic-world/types";

export const dynamic = "force-dynamic";

const MARKETS = new Set(["GB", "IN", "US", "AE"]);
const TYPES = new Set(["type_2", "type_1", "prediabetes", "gestational", "lada", "mody"]);
const BANDS = new Set(["Low", "Medium", "High", "VeryHigh"]);

/** GET /api/network/patients — synthetic patient registry (clinical roles and public demo only). */
export async function GET(request: Request) {
  const access = await patientLevelAccess();
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const market = sp.get("market");
  const type = sp.get("type");
  const band = sp.get("band");
  return NextResponse.json(
    listPatients({
      market: market && MARKETS.has(market) ? (market as MarketCode) : undefined,
      type: type && TYPES.has(type) ? (type as DiabetesType) : undefined,
      band: band && BANDS.has(band) ? band : undefined,
      gap: sp.get("gap")?.slice(0, 80) || undefined,
      q: sp.get("q")?.slice(0, 80) || undefined,
      orgId: sp.get("org")?.slice(0, 30) || undefined,
      professionalId: sp.get("professional")?.slice(0, 20) || undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 25,
    })
  );
}
