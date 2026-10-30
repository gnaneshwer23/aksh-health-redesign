import { NextResponse } from "next/server";

import { enforceAgentInvokeRateLimit } from "@/lib/agents/rate-limit-guards";
import { correlateCareEpisodeStage, readCareEpisodeId } from "@/lib/care-episode";
import {
  getClinicalSpineOrchestrateCapabilities,
  runClinicalSpineOrchestrate
} from "@/lib/clinical-spine/orchestrate";
import { AGENT_INVOKE_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

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
 * Optional careEpisodeId correlates CONDUCTOR run to the care-episode spine.
 */
export async function POST(request: Request) {
  const auth = await requireAppRole(request, AGENT_INVOKE_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const limited = await enforceAgentInvokeRateLimit(request, auth.context.userId);
  if (limited) return limited;

  let body: {
    patientId?: string;
    proposedDrug?: string;
    transcript?: string;
    includeDrAssist?: boolean;
    includeNexus?: boolean;
    includeTwinRanking?: boolean;
    caseId?: string;
    careEpisodeId?: string;
    care_episode_id?: string;
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

  const actor = auth.context.userEmail ?? auth.context.userId;

  try {
    const result = await runClinicalSpineOrchestrate({
      patientId,
      proposedDrug: body.proposedDrug,
      transcript: body.transcript,
      includeDrAssist: body.includeDrAssist ?? false,
      includeNexus: body.includeNexus !== false,
      includeTwinRanking: body.includeTwinRanking !== false,
      caseId: body.caseId,
      actor
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

    const correlated = await correlateCareEpisodeStage({
      patientId,
      actor,
      scopeKey: auth.context.scopeKey,
      careEpisodeId: readCareEpisodeId(body),
      stage: "orchestrate",
      linkId: body.caseId ?? `orch-${patientId}-${Date.now()}`,
      linkLabel: "CONDUCTOR orchestrate",
    });

    return NextResponse.json({
      ...result,
      careEpisodeId: correlated.careEpisodeId,
      orchestratorContract: "clinical_spine_conductor",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Orchestration failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status: 500 });
  }
}
