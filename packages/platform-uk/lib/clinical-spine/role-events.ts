/**
 * Phase D — role surfaces emit onto the same clinical spine stores
 * (modality samples → timeline/KG, learning → timeline, SHIELD audit).
 * Honesty: ehrWrite:false · liveEmis:false · physiologicalTwin:false · autoRetrain:false.
 */

import { randomUUID } from "crypto";

import { listConsentGrants } from "@/lib/repositories/consent-grant-repository";
import { listHealthPlans } from "@/lib/repositories/health-plan-repository";
import {
  listLearningEvents,
  recordLearningEvent
} from "@/lib/repositories/learning-event-repository";
import {
  ingestModalitySampleStub,
  listModalitySamples
} from "@/lib/repositories/modality-sample-repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import type { ConsentGrant } from "@/lib/precision-health/consent";
import { mergeModalitySampleIntoKg, type KgIngestResult } from "@/lib/precision-health/kg-ingest";
import type { StoredModalitySample } from "@/lib/precision-health/modalities";

export const SPINE_ROLE_HONESTY = {
  ehrWrite: false as const,
  liveEmis: false as const,
  physiologicalTwin: false as const,
  autoRetrain: false as const,
  hitlRequired: true as const,
  writeBackPath: "sim_staging_only" as const
};

export type NurseVitalsValues = {
  bpSys?: string;
  bpDia?: string;
  hr?: string;
  rr?: string;
  spo2?: string;
  temp?: string;
  weight?: string;
};

function parseOptionalNumber(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Clinician-entered vitals as a wearable-shaped sample so biomarker-lite + MEASURED KG
 * (when live) reuse the same spine path as Phase B ingest. Provenance is never a device stream.
 */
export function buildNurseVitalsSample(
  patientId: string,
  vitals: NurseVitalsValues,
  recordedAt?: string
) {
  const at = recordedAt ?? new Date().toISOString();
  const sys = parseOptionalNumber(vitals.bpSys);
  const dia = parseOptionalNumber(vitals.bpDia);
  const hr = parseOptionalNumber(vitals.hr);
  const spo2 = parseOptionalNumber(vitals.spo2);
  const parts = [
    sys != null && dia != null ? `BP ${sys}/${dia}` : null,
    hr != null ? `HR ${hr}` : null,
    vitals.rr?.trim() ? `RR ${vitals.rr.trim()}` : null,
    spo2 != null ? `SpO₂ ${spo2}%` : null,
    vitals.temp?.trim() ? `Temp ${vitals.temp.trim()}°C` : null,
    vitals.weight?.trim() ? `Wt ${vitals.weight.trim()} kg` : null
  ].filter(Boolean);

  return {
    modality: "wearable" as const,
    patientId,
    recordedAt: at,
    restingHeartRateBpm: hr,
    spo2Percent: spo2,
    systolicBpMmHg: sys,
    diastolicBpMmHg: dia,
    summary: `Nurse observations (clinician-entered): ${parts.join(" · ") || "vitals saved"}`,
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: "nurse_vitals — clinician-entered observation on clinical spine; not a live device / EMR write"
    }
  };
}

/** Ephemeral care_delivery grant so clinician-entered observations are not blocked by wearable consent UI. */
function clinicianObservationGrant(patientId: string, actor: string): ConsentGrant {
  return {
    id: `clinician-obs-${patientId}`,
    patientId,
    purposeCode: "care_delivery",
    modalities: ["wearable", "clinical"],
    status: "active",
    grantedAt: new Date().toISOString(),
    grantedBy: actor,
    revokedAt: null,
    revokedBy: null,
    notes: "Ephemeral clinician-observation path for nurse vitals rehearsal — not a patient wearable grant.",
    ehrWrite: false,
    hitlRequired: true
  };
}

export type NurseVitalsSpineResult = {
  accepted: boolean;
  sample?: StoredModalitySample;
  kg: KgIngestResult;
  shieldLogged: boolean;
  message: string;
} & typeof SPINE_ROLE_HONESTY;

export async function recordNurseVitalsOnSpine(
  input: {
    patientId: string;
    patientLabel?: string;
    vitals: NurseVitalsValues;
    updateKg?: boolean;
  },
  options: { scopeKey: string; actor: string }
): Promise<NurseVitalsSpineResult> {
  const existing = await listConsentGrants({
    scopeKey: options.scopeKey,
    patientId: input.patientId
  });
  const sampleInput = buildNurseVitalsSample(input.patientId, input.vitals);
  const storeResult = await ingestModalitySampleStub(sampleInput, {
    scopeKey: options.scopeKey,
    purposeCode: "care_delivery",
    grants: [...existing, clinicianObservationGrant(input.patientId, options.actor)]
  });

  if (!storeResult.accepted || !storeResult.sample) {
    void persistShieldAuditEvent({
      action: "defer",
      actor: options.actor,
      label: "SHIELD: nurse vitals spine write refused",
      detail: storeResult.message,
      category: "system",
      agentLabel: "Nurse",
      resourceRef: `${input.patientLabel ?? input.patientId} (${input.patientId})`,
      payload: { ...SPINE_ROLE_HONESTY, accepted: false }
    });
    return {
      accepted: false,
      kg: {
        attempted: false,
        applied: false,
        mode: "skipped_no_consent_path",
        nodesTouched: 0,
        note: "Nurse vitals not stored — no timeline/KG update."
      },
      shieldLogged: true,
      message: storeResult.message,
      ...SPINE_ROLE_HONESTY
    };
  }

  let kg: KgIngestResult = {
    attempted: false,
    applied: false,
    mode: "mock",
    nodesTouched: 0,
    note: "KG update not requested."
  };
  if (input.updateKg !== false) {
    kg = await mergeModalitySampleIntoKg(storeResult.sample, { consentAllowsKg: true });
  }

  void persistShieldAuditEvent({
    action: "accept",
    actor: options.actor,
    label: "SHIELD: nurse vitals on clinical spine (timeline · sim write only)",
    detail: storeResult.sample.summary,
    category: "reviewer_decision",
    agentLabel: "Nurse",
    resourceRef: `${input.patientLabel ?? input.patientId} (${input.patientId})`,
    payload: {
      sampleId: storeResult.sample.id,
      kg,
      ...SPINE_ROLE_HONESTY
    }
  });

  return {
    accepted: true,
    sample: storeResult.sample,
    kg,
    shieldLogged: true,
    message:
      "Nurse vitals stored on shared spine (timeline · optional Neo4j MEASURED). liveEmis:false · ehrWrite:false.",
    ...SPINE_ROLE_HONESTY
  };
}

