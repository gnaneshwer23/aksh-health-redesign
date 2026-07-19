import { NextResponse } from "next/server";

import { runGuardianAgent } from "@/lib/agents/llm-guardian";
import { runOracleAgent } from "@/lib/agents/llm-oracle";
import {
  coachingAllowedForRoute,
  resolveSafetyRouteFromSignals,
  SAFETY_ROUTE_LABELS
} from "@/lib/clinical-spine/safety-route";
import { getPatientById } from "@/lib/mock-data";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: { id: string } };

/**
 * GET /api/patients/[id]/safety-route
 * Lightweight safety branch for patient companion coaching gate.
 * Does not claim live EMR or physiological twin.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = context.params.id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const patient = getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Unknown synthetic patient id." }, { status: 404 });
  }

  const [guardian, oracle] = await Promise.all([
    runGuardianAgent({ patientId }),
    runOracleAgent({ patientId })
  ]);

  const safetyRoute = resolveSafetyRouteFromSignals({
    guardianStatus: guardian?.overallStatus ?? null,
    oracleRisk: oracle?.oracleRisk ?? patient.oracleRisk,
    flags: patient.flags ?? [],
    hasMinimalContext: true
  });

  const labels = SAFETY_ROUTE_LABELS[safetyRoute];

  return NextResponse.json({
    patientId,
    safetyRoute,
    title: labels.title,
    patientMessage: labels.patientMessage,
    clinicianMessage: labels.clinicianMessage,
    coachingAllowed: coachingAllowedForRoute(safetyRoute),
    guardianStatus: guardian?.overallStatus ?? null,
    oracleRisk: oracle?.oracleRisk ?? patient.oracleRisk,
    oracleScore: oracle?.oracleScore ?? patient.oracleScore,
    ehrWrite: false,
    hitlRequired: true,
    physiologicalTwin: false,
    autoRetrain: false,
    liveEmis: false,
    note: "Safety route estimate from deterministic GUARDIAN/ORACLE drafts — not live CDS."
  });
}
