import { NextResponse } from "next/server";

import { getPatientById } from "@/lib/mock-data";
import { buildPatientRiskState } from "@/lib/precision-health/risk-state";
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

  const patient = getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Unknown synthetic patient id." }, { status: 404 });
  }

  const riskState = buildPatientRiskState(patient, {
    neo4jLive: false,
    oracleLive: false
  });

  return NextResponse.json({
    riskState,
    modelCard: riskState.modelCard,
    displayLabel: "Patient risk state",
    notAPhysiologicalTwin: true,
    autoRetrain: false,
    governedReleaseSop: riskState.modelCard.governedReleaseSop,
    hitlRequired: true,
    ehrWrite: false
  });
}