export type PharmacistReviewSpineResult = {
  learningEventId: string;
  shieldLogged: boolean;
  message: string;
} & typeof SPINE_ROLE_HONESTY;

export async function recordPharmacistReviewOnSpine(
  input: {
    patientId: string;
    patientLabel?: string;
    medicationCount: number;
    medicationSummary?: string;
  },
  options: { scopeKey: string; actor: string }
): Promise<PharmacistReviewSpineResult> {
  const predictionId = `pharm-review-${input.patientId}-${randomUUID().slice(0, 8)}`;
  const summary =
    input.medicationSummary ??
    `${input.medicationCount} active medication(s) reviewed by pharmacist (HITL)`;

  const { event } = await recordLearningEvent(
    {
      patientId: input.patientId,
      agentLabel: "GUARDIAN",
      predictionId,
      predictionSummary: summary,
      decision: "accept",
      decisionActor: options.actor,
      decisionNotes: "Pharmacist medication review completed — clinical HITL on shared spine",
      outcomeKind: "care_action_completed",
      outcomeSummary: `Pharmacist meds review for ${input.patientLabel ?? input.patientId}: ${summary}`
    },
    { scopeKey: options.scopeKey, shieldDualWrite: false }
  );

  void persistShieldAuditEvent({
    action: "accept",
    actor: options.actor,
    label: "SHIELD: pharmacist medication review completed",
    detail: summary,
    category: "reviewer_decision",
    agentLabel: "GUARDIAN",
    resourceRef: `${input.patientLabel ?? input.patientId} (${input.patientId})`,
    payload: {
      learningEventId: event.id,
      medicationCount: input.medicationCount,
      ...SPINE_ROLE_HONESTY
    }
  });

  return {
    learningEventId: event.id,
    shieldLogged: true,
    message:
      "Pharmacist review on shared spine (SHIELD + learning → patient timeline). ehrWrite:false · liveEmis:false.",
    ...SPINE_ROLE_HONESTY
  };
}

export type SpineAggregates = {
  generatedAt: string;
  patientIds: string[];
  modalitySampleCount: number;
  learningEventCount: number;
  consentGrantCount: number;
  healthPlanCount: number;
  recentEventTitles: string[];
  source: "shared_spine_apis";
  note: string;
} & typeof SPINE_ROLE_HONESTY;

/** ICS / hospital read aggregates from the same stores as GP timeline — not a fake parallel warehouse. */
export async function buildSpineAggregates(options: {
  scopeKey: string;
  patientIds?: string[];
}): Promise<SpineAggregates> {
  const patientIds = options.patientIds ?? ["P001", "P002"];
  const idSet = new Set(patientIds);

  const [samples, learning, grants, plans] = await Promise.all([
    listModalitySamples({ scopeKey: options.scopeKey }),
    listLearningEvents({ scopeKey: options.scopeKey, limit: 100 }),
    listConsentGrants({ scopeKey: options.scopeKey, includeRevoked: true }),
    Promise.all(patientIds.map((id) => listHealthPlans({ scopeKey: options.scopeKey, patientId: id })))
  ]);

  const scopedSamples = samples.filter((s) => idSet.has(s.patientId));
  const scopedLearning = learning.events.filter((e) => e.patientId && idSet.has(e.patientId));
  const scopedGrants = grants.filter((g) => idSet.has(g.patientId));
  const planRows = plans.flat();

  const recentEventTitles = [
    ...scopedSamples.slice(0, 5).map((s) => s.summary),
    ...scopedLearning.slice(0, 5).map((e) => e.outcomeSummary ?? e.predictionSummary ?? e.agentLabel)
  ].slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    patientIds,
    modalitySampleCount: scopedSamples.length,
    learningEventCount: scopedLearning.length,
    consentGrantCount: scopedGrants.length,
    healthPlanCount: planRows.length,
    recentEventTitles,
    source: "shared_spine_apis",
    note: "Aggregates from modality / learning / consent / health-plan stores used by GP timeline — not a parallel ICS warehouse or live PAS.",
    ...SPINE_ROLE_HONESTY
  };
}
