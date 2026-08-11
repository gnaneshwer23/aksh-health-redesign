import { NextResponse } from "next/server";

import { buildDiabetesRiskContribution, recordDiabetesCoachingAccept } from "@/lib/disease-modules/diabetes";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: { id: string } };

/**
 * POST /api/patients/[id]/diabetes-coaching/accept — C5 minimum bar
 * (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-1).
 *
 * The existing HITL Accept flow for a diabetes coaching draft: a clinician
 * accepts one Nutrition/Exercise/Behaviour draft, which records a learning
 * event with that draft's diabetes-specific agentLabel via
 * recordDiabetesCoachingAccept (lib/disease-modules/diabetes/learning.ts) —
 * the same recordLearningEvent path every other agent's Accept already
 * uses. Gated exactly like GET .../diabetes-coaching: ENABLE_DIABETES_MODULE
 * must be true and the patient must be diabetes-flagged, otherwise this is
 * an honest 404 — never a fabricated acceptance.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  let body: { moduleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const moduleId = body.moduleId?.trim().toUpperCase();
  if (moduleId !== "NUTRITION" && moduleId !== "EXERCISE" && moduleId !== "BEHAVIOUR") {
    return NextResponse.json({ error: "moduleId must be one of: NUTRITION, EXERCISE, BEHAVIOUR" }, { status: 400 });
  }

  const diabetesModuleEnabled = isDiabetesModuleEnabled();
  const diabetesFlagged = Boolean(getPatientById(patientId)?.clinicalProfiles?.includes("t2d"));
  if (!diabetesModuleEnabled || !diabetesFlagged) {
    return NextResponse.json(
      { error: "Diabetes coaching is unavailable for this patient — module disabled or not diabetes-flagged." },
      { status: 404 }
    );
  }

  const { coachingDrafts } = buildDiabetesRiskContribution({
    patientId,
    patientLabel: getPatientById(patientId)?.name
  });
  const draft = coachingDrafts.find((d) => d.moduleId === moduleId);
  if (!draft) {
    return NextResponse.json({ error: `No ${moduleId} coaching draft available for this patient.` }, { status: 404 });
  }

  const { event, source, shieldAuditWriteFailed } = await recordDiabetesCoachingAccept(
    {
      draft,
      decisionActor: auth.context.userEmail ?? auth.context.userId
    },
    { scopeKey: auth.context.scopeKey }
  );

  return NextResponse.json({
    recorded: true,
    source,
    autoRetrainTriggered: false,
    modelUpdated: false,
    ehrWrite: false,
    hitlRequired: true,
    shieldAuditWriteFailed,
    event
  });
}
