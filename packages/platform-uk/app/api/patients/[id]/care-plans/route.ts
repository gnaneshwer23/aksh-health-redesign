import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { toPatientVisibleCarePlans } from "@/lib/care-episode/stakeholder-handoffs";
import {
  listPatientVisibleCarePlans,
  listUnifiedCarePlans,
} from "@/lib/diabetes-intelligence/care-plan-facade";
import { listCarePlans } from "@/lib/diabetes-intelligence/repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Care-plan read surface over canonical SoT (`care_plan_records`).
 * Patient role → APPROVED only (drafts / rejected never leak).
 * Clinical roles → full unified list for HITL review.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const url = new URL(request.url);
  const organisationId = url.searchParams.get("organisationId")?.trim() || null;
  const forcePatientVisibility =
    url.searchParams.get("visibility") === "patient" || auth.context.userRole === "patient";

  const scopeKey = auth.context.scopeKey;

  if (forcePatientVisibility) {
    const journeyApproved = (
      await listCarePlans(patientId, { scopeKey, organisationId })
    ).filter((p) => p.status === "APPROVED");
    const patientFacing = toPatientVisibleCarePlans(journeyApproved);
    // Facade covers any legacy unlinked medcare APPROVED rows not yet in SoT.
    const facadeApproved = await listPatientVisibleCarePlans(patientId, {
      scopeKey,
      organisationId,
    });
    const seen = new Set(patientFacing.map((p) => p.id));
    const merged = [
      ...patientFacing,
      ...facadeApproved
        .filter((p) => !seen.has(p.id))
        .map((p) => ({
          id: p.id,
          patientId: p.patientId,
          title: p.title,
          status: "APPROVED" as const,
          version: p.version,
          decidedAt: p.decidedAt,
          sections: p.sections,
          synthetic: true as const,
          ehrWrite: false as const,
          draftsHidden: true as const,
        })),
    ];
    return NextResponse.json({
      patientId,
      plans: merged,
      patientVisibleOnly: true,
      draftsHidden: true,
      hitlRequired: true,
      ehrWrite: false,
      note: "Patient care plans — APPROVED only; DRAFT/REJECTED never returned; ehrWrite=false.",
    });
  }

  const plans = await listUnifiedCarePlans(patientId, { scopeKey, organisationId });
  return NextResponse.json({
    patientId,
    plans,
    patientVisibleOnly: false,
    draftsHidden: false,
    hitlRequired: true,
    ehrWrite: false,
    note: "Clinician care-plan list — includes DRAFT pending HITL; ehrWrite=false.",
  });
}
