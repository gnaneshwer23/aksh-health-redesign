import { NextResponse } from "next/server";

import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { buildNutritionCoachingDraft } from "@/lib/precision-health/coaching";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    available: true,
    mode: "coaching_draft_only",
    isClinicalAdvice: false,
    note: "NUTRITION coaching drafts only — not clinical advice. HITL required before care-plan attachment. No EHR write.",
    ehrWrite: false,
    hitlRequired: true
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; patientLabel?: string; contextNotes?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim() || "P001";
  const mockPatient = getMockPatientResponse(patientId);
  const patientLabel = body.patientLabel?.trim() || mockPatient?.name || patientId;

  const draft = buildNutritionCoachingDraft({
    patientId,
    patientLabel,
    contextNotes: body.contextNotes
  });

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: "SHIELD: NUTRITION coaching draft (not clinical advice)",
    detail: draft.summary.slice(0, 200),
    category: "system",
    agentLabel: "NUTRITION",
    resourceRef: `${patientLabel} (${patientId})`,
    payload: {
      mode: draft.mode,
      isClinicalAdvice: false,
      ehrWrite: false,
      hitlRequired: true
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false,
    isClinicalAdvice: false
  });
}
