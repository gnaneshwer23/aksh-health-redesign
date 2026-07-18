import { NextResponse } from "next/server";

import { runScenario, simulateRequestSchema } from "@/lib/precision-health/twin-simulation";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * POST /api/precision-health/twin/simulate
 * Synthetic scenario ranking from rules + ORACLE risk-state. HITL before plan promotion.
 * Status: GET /api/precision-health/twin/status
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", physiologicalTwin: false, ehrWrite: false },
      { status: 400 }
    );
  }

  try {
    const input = simulateRequestSchema.parse(body);
    const result = runScenario(input.patientId, input.interventions);

    void persistShieldAuditEvent({
      action: "defer",
      actor: auth.context.userEmail ?? auth.context.userId,
      label: "SHIELD: synthetic twin scenario ranking (not physiological twin)",
      detail: `${result.patientLabel}: ${result.options.length} options ranked; mode=${result.simulationMode}`,
      category: "system",
      agentLabel: "TWIN_SIM",
      resourceRef: `${result.patientLabel} (${result.patientId})`,
      payload: {
        physiologicalTwin: false,
        simulationMode: "synthetic_rules",
        ehrWrite: false,
        hitlRequired: true,
        planPromotionRequiresHitl: true,
        topIntervention: result.options[0]?.interventionId ?? null
      }
    });

    return NextResponse.json({
      ...result,
      hitlRequired: true,
      ehrWrite: false
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Simulation failed.",
        physiologicalTwin: false,
        simulationMode: "synthetic_rules",
        ehrWrite: false
      },
      { status: 400 }
    );
  }
}
