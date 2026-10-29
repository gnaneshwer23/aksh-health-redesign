/**
 * Deterministic synthetic drafting for Phase 5.
 * Offline-safe: no live model keys required. LLM path gated and not used in tests.
 */

import { randomUUID } from "crypto";

import { buildSharedPatientContext } from "./agent-intel-context";
import { retrieveEvidenceForContext } from "./agent-intel-retrieval";
import type {
  AgentIntelDraft,
  AgentIntelDraftKind,
  SharedPatientContext,
  StructuredDraftPayload,
} from "./agent-intel-types";
import { validateStructuredDraft } from "./agent-intel-validate";
import { ACTIVE_AGENT_INTEL_VERSION } from "./agent-intel-versions";

function assessMissingFields(ctx: SharedPatientContext): StructuredDraftPayload["missingFields"] {
  const missing: NonNullable<StructuredDraftPayload["missingFields"]> = [];
  if (ctx.conditions.length === 0) {
    missing.push({
      code: "conditions_absent",
      message: "No active conditions on shared context",
      field: "conditions",
    });
  }
  if (ctx.medications.length === 0) {
    missing.push({
      code: "medications_absent",
      message: "No medications on shared context",
      field: "medications",
    });
  }
  if (!ctx.lastEncounterDate) {
    missing.push({
      code: "last_encounter_missing",
      message: "Last encounter date unknown",
      field: "lastEncounterDate",
    });
  }
  if (ctx.conditions.some((c) => /diabetes/i.test(c))) {
    missing.push({
      code: "hba1c_not_in_shared_context",
      message: "Latest HbA1c not present on this shared context snapshot — check glucose intelligence module",
      field: "hba1c",
    });
    missing.push({
      code: "retinopathy_status_unknown",
      message: "Retinopathy screening status not in shared context",
      field: "retinopathy",
    });
    missing.push({
      code: "foot_check_unknown",
      message: "Foot examination status not in shared context",
      field: "foot_check",
    });
  }
  if (ctx.allergies.length === 0) {
    missing.push({
      code: "allergy_status_unclear",
      message: "Allergy list empty — confirm NKDA vs unknown",
      field: "allergies",
    });
  }
  return missing;
}

export function buildHistorySummaryPayload(ctx: SharedPatientContext): StructuredDraftPayload {
  const conditionLine = ctx.conditions.length
    ? ctx.conditions.join("; ")
    : "No conditions listed on shared context.";
  const medLine = ctx.medications.length
    ? ctx.medications.join("; ")
    : "No medications listed.";
  const signals = ctx.deteriorationSignals.length
    ? ctx.deteriorationSignals.join("; ")
    : "No deterioration signals on shared context.";

  return {
    kind: "history_summary",
    title: `AI draft — history summary for ${ctx.patientLabel}`,
    sections: [
      {
        id: "overview",
        heading: "Overview (AI-generated — not verified)",
        body: `${ctx.patientLabel}${ctx.age != null ? `, age ${ctx.age}` : ""}${
          ctx.gender ? `, ${ctx.gender}` : ""
        }. Conditions: ${conditionLine}.`,
      },
      {
        id: "medicines",
        heading: "Medicines (from shared context)",
        body: medLine,
      },
      {
        id: "signals",
        heading: "Signals (directional / synthetic)",
        body: signals,
      },
      {
        id: "disclaimer",
        heading: "Provenance",
        body: "This summary is AI-generated from shared synthetic context. It is not clinician-verified clinical information until Accept/Edit.",
      },
    ],
  };
}

export function buildClinicalDocumentationPayload(ctx: SharedPatientContext): StructuredDraftPayload {
  const subjective = `Patient with ${ctx.conditions.join(", ") || "unlisted conditions"} attending diabetes care coordination review (synthetic).`;
  const objective = `Medications on shared context: ${ctx.medications.join(", ") || "none"}. Allergies: ${
    ctx.allergies.join(", ") || "none listed"
  }. Last encounter: ${ctx.lastEncounterDate ?? "unknown"}.`;
  const assessment =
    "Draft assessment only — decision support. No diagnostic authority. Requires clinician review.";
  const plan =
    "Draft plan: reconcile medicines, review glucose trajectory via glucose intelligence module, schedule structured follow-up. No autonomous prescribe/treatment. ehrWrite=false.";

  return {
    kind: "clinical_documentation",
    title: `AI draft — clinical documentation (SOAP) for ${ctx.patientLabel}`,
    sections: [
      { id: "s", heading: "Subjective", body: subjective },
      { id: "o", heading: "Objective", body: objective },
      { id: "a", heading: "Assessment", body: assessment },
      { id: "p", heading: "Plan", body: plan },
      {
        id: "disclaimer",
        heading: "Provenance",
        body: "SOAP draft is AI-generated. Not filed to record. Clinician Accept/Edit/Reject required.",
      },
    ],
    soap: { subjective, objective, assessment, plan },
  };
}

