import { NextResponse } from "next/server";

import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import {
  buildConnectedDiabetesOrchestration,
  runConnectedDiabetesPipeline,
} from "@/lib/diabetes-intelligence/connected-journey-orchestrate";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const snapshot = await buildConnectedDiabetesOrchestration(patientId, {
    scopeKey: auth.context.scopeKey,
  });
  return NextResponse.json(snapshot);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  let body: { action?: "run_pipeline" | "seed_all" | "status" } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const scopeKey = auth.context.scopeKey;

  if (body.action === "status" || !body.action) {
    const snapshot = await buildConnectedDiabetesOrchestration(patientId, { scopeKey });
    return NextResponse.json({ ...snapshot, action: "status" });
  }

  if (body.action === "run_pipeline" || body.action === "seed_all") {
    const result = await runConnectedDiabetesPipeline(patientId, {
      scopeKey,
      actor,
      mode: body.action,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: "action must be run_pipeline | seed_all | status" },
    { status: 400 }
  );
}
