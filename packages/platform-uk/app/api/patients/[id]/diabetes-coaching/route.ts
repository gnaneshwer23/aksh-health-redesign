import { NextResponse } from "next/server";

import { buildDiabetesRiskContribution, type DiabetesCoachingDraft } from "@/lib/disease-modules/diabetes";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: { id: string } };

/**
 * GET /api/patients/[id]/diabetes-coaching — B4 (docs/PHASED_BUILD_PLAN.md).
 *
 * Read-only Nutrition/Exercise/Behaviour coaching drafts for the patient-companion "coaching
 * surface" (FR-DIAB-012's routing partition: coaching drafts go to the patient companion, not the
 * clinician review queue, unless a clinicalEscalationHints trigger fires — that escalation routing
 * is unchanged, this endpoint only ever returns the coaching_draft_only artifacts). Gated exactly
 * like lib/clinical-spine/orchestrate.ts's HORIZON/GUARDIAN wiring: ENABLE_DIABETES_MODULE=true AND
 * the patient is diabetes-flagged (clinicalProfiles includes "t2d"). When either is false this
 * returns an honest `available: false` with an empty draft list — never a fabricated draft.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const diabetesModuleEnabled = isDiabetesModuleEnabled();
  const diabetesFlagged = Boolean(getPatientById(patientId)?.clinicalProfiles?.includes("t2d"));
  const available = diabetesModuleEnabled && diabetesFlagged;

  const coachingDrafts: DiabetesCoachingDraft[] = available
    ? buildDiabetesRiskContribution({
        patientId,
        patientLabel: getPatientById(patientId)?.name
      }).coachingDrafts
    : [];

  return NextResponse.json({
    patientId,
    available,
    diabetesModuleEnabled,
    diabetesFlagged,
    coachingDrafts,
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false,
    note: available
      ? "Diabetes coaching drafts (Nutrition/Exercise/Behaviour) — wellness talking points only, not clinical advice, not a diagnosis. Demo/synthetic-cohort data. HITL required before any care-plan attachment; a clinical escalation hint routes to your care team, never handled autonomously."
      : "Diabetes coaching is off for this patient — either the module flag is disabled or this record is not diabetes-flagged in the demo cohort."
  });
}
