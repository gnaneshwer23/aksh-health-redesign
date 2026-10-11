import { NextResponse } from "next/server";

import { evaluateAppRoleClinicalReadAccess } from "@/lib/clinical-proof/tenant-isolation";
import { getPatientById } from "@/lib/mock-data";
import { getPatientStateSnapshot, listPatientStateFacts } from "@/lib/patient-state/repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * Patient State foundation read endpoint (C1 — docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1). Read-only —
 * no existing endpoint's response shape changes; this is a net-new route.
 */
export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const access = evaluateAppRoleClinicalReadAccess({
    appRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
    requestedPatientId: patientId,
  });
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason, denied: true }, { status: access.status });
  }

  const patient = getPatientById(patientId);
  const [snapshot, factHistory] = await Promise.all([
    getPatientStateSnapshot(patientId),
    listPatientStateFacts(patientId)
  ]);

  return NextResponse.json({
    artifactType: "aksh-patient-state-snapshot",
    patientId,
    patientLabel: patient?.name ?? patientId,
    snapshot,
    factHistorySource: factHistory.source,
    factHistoryCount: factHistory.facts.length,
    // D5 (docs/PHASED_BUILD_PLAN_D.md, P2-3): the full ordered fact history —
    // current AND superseded facts alike, exactly what listPatientStateFacts
    // already returned above — additive to this response; every pre-existing
    // field is unchanged. Powers the read-only Patient State timeline panel.
    facts: factHistory.facts,
    ehrWrite: false,
    note:
      "Patient State foundation (C1) — versioned, append-only fact store. Additive infrastructure; existing ReviewCase/timeline/diabetes-fixture read paths are not yet re-pointed at this store."
  });
}
