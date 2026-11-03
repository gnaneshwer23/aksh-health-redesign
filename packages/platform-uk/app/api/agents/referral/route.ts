import { NextResponse } from "next/server";

import {
  extractOrchestrationRunLineage,
  lineageMetadata,
  type OrchestrationRunLineage,
} from "@/lib/agents/run-lineage";
import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { phiSafeResourceRef } from "@/lib/security/phi-safe-ref";
import type { ReviewQueueItem, ServiceRequestResource } from "@/lib/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

function buildReferralDraft(options: {
  patientId: string;
  patientLabel: string;
  caseId: string;
  indication?: string;
  priority?: "routine" | "urgent";
  lineage: OrchestrationRunLineage;
}) {
  const priority = options.priority ?? "urgent";
  const indication =
    options.indication?.trim() ||
    "Suspected DVT: left calf swelling × 5 days, Wells moderate (synthetic packaging)";
  const lineage = options.lineage;

  const queueItem: ReviewQueueItem = {
    id: `${options.caseId}-queue-referral`,
    agentId: "REFERRAL",
    itemType: "referral_package",
    status: "DRAFT",
    title: "Urgent referral package",
    summary: `${indication.slice(0, 120)}${indication.length > 120 ? "…" : ""}`,
    content: [
      "PATHWAY: coordination draft",
      `Priority: ${priority.toUpperCase()}`,
      `Patient: ${options.patientLabel} (${options.patientId})`,
      `Clinical indication: ${indication}`,
      lineage.durableRunId ? `Orchestration run: ${lineage.durableRunId}` : null,
      lineage.careEpisodeId ? `Care episode: ${lineage.careEpisodeId}` : null,
      "Status: DRAFT | GP Accept required before ServiceRequest write-back · liveEmis:false",
    ]
      .filter(Boolean)
      .join("\n"),
    metadata: {
      priority,
      pathway: "vascular_imaging",
      investigations: ["duplex_ultrasound", "d_dimer"],
      agent: "PATHWAY",
      ...lineageMetadata(lineage),
    },
  };

  const serviceRequest: ServiceRequestResource = {
    resourceType: "ServiceRequest",
    id: `servicereq-${options.caseId}`,
    codeText: "Duplex ultrasound lower limb + D-dimer",
    status: "draft",
    priority,
    reason: indication,
    performerText: "Regional vascular diagnostics (synthetic)",
    extensionNote: [
      lineage.durableRunId ? `durableRunId=${lineage.durableRunId}` : null,
      lineage.correlationId ? `correlationId=${lineage.correlationId}` : null,
      lineage.careEpisodeId ? `careEpisodeId=${lineage.careEpisodeId}` : null,
      "liveEmis:false",
    ]
      .filter(Boolean)
      .join("; "),
  };

  return { queueItem, serviceRequest };
}

export async function GET() {
  return NextResponse.json({
    available: true,
    mode: "synthetic_packaging_only",
    liveEmis: false,
    note: "PATHWAY (formerly REFERRAL) packages are synthetic drafts only. No health system e-Referral Service write-back. HITL Accept required before staging. Optional durableRunId / careEpisodeId correlation for ops join (Milestone E P1.3).",
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
    careEpisodeId?: string;
    care_episode_id?: string;
    durableRunId?: string;
    correlationId?: string;
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
  const lineage = extractOrchestrationRunLineage(
    { id: caseId, careEpisodeId: body.careEpisodeId ?? body.care_episode_id, agentRun: undefined },
    {
      durableRunId: body.durableRunId,
      correlationId: body.correlationId,
      careEpisodeId: body.careEpisodeId ?? body.care_episode_id,
    }
  );

  const { queueItem, serviceRequest } = buildReferralDraft({
    patientId,
    patientLabel,
    caseId,
    indication: body.indication,
    priority: body.priority,
    lineage,
  });

  const draft = {
    mode: "deterministic" as const,
    patientId,
    patientLabel,
    queueItem,
    serviceRequest,
    runLineage: lineage,
    safetyNotes: [
      "Synthetic PATHWAY packaging only — not submitted to health system e-Referral Service.",
      "HITL Accept/Edit/Reject required before any staging or record impact.",
      "PATHWAY stays outside CONDUCTOR auto fan-out; durableRunId/careEpisodeId are ops join keys only.",
    ],
    confidence: 0.55,
  };

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: "SHIELD: PATHWAY package drafted (synthetic)",
    detail: `${queueItem.title}; priority=${serviceRequest.priority}`,
    category: "system",
    caseId,
    agentLabel: "PATHWAY",
    resourceRef: phiSafeResourceRef(patientId, { caseId, agentLabel: "PATHWAY" }),
    payload: {
      mode: draft.mode,
      priority: serviceRequest.priority,
      safetyNotes: draft.safetyNotes,
      careEpisodeId: lineage.careEpisodeId,
      runLineage: lineageMetadata(lineage),
    },
  });

  return NextResponse.json({
    draft,
    runLineage: lineage,
    hitlRequired: true,
    ehrWrite: false,
    eReferralWrite: false,
    liveEmis: false,
  });
}