export function buildMissingInformationPayload(ctx: SharedPatientContext): StructuredDraftPayload {
  const missingFields = assessMissingFields(ctx) ?? [];
  return {
    kind: "missing_information",
    title: `AI draft — missing information for ${ctx.patientLabel}`,
    sections: [
      {
        id: "gaps",
        heading: "Identified gaps (AI-generated)",
        body:
          missingFields.length > 0
            ? missingFields.map((m) => `• ${m.message}`).join("\n")
            : "No structural gaps detected on shared context (still verify clinically).",
      },
      {
        id: "disclaimer",
        heading: "Provenance",
        body: "Gap list is AI-generated from shared context completeness rules — not a clinical diagnosis of missing care.",
      },
    ],
    missingFields,
  };
}

export function buildEvidenceRetrievalPayload(ctx: SharedPatientContext): StructuredDraftPayload {
  const citations = retrieveEvidenceForContext(ctx, {
    queryHints: ["diabetes", "follow-up", "safety", "missing"],
  });
  return {
    kind: "evidence_retrieval",
    title: `AI draft — evidence retrieval for ${ctx.patientLabel}`,
    sections: [
      {
        id: "grounding",
        heading: "Retrieved evidence (synthetic corpus)",
        body: citations.map((c) => `${c.title}: ${c.excerpt}`).join("\n\n"),
      },
      {
        id: "disclaimer",
        heading: "Provenance",
        body: "Citations are from a synthetic guidance corpus for rehearsal. Not a live NICE/BNF connector. Unvalidated for production clinical AI.",
      },
    ],
    citations,
  };
}

export function buildFollowUpDraftPayload(ctx: SharedPatientContext): StructuredDraftPayload {
  const hasDiabetes = ctx.conditions.some((c) => /diabetes/i.test(c));
  const title = hasDiabetes
    ? "Structured diabetes review — confirm care plan and glucose follow-up"
    : "General care coordination follow-up (draft)";
  return {
    kind: "follow_up_draft",
    title: `AI draft — follow-up for ${ctx.patientLabel}`,
    sections: [
      {
        id: "proposal",
        heading: "Proposed follow-up (AI-generated)",
        body: `${title}. Owner: nurse / GP. Not scheduled until clinician Accept.`,
      },
      {
        id: "disclaimer",
        heading: "Provenance",
        body: "Follow-up draft only. No autonomous outreach. Aligns with continuous-care worklist patterns after Accept.",
      },
    ],
    followUpSuggestion: {
      title,
      ownerRole: "nurse",
      dueInDays: 14,
      rationale:
        "Deterministic follow-up from shared diabetes context — clinician must Accept before operational queueing.",
    },
  };
}

export function buildPayloadForKind(
  kind: AgentIntelDraftKind,
  ctx: SharedPatientContext
): StructuredDraftPayload {
  switch (kind) {
    case "history_summary":
      return buildHistorySummaryPayload(ctx);
    case "clinical_documentation":
      return buildClinicalDocumentationPayload(ctx);
    case "missing_information":
      return buildMissingInformationPayload(ctx);
    case "evidence_retrieval":
      return buildEvidenceRetrievalPayload(ctx);
    case "follow_up_draft":
      return buildFollowUpDraftPayload(ctx);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unhandled draft kind: ${_exhaustive}`);
    }
  }
}

export function createDraftFromPayload(
  ctx: SharedPatientContext,
  payload: StructuredDraftPayload,
  options?: { now?: number; id?: string }
): AgentIntelDraft {
  const now = new Date(options?.now ?? Date.now()).toISOString();
  const validation = validateStructuredDraft(payload, { now });
  if (!validation.valid) {
    const err = new Error(
      `Structured draft validation failed: ${validation.issues.map((i) => i.code).join(", ")}`
    ) as Error & { status?: number; validation: typeof validation };
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  return {
    id: options?.id ?? `aidraft-${randomUUID()}`,
    patientId: ctx.patientId,
    patientLabel: ctx.patientLabel,
    kind: payload.kind,
    status: "DRAFT",
    ownerRole: "gp",
    ownerDisplay: "Named GP (HITL)",
    versionPin: { ...ACTIVE_AGENT_INTEL_VERSION },
    payload,
    validation,
    provenance: "ai_generated",
    verifiedClinical: false,
    confidence: payload.kind === "evidence_retrieval" ? 0.72 : 0.65,
    createdAt: now,
    updatedAt: now,
    decidedBy: null,
    decidedAt: null,
    closedAt: null,
    decisionHistory: [
      {
        id: `aidec-${randomUUID()}`,
        action: "create_draft",
        actor: "agent-orchestrator",
        reason: "Deterministic synthetic draft — awaiting clinician",
        at: now,
      },
    ],
    hitlRequired: true,
    synthetic: true,
    ehrWrite: false,
    autonomousClinicalAction: false,
    prescribeOrTreat: false,
  };
}

export function draftAllKindsForPatient(
  patientId: string,
  options?: { now?: number }
): { context: SharedPatientContext; drafts: AgentIntelDraft[] } {
  const context = buildSharedPatientContext(patientId, { now: options?.now });
  const kinds: AgentIntelDraftKind[] = [
    "history_summary",
    "clinical_documentation",
    "missing_information",
    "evidence_retrieval",
    "follow_up_draft",
  ];
  const drafts = kinds.map((kind) => {
    const payload = buildPayloadForKind(kind, context);
    return createDraftFromPayload(context, payload, {
      now: options?.now,
      id: `aidraft-${patientId}-${kind}`,
    });
  });
  return { context, drafts };
}
