import { NextResponse } from "next/server";

import { runPrismEval } from "@/lib/agents/prism-eval";
import { getPrismCapabilityStatus } from "@/lib/agents/phase2-capability-status";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * PRISM — P4 imaging intelligence eval scaffold (synthetic metadata only).
 * GET: honesty/status. POST: run fixture eval + Guardian/HITL hooks.
 * Never claims live imaging deployment or EHR write.
 */
export async function GET() {
  const status = getPrismCapabilityStatus();
  return NextResponse.json({
    available: true,
    mode: "synthetic_fixture_eval",
    live: false,
    liveImagingDeployment: false,
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

  const run = runPrismEval({ patientId: body.patientId, query: body.query });

  return NextResponse.json({
    ...run,
    actor: auth.context.userEmail ?? auth.context.userId,
  });
}
