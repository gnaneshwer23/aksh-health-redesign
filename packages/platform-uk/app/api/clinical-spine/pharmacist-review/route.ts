import { NextResponse } from "next/server";

import { recordPharmacistReviewOnSpine } from "@/lib/clinical-spine/role-events";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * POST /api/clinical-spine/pharmacist-review
 * Pharmacist meds review → SHIELD + learning event (patient timeline). HITL clinical decision.
 * Never claims live EMIS / EHR write.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    patientId?: string;
    patientLabel?: string;
    medicationCount?: number;
    medicationSummary?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", ehrWrite: false, liveEmis: false }, { status: 400 });
  }

  if (!body.patientId?.trim()) {
    return NextResponse.json({ error: "patientId is required.", ehrWrite: false, liveEmis: false }, { status: 400 });
  }

  const medicationCount =
    typeof body.medicationCount === "number" && Number.isFinite(body.medicationCount)
      ? Math.max(0, Math.floor(body.medicationCount))
      : 0;

  try {
    const result = await recordPharmacistReviewOnSpine(
      {
        patientId: body.patientId.trim(),
        patientLabel: body.patientLabel,
        medicationCount,
        medicationSummary: body.medicationSummary
      },
      {
        scopeKey: auth.context.scopeKey,
        actor: auth.context.userEmail ?? auth.context.userId
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Pharmacist review spine write failed.",
        ehrWrite: false,
        liveEmis: false
      },
      { status: 400 }
    );
  }
}
