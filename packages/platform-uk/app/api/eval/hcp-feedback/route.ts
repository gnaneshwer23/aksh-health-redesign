/**
 * Milestone B — capture / summarise structured HCP clinician feedback.
 * POST: clinical reviewers · GET summary: Agent Ops roles (no PHI free-text).
 */
import { NextResponse } from "next/server";

import type { HcpFeedbackDecision, HcpFeedbackInput, HcpRubricScore } from "@/lib/eval/hcp-feedback";
import { HCP_RUBRIC_IDS } from "@/lib/eval/hcp-feedback";
import {
  getHcpEvalFeedbackAdminSummary,
  listHcpEvalFeedback,
  recordHcpEvalFeedback,
} from "@/lib/repositories/hcp-eval-feedback-repository";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { AGENT_OPS_ROLES, REVIEW_DECISION_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAppRole(request, AGENT_OPS_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "summary";

  if (view === "rubrics") {
    return NextResponse.json({
      rubricIds: HCP_RUBRIC_IDS,
      scoreRange: [1, 5],
      justificationRequiredWhenScoreAtMost: 3,
      clinicalValidationClaim: false,
      note: "Human-scored rubrics for synthetic HCP sessions only.",
    });
  }

  if (view === "raw") {
    // Ops may list ids + decisions only — strip free-text / raw patient ids.
    const { records, source } = await listHcpEvalFeedback({
      scopeKey: auth.context.scopeKey,
      limit: Number(url.searchParams.get("limit") ?? "50"),
    });
    return NextResponse.json({
      source,
      count: records.length,
      clinicalValidationClaim: false,
      ehrWrite: false,
      events: records.map((r) => ({
        id: r.id,
        recordedAt: r.recordedAt,
        casePackCaseId: r.casePackCaseId,
        agentLabel: r.agentLabel,
        decision: r.decision,
        safetyMiss: Boolean(r.safetyMiss),
        recommendation: r.recommendation ?? null,
        rubricCount: r.rubrics.length,
        meanRubric:
          r.rubrics.length === 0
            ? null
            : r.rubrics.reduce((a, b) => a + b.score, 0) / r.rubrics.length,
      })),
      note: "Facilitator notes and synthetic patient ids omitted — use review queue for case detail.",
    });
  }

  const summary = await getHcpEvalFeedbackAdminSummary({ scopeKey: auth.context.scopeKey });
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const auth = await requireAppRole(request, REVIEW_DECISION_ROLES);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    casePackCaseId?: string;
    agentLabel?: string;
    decision?: string;
    syntheticPatientId?: string;
    predictionId?: string;
    sessionId?: string;
    facilitatorNotes?: string;
    safetyMiss?: boolean;
    safetyMissDetail?: string;
    rubrics?: HcpRubricScore[];
    trustHonestyLabels?: number;
    recommendation?: "proceed" | "hold" | "redesign";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.casePackCaseId?.trim() || !body.agentLabel?.trim()) {
    return NextResponse.json(
      { error: "casePackCaseId and agentLabel are required." },
      { status: 400 }
    );
  }

  const input: HcpFeedbackInput = {
    casePackCaseId: body.casePackCaseId.trim(),
    agentLabel: body.agentLabel.trim(),
    decision: body.decision as HcpFeedbackDecision,
    syntheticPatientId: body.syntheticPatientId,
    predictionId: body.predictionId,
    sessionId: body.sessionId,
    facilitatorNotes: body.facilitatorNotes,
    safetyMiss: body.safetyMiss,
    safetyMissDetail: body.safetyMissDetail,
    rubrics: body.rubrics ?? [],
    trustHonestyLabels: body.trustHonestyLabels,
    recommendation: body.recommendation,
  };

  try {
    const tenant = resolveTenantContext(request, auth.context);
    const { record, source, shieldLogged } = await recordHcpEvalFeedback(input, {
      scopeKey: auth.context.scopeKey,
      decisionActor: auth.context.userEmail ?? auth.context.userId,
      practiceId: tenant.practiceId,
    });

    return NextResponse.json({
      recorded: true,
      source,
      shieldLogged,
      ehrWrite: false,
      hitlRequired: true,
      clinicalValidationClaim: false,
      syntheticOnly: true,
      // Echo minimal fields; full notes stay in scoped file store for facilitators.
      event: {
        id: record.id,
        recordedAt: record.recordedAt,
        casePackCaseId: record.casePackCaseId,
        agentLabel: record.agentLabel,
        decision: record.decision,
        rubricCount: record.rubrics.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record HCP feedback" },
      { status: 400 }
    );
  }
}
