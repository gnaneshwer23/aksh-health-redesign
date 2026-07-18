import { NextResponse } from "next/server";

import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import type { ReviewQueueItem, ServiceRequestResource } from "@/lib/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

function buildReferralDraft(options: {
  patientId: string;
  patientLabel: string;
  caseId: string;
  indication?: string;
  priority?: "routine" | "urgent";
}) {
  const priority = options.priority ?? "urgent";
  const indication =
    options.indication?.trim() ||
    "Suspected DVT: left calf swelling × 5 days, Wells moderate (synthetic packaging)";

  const queueItem: ReviewQueueItem = {
    id: `${options.caseId}-queue-referral`,
    agentId: "REFERRAL",
    itemType: "referral_package",
    status: "DRAFT",
    title: "Urgent referral package",
    summary: `${indication.slice(0, 120)}${indication.length > 120 ? "…" : ""}`,
    content: [
      "REFERRAL AGENT: coordination draft",
      `Priority: ${priority.toUpperCase()}`,
      `Patient: ${options.patientLabel} (${options.patientId})`,
      `Clinical indication: ${indication}`,
      "Status: DRAFT | GP Accept required before ServiceRequest write-back"
    ].join("\n"),
    metadata: {
      priority,
      pathway: "vascular_imaging",
      investigations: ["duplex_ultrasound", "d_dimer"]
    }
  };

  const serviceRequest: ServiceRequestResource = {
    resourceType: "ServiceRequest",
    id: `servicereq-${options.caseId}`,
    codeText: "Duplex ultrasound lower limb + D-dimer",
    status: "draft",
    priority,
    reason: indication,
    performerText: "Regional vascular diagnostics (synthetic)"
  };

  return { queueItem, serviceRequest };
}

export async function GET() {
  return NextResponse.json({
    available: true,
    mode: "synthetic_packaging_only",
    note: "REFERRAL packages are synthetic drafts only. No NHS e-Referral Service write-back. HITL Accept required before staging."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    patientId?: string;
    patientLabel?: string;
    caseId?: string;
    indication?: string;
    priority?: "routine" | "urgent";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim() || "P002";
  const mockPatient = getMockPatientResponse(patientId);
  const patientLabel = body.patientLabel?.trim() || mockPatient?.name || patientId;
  const caseId = body.caseId?.trim() || `referral-pack-${patientId}`;

  const { queueItem, serviceRequest } = buildReferralDraft({
    patientId,
    patientLabel,
    caseId,
    indication: body.indication,
    priority: body.priority
  });

  const draft = {
    mode: "deterministic" as const,
    patientId,
    patientLabel,
    queueItem,
    serviceRequest,
    safetyNotes: [
      "Synthetic REFERRAL packaging only — not submitted to NHS e-Referral Service.",
      "HITL Accept/Edit/Reject required before any staging or record impact."
    ],
    confidence: 0.55
  };

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: "SHIELD: REFERRAL package drafted (synthetic)",
    detail: `${queueItem.title}; priority=${serviceRequest.priority}`,
    category: "system",
    caseId,
    agentLabel: "REFERRAL",
    resourceRef: `${patientLabel} (${patientId})`,
    payload: {
      mode: draft.mode,
      priority: serviceRequest.priority,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false,
    eReferralWrite: false
  });
}
