import { NextResponse } from "next/server";

import { requestNetworkContext } from "@/lib/network/context";
import { errorResponse } from "@/lib/network/http";
import { listPatients } from "@/lib/network/read";
import { patientLevelAccess } from "@/lib/network/access";

export const dynamic = "force-dynamic";

const TYPES = new Set(["type_2", "type_1", "prediabetes", "gestational", "lada", "mody"]);
const BANDS = new Set(["Low", "Medium", "High", "VeryHigh"]);

/** GET /api/network/patients — patient registry: clinical roles only, rows decided by row-level security. */
export async function GET(request: Request) {
  const access = await patientLevelAccess();
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const ctx = await requestNetworkContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to see your patients" }, { status: 401 });
  const sp = new URL(request.url).searchParams;
  const type = sp.get("type");
  const band = sp.get("band");
  try {
    return NextResponse.json(
      await listPatients(ctx, {
        region: sp.get("region")?.slice(0, 64) || undefined,
        type: type && TYPES.has(type) ? type : undefined,
        band: band && BANDS.has(band) ? band : undefined,
        gap: sp.get("gap")?.slice(0, 80) || undefined,
        q: sp.get("q")?.slice(0, 80) || undefined,
        orgId: sp.get("org")?.slice(0, 64) || undefined,
        page: Number(sp.get("page")) || 1,
        pageSize: Number(sp.get("pageSize")) || 25,
      })
    );
  } catch (error) {
    return errorResponse(error);
  }
}
