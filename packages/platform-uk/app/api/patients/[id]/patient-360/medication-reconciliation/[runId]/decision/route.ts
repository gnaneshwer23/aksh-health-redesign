import { NextResponse } from "next/server";

import { denyUnlessConnectedDiabetesDecisionScope } from "@/lib/clinical-proof/connected-diabetes-decision-scope";
import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { toUnifiedMedRecon } from "@/lib/diabetes-intelligence/med-recon-facade";
import { buildPatient360 } from "@/lib/patient-intelligence";
import { decideCanonicalMedReconciliation } from "@/lib/patient-intelligence/med-recon-canonical";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id: patientIdRaw, runId: runIdRaw } = await context.params;
  const patientId = patientIdRaw?.trim();
  const runId = runIdRaw?.trim();
  if (!patientId || !runId) {
    return NextResponse.json({ error: "patient id and run id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const personaDenied = denyUnlessConnectedDiabetesDecisionScope(
    auth.context.clinicalPersona,
    "patient360_reconciliation"
  );
  if (personaDenied) return personaDenied;

  let body: { action?: "complete" | "cancel"; note?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "complete" && body.action !== "cancel") {
    return NextResponse.json({ error: "action must be complete | cancel" }, { status: 400 });
  }

  try {
    const actor = auth.context.userEmail ?? auth.context.userId;
    const scopeKey = auth.context.scopeKey;
    // INT-04 — both entry surfaces decide via the same physical-store helper.
    const decided = await decideCanonicalMedReconciliation(
      {
        runId,
        action: body.action,
        actor,
        note: body.note,
      },
      { scopeKey }
    );
    const profile = await buildPatient360(patientId, { scopeKey });
    return NextResponse.json({
      ...profile,
      action: body.action,
      ehrWrite: false,
      autonomousPrescribe: false,
      decidedByPersona: auth.context.clinicalPersona,
      unifiedMedRecon: toUnifiedMedRecon(decided.run),
      physicalStore: decided.physicalStore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Decision failed";
    const status = /not found/i.test(message) ? 404 : /already/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
