import { NextResponse } from "next/server";

import { loadNetworkContext } from "@/lib/network/context";
import { errorResponse, requireActor } from "@/lib/network/http";
import { getOwnRecord } from "@/lib/network/read";

export const dynamic = "force-dynamic";

/**
 * The signed-in patient's own record. Scope comes from the server-side account link (patient_accounts) and
 * row-level security; a patient can never name another record in the request.
 */
export async function GET() {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  if (actor.role !== "patient") return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
  try {
    const ctx = await loadNetworkContext(actor.userId, actor.role);
    const record = await getOwnRecord(ctx);
    return NextResponse.json(record ? { linked: true, record } : { linked: false });
  } catch (error) {
    return errorResponse(error);
  }
}
