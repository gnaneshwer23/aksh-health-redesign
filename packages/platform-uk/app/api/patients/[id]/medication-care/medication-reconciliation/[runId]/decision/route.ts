import { NextResponse } from "next/server";

import { denyUnlessConnectedDiabetesDecisionScope } from "@/lib/clinical-proof/connected-diabetes-decision-scope";
import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { decideMedCareReconciliation } from "@/lib/diabetes-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { id, runId } = await context.params;
  const patientId = id?.trim();
  const rid = runId?.trim();
  if (!patientId || !rid) {
    return NextResponse.json({ error: "patient id and run id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const personaDenied = denyUnlessConnectedDiabetesDecisionScope(
    auth.context.clinicalPersona,
    "medcare_reconciliation"
  );
  if (personaDenied) return personaDenied;

  let body: { action?: "complete" | "cancel"; note?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["complete", "cancel"].includes(body.action)) {
    return NextResponse.json({ error: "action must be complete | cancel" }, { status: 400 });
  }

  try {
    const snapshot = await decideMedCareReconciliation(
      {
        patientId,
        runId: rid,
        action: body.action,
        actor: auth.context.userEmail ?? auth.context.userId,
        note: body.note,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...snapshot,
      action: body.action,
      ehrWrite: false,
      autonomousPrescribe: false,
      decidedByPersona: auth.context.clinicalPersona,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Decision failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
