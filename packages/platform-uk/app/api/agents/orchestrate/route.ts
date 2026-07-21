import { NextResponse } from "next/server";

import {
  getClinicalSpineOrchestrateCapabilities,
  runClinicalSpineOrchestrate
} from "@/lib/clinical-spine/orchestrate";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 60;

/**
 * GET /api/agents/orchestrate — capabilities + ORACLE model card honesty flags.
 */
export async function GET() {
  return NextResponse.json(getClinicalSpineOrchestrateCapabilities());
}

/**
 * POST /api/agents/orchestrate — SYNTHESIS → GUARDIAN → ORACLE → NEXUS (+ twin ranking).
 * Drafts only; ehrWrite:false; HITL required; physiologicalTwin:false; liveEmis:false.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    patientId?: string;
    proposedDrug?: string;
    transcript?: string;
    includeDrAssist?: boolean;
    includeNexus?: boolean;
    includeTwinRanking?: boolean;
    caseId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  try {
    const result = await runClinicalSpineOrchestrate({
      patientId,
      proposedDrug: body.proposedDrug,
      transcript: body.transcript,
      includeDrAssist: body.includeDrAssist ?? false,
      includeNexus: body.includeNexus !== false,
      includeTwinRanking: body.includeTwinRanking !== false,
      caseId: body.caseId,
      actor: auth.context.userEmail ?? auth.context.userId
    });

    if (
      result.ehrWrite !== false ||
      result.physiologicalTwin !== false ||
      result.autoRetrain !== false ||
      result.liveEmis !== false
    ) {
      return NextResponse.json(
        { error: "Honesty invariants violated — refusing response." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Orchestration failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status: 500 });
  }
}
