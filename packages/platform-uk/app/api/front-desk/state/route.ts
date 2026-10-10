import { NextResponse } from "next/server";

import { withDeskDirectory } from "@/lib/front-desk/directory";
import { loadState } from "@/lib/front-desk/store";
import { buildFrontDeskView } from "@/lib/front-desk/view";

export const dynamic = "force-dynamic";

/** GET /api/front-desk/state — Front Desk console view. Sandbox practice data. */
async function handleGET() {
  const { state, storage } = await loadState();
  return NextResponse.json(buildFrontDeskView(state, storage), { headers: { "Cache-Control": "no-store" } });
}

/** Patients come from this request's database directory (see lib/front-desk/directory.ts). */
export async function GET() {
  return withDeskDirectory(() => handleGET());
}
