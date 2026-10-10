import { NextResponse } from "next/server";

import { loadState } from "@/lib/front-desk/store";
import { buildFrontDeskView } from "@/lib/front-desk/view";

export const dynamic = "force-dynamic";

/** GET /api/front-desk/state — Front Desk console view. Synthetic practice data only (Track A). */
export async function GET() {
  const { state, storage } = await loadState();
  return NextResponse.json(buildFrontDeskView(state, storage), { headers: { "Cache-Control": "no-store" } });
}
