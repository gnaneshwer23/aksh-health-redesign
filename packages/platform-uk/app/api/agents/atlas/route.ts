import { NextResponse } from "next/server";

import { runAtlasEval } from "@/lib/agents/atlas-eval";
import { getAtlasCapabilityStatus } from "@/lib/agents/phase2-capability-status";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * ATLAS — P4 clinical research intelligence eval scaffold (controlled data).
 * GET: honesty/status. POST: run protocol/cohort fixture eval + Guardian/HITL hooks.
 * No unapproved clinical enablement; no patient-level export; no EHR write.
 */
export async function GET() {
  const status = getAtlasCapabilityStatus();
  return NextResponse.json({
    available: true,
    mode: "synthetic_fixture_eval",
    live: false,
    clinicalEnablementApproved: false,
    patientLevelExport: false,
    wiredToConductor: false,
    ehrWrite: false,
    maturity: status.maturity,
    note: status.description,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; query?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const run = runAtlasEval({ patientId: body.patientId, query: body.query });

  return NextResponse.json({
    ...run,
    actor: auth.context.userEmail ?? auth.context.userId,
  });
}
