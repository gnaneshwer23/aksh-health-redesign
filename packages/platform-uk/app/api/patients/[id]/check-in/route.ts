import { NextResponse } from "next/server";

import { evaluatePatientUrlAccess } from "@/lib/clinical-proof/tenant-isolation";
import { checkInInputSchema, runPatientCheckIn } from "@/lib/patient-companion/check-in";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: { id: string } };

/**
 * POST /api/patients/[id]/check-in — B5 (docs/PHASED_BUILD_PLAN.md).
 *
 * Patient self-report check-in (mood / symptom / medication-adherence). Scoped to the
 * authenticated patient's own bound record only (FR-PER-006, FR-CORE-005, FR-PER-014 —
 * `evaluatePatientUrlAccess`); fails closed (403) rather than allowing a cross-patient write or
 * a write with no bound patient id on the session. Only the `patient` AppRole may call this
 * route — no `clinical_reviewer`/`researcher`/`operations_lead`/`restricted` fallthrough. Every
 * write is SHIELD-audited (`shieldAuditWriteFailed` is always surfaced, never silently
 * swallowed — B1 fail-visible pattern). A self-disclosed self-harm/crisis, red-flag-symptom, or
 * diabetes-distress signal routes to a clinician-visible escalation task, never handled
 * autonomously.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  if (auth.context.userRole !== "patient") {
    return NextResponse.json(
      {
        error: `Role "${auth.context.userRole}" may not submit a patient check-in — patient AppRole only.`,
        denied: true
      },
      { status: 403 }
    );
  }

  const access = evaluatePatientUrlAccess({
    role: "patient",
    boundPatientId: auth.context.boundPatientId,
    requestedPatientId: patientId
  });
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason, denied: true },
      { status: access.status === 400 ? 403 : access.status }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = checkInInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid check-in payload.",
        issues: parsed.error.issues.map((issue) => issue.message)
      },
      { status: 400 }
    );
  }

  const result = await runPatientCheckIn(patientId, parsed.data, {
    scopeKey: auth.context.scopeKey,
    actor: auth.context.userEmail ?? auth.context.userId
  });

  return NextResponse.json(result);
}
