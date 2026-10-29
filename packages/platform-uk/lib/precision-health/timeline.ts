import type { LearningEvent } from "../clinical-proof/learning-loop";
import type { ReviewCase } from "../types";
import { extractBiomarkerLite, formatBiomarkerLite, type BiomarkerLite } from "./biomarkers";
import type { ConsentGrant } from "./consent";
import type { StoredModalitySample } from "./modalities";

export type TimelineEventKind =
  | "case_activity"
  | "modality_sample"
  | "learning_outcome"
  | "consent_change"
  | "health_plan"
  | "coaching_draft"
  | "risk_state"
  | "care_journey"
  | "continuous_care";

export type PatientTimelineEvent = {
  id: string;
  patientId: string;
  kind: TimelineEventKind;
  occurredAt: string;
  title: string;
  summary: string;
  source: string;
  ehrWrite: false;
  metadata?: Record<string, unknown>;
};

export type PatientTimeline = {
  patientId: string;
  generatedAt: string;
  eventCount: number;
  events: PatientTimelineEvent[];
  note: string;
};

function caseEvents(
  patientId: string,
  cases: ReviewCase[],
  patientLabelHint?: string
): PatientTimelineEvent[] {
  const events: PatientTimelineEvent[] = [];
  const hint = patientLabelHint?.toLowerCase().trim();

  for (const reviewCase of cases) {
    const label = reviewCase.patientLabel?.toLowerCase() ?? "";
    const matches =
      reviewCase.id.toLowerCase().includes(patientId.toLowerCase()) ||
      label.includes(patientId.toLowerCase()) ||
      (hint ? label.includes(hint) || hint.includes(label.slice(0, 12)) : false);

    if (!matches) continue;

    for (const audit of reviewCase.auditEvents ?? []) {
      const occurredAt = audit.timestamp || reviewCase.updatedAt;
      events.push({
        id: `case-${reviewCase.id}-${audit.id ?? occurredAt}`,
        patientId,
        kind: "case_activity",
        occurredAt,
        title: audit.label,
        summary: audit.detail ?? audit.label,
        source: "review_case_audit",
        ehrWrite: false,
        metadata: { caseId: reviewCase.id, category: audit.category }
      });
    }

    events.push({
      id: `case-status-${reviewCase.id}`,
      patientId,
      kind: "case_activity",
      occurredAt: reviewCase.updatedAt,
      title: `Case ${reviewCase.status}`,
      summary: reviewCase.patientLabel ?? reviewCase.id,
      source: "review_case",
      ehrWrite: false,
      metadata: { caseId: reviewCase.id, status: reviewCase.status }
    });
  }
  return events;
}

function modalityEvents(samples: StoredModalitySample[]): PatientTimelineEvent[] {
  return samples.map((sample) => {
    const biomarkers: BiomarkerLite | undefined = extractBiomarkerLite(sample);
    const biomarkerChips = biomarkers ? formatBiomarkerLite(biomarkers) : [];
    const summary =
      biomarkerChips.length > 0
        ? `${sample.summary} · ${biomarkerChips.join(" · ")}`
        : sample.summary;

    return {
      id: `modality-${sample.id}`,
      patientId: sample.patientId,
      kind: "modality_sample" as const,
      occurredAt: sample.recordedAt,
      title: `${sample.modality} sample`,
      summary,
      source: sample.provenance.source,
      ehrWrite: false as const,
      metadata: {
        modality: sample.modality,
        liveStream: false,
        consentedPurposeCode: sample.consentedPurposeCode,
        biomarkers,
        biomarkerLite: true,
        biomarkerNote: "Surfaced from ingested sample fields — not a biomarker derivation engine."
      }
    };
  });
}

function learningEvents(patientId: string, learning: LearningEvent[]): PatientTimelineEvent[] {
  return learning
    .filter((e) => e.patientId === patientId)
    .map((e) => ({
      id: `learning-${e.id}`,
      patientId,
      kind: "learning_outcome" as const,
      occurredAt: e.recordedAt,
      title: `Learning: ${e.agentLabel} / ${e.decision}`,
      summary: e.outcomeSummary ?? e.predictionSummary ?? e.governanceNote,
      source: "learning_events",
      ehrWrite: false as const,
      metadata: {
        outcomeKind: e.outcomeKind,
        autoRetrainTriggered: false,
        modelUpdated: false
      }
    }));
}

function consentEvents(patientId: string, grants: ConsentGrant[]): PatientTimelineEvent[] {
  return grants
    .filter((g) => g.patientId === patientId)
    .flatMap((g) => {
      const rows: PatientTimelineEvent[] = [
        {
          id: `consent-grant-${g.id}`,
          patientId,
          kind: "consent_change",
          occurredAt: g.grantedAt,
          title: `Consent granted: ${g.purposeCode}`,
          summary: `Modalities: ${g.modalities.join(", ")}`,
          source: "consent_registry",
          ehrWrite: false,
          metadata: { grantId: g.id, status: "active" }
        }
      ];
      if (g.status === "revoked" && g.revokedAt) {
        rows.push({
          id: `consent-revoke-${g.id}`,
          patientId,
          kind: "consent_change",
          occurredAt: g.revokedAt,
          title: `Consent revoked: ${g.purposeCode}`,
          summary: `Revoked by ${g.revokedBy ?? "unknown"}`,
          source: "consent_registry",
          ehrWrite: false,
          metadata: { grantId: g.id, status: "revoked" }
        });
      }
      return rows;
    });
}

export function buildPatientTimeline(options: {
  patientId: string;
  patientLabelHint?: string;
  cases?: ReviewCase[];
  modalitySamples?: StoredModalitySample[];
  learningEvents?: LearningEvent[];
  consentGrants?: ConsentGrant[];
  extraEvents?: PatientTimelineEvent[];
}): PatientTimeline {
  const patientId = options.patientId;
  const events = [
    ...caseEvents(patientId, options.cases ?? [], options.patientLabelHint),
    ...modalityEvents((options.modalitySamples ?? []).filter((s) => s.patientId === patientId)),
    ...learningEvents(patientId, options.learningEvents ?? []),
    ...consentEvents(patientId, options.consentGrants ?? []),
    ...(options.extraEvents ?? []).filter((e) => e.patientId === patientId)
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return {
    patientId,
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    events,
    note: "Longitudinal merge of synthetic/proof sources only — not a production unified health record."
  };
}
