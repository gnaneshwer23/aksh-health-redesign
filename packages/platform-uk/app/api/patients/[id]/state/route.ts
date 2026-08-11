import { NextResponse } from "next/server";

import { getPatientById } from "@/lib/mock-data";
import { getPatientStateSnapshot, listPatientStateFacts } from "@/lib/patient-state/repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

/**
 * Patient State foundation read endpoint (C1 — docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1). Read-only —
 * no existing endpoint's response shape changes; this is a net-new route.
 */
export const maxDuration = 30;

type RouteContext = { params: { id: string } };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
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
    ehrWrite: false,
    note:
      "Patient State foundation (C1) — versioned, append-only fact store. Additive infrastructure; existing ReviewCase/timeline/diabetes-fixture read paths are not yet re-pointed at this store."
  });
}
