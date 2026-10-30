import { NextResponse } from "next/server";

import { denyUnlessConnectedDiabetesDecisionScope } from "@/lib/clinical-proof/connected-diabetes-decision-scope";
import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { decideMedicationSafetyReview } from "@/lib/diabetes-intelligence";
import type { MedCareReviewSection } from "@/lib/diabetes-intelligence/medcare-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; reviewId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id, reviewId } = await context.params;
  const patientId = id?.trim();
  const rid = reviewId?.trim();
  if (!patientId || !rid) {
    return NextResponse.json({ error: "patient id and review id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const personaDenied = denyUnlessConnectedDiabetesDecisionScope(
    auth.context.clinicalPersona,
    "medcare_safety_review"
  );
  if (personaDenied) return personaDenied;

  let body: {
    action?: "accept" | "edit" | "reject";
    reason?: string;
    editedSections?: MedCareReviewSection[];
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["accept", "edit", "reject"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be accept | edit | reject" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await decideMedicationSafetyReview(
      {
        patientId,
        reviewId: rid,
        action: body.action,
        actor: auth.context.userEmail ?? auth.context.userId,
        reason: body.reason,
        editedSections: body.editedSections,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...snapshot,
      action: body.action,
      ehrWrite: false,
      autonomousPrescribe: false,
      validatedCds: false,
      decidedByPersona: auth.context.clinicalPersona,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Decision failed";
    const code = (err as { code?: string }).code;
    const shieldAuditWriteReason = (err as { shieldAuditWriteReason?: string }).shieldAuditWriteReason;
    return NextResponse.json(
      {
        error: message,
        ehrWrite: false,
        ...(code ? { code } : {}),
        ...(status === 503
          ? {
              shieldAuditWriteFailed: true,
              shieldAuditWriteReason: shieldAuditWriteReason ?? message,
              decisionFinalised: false,
            }
          : {}),
      },
      { status }
    );
  }
}
