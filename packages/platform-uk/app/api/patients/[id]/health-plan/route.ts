import { NextResponse } from "next/server";

import { getPatientById } from "@/lib/mock-data";
import {
  createHealthPlanDraft,
  listHealthPlans
} from "@/lib/repositories/health-plan-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const plans = await listHealthPlans({
    scopeKey: auth.context.scopeKey,
    patientId
  });

  return NextResponse.json({
    patientId,
    plans,
    hitlRequired: true,
    ehrWrite: false,
    note: "Personalised health plans are DRAFT artifacts only — never auto-written to EHR."
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  let body: {
    trigger?: "hitl_accept" | "manual_request" | "risk_state_review";
    caseId?: string;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patient = getPatientById(patientId);
  const draft = await createHealthPlanDraft(
    {
      patientId,
      patientLabel: patient?.name,
      createdBy: auth.context.userEmail ?? auth.context.userId,
      trigger: body.trigger ?? "manual_request",
      caseId: body.caseId,
      conditions: patient?.activeConditions,
      medications: patient?.activeMedications,
      riskSignals: patient?.digitalTwinPrediction.deteriorationSignals
    },
    { scopeKey: auth.context.scopeKey }
  );

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false,
    physiologicalTwin: false
  });
}
