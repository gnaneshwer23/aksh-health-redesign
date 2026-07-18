import { NextResponse } from "next/server";

import {
  buildCausalHypothesis,
  causalRequestSchema,
  getCausalAiStatus
} from "@/lib/precision-health/causal-ai";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/agents/causal
 * Causal AI stub status — hypothesis only, not causal proof.
 */
export async function GET() {
  return NextResponse.json(getCausalAiStatus());
}

/**
 * POST /api/agents/causal
 * Hypothesized drivers with confidence + disclaimer. HITL + SHIELD; ehrWrite:false.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", ehrWrite: false, disclaimer: "hypothesis only, not causal proof" },
      { status: 400 }
    );
  }

  try {
    const input = causalRequestSchema.parse(body);
    const result = buildCausalHypothesis(input);

    void persistShieldAuditEvent({
      action: "defer",
      actor: auth.context.userEmail ?? auth.context.userId,
      label: "SHIELD: CAUSAL hypothesis stub (not causal proof)",
      detail: `${result.patientLabel}: ${result.hypothesizedDrivers.length} hypothesized drivers`,
      category: "system",
      agentLabel: "CAUSAL",
      resourceRef: `${result.patientLabel} (${result.patientId})`,
      payload: {
        mode: "hypothesis_only",
        disclaimer: "hypothesis only, not causal proof",
        clinicalOwner: result.modelCard.clinicalOwner,
        ehrWrite: false,
        hitlRequired: true
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
        error: error instanceof Error ? error.message : "Causal stub failed.",
        disclaimer: "hypothesis only, not causal proof",
        ehrWrite: false
      },
      { status: 400 }
    );
  }
}
