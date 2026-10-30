/**
 * Assemble Phase 2 diabetes glucose intelligence snapshots + worklist + HITL reviews.
 */

import { getPatientById } from "../mock-data";
import {
  assessGlucoseSeriesQuality,
  computeHba1cTrend,
  computeTirAnalytics,
  readingsToChart,
  worklistUrgency,
} from "./glucose-calculations";
import {
  createGlucoseReview,
  decideGlucoseReview,
  listGlucoseReviews,
  listGlucoseSeries,
  listPendingGlucoseReviews,
  replacePatientGlucoseSeries,
} from "./glucose-repository";
import { buildAllSyntheticBatches } from "./glucose-seed";
import type {
  DiabetesGlucoseIntelligenceSnapshot,
  GlucoseIntelligenceReview,
  GlucoseReviewDecisionAction,
  GlucoseReviewSection,
  GlucoseWorklistItem,
} from "./glucose-types";

function patientLabel(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

function buildWorklistItem(
  snapshot: Omit<DiabetesGlucoseIntelligenceSnapshot, "worklistHint" | "reviews"> & {
    reviews?: GlucoseIntelligenceReview[];
  }
): GlucoseWorklistItem {
  const pending = (snapshot.reviews ?? []).find((r) => r.status === "DRAFT");
  const missingCodes = snapshot.missingData.map((m) => m.code);
  return {
    patientId: snapshot.patientId,
    patientLabel: snapshot.patientLabel,
    urgency: worklistUrgency({
      tir: snapshot.cgm.tir,
      hba1cTrend: snapshot.hba1c.trend,
      missingCodes,
    }),
    flags: [
      ...snapshot.cgm.tir.flags.filter((f) => f !== "insufficient_data"),
      ...snapshot.missingData.slice(0, 4).map((m) => m.message),
    ],
    tirPercent: snapshot.cgm.tir.pct?.inRange ?? null,
    hba1cTrend: snapshot.hba1c.trend,
    latestHba1cMmolMol: snapshot.hba1c.latestMmolMol,
    dataSufficient: snapshot.cgm.tir.sufficient,
    pendingReviewId: pending?.id ?? null,
    missingDataCodes: missingCodes,
    synthetic: true,
  };
}

export async function buildDiabetesGlucoseIntelligence(
  patientId: string,
  options?: { scopeKey?: string; now?: number }
): Promise<DiabetesGlucoseIntelligenceSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const label = patientLabel(patientId);
  const all = await listGlucoseSeries(patientId, { scopeKey });
  const cgm = all.filter((r) => r.channel === "cgm");
  const smbg = all.filter((r) => r.channel === "smbg");
  const hba1cRows = all.filter((r) => r.channel === "lab_hba1c");

  const tir = computeTirAnalytics(cgm, options?.now ?? Date.now());
  const hba1c = computeHba1cTrend(patientId, label, hba1cRows);
  const quality = assessGlucoseSeriesQuality({ cgm, smbg, hba1c: hba1cRows, tir });
  const reviews = await listGlucoseReviews(patientId, { scopeKey });

  const base = {
    patientId,
    patientLabel: label,
    synthetic: true as const,
    ehrWrite: false as const,
    hitlRequired: true as const,
    clinicalValidationClaim: false as const,
    cgm: {
      readings: cgm,
      chart: readingsToChart(cgm),
      tir,
    },
    smbg: {
      readings: smbg,
      chart: readingsToChart(smbg),
    },
    hba1c,
    missingData: quality.missingData,
    qualityIndicators: quality.qualityIndicators,
    dataCompleteness: quality.dataCompleteness,
    reviews,
  };

  return {
    ...base,
    worklistHint: buildWorklistItem(base),
  };
}

export async function seedAndBuildDiabetesGlucoseIntelligence(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; now?: number; cgmDays?: number }
): Promise<DiabetesGlucoseIntelligenceSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const batches = buildAllSyntheticBatches(patientId, {
    now: options?.now,
    cgmDays: options?.cgmDays ?? 16,
  });
  await replacePatientGlucoseSeries(patientId, batches, { scopeKey });
  return buildDiabetesGlucoseIntelligence(patientId, {
    scopeKey,
    now: options?.now,
  });
}

export async function draftGlucoseIntelligenceReview(
  patientId: string,
  options: { scopeKey?: string; createdBy: string; now?: number }
): Promise<DiabetesGlucoseIntelligenceSnapshot> {
  const scopeKey = options.scopeKey ?? "shared";
  const snap = await buildDiabetesGlucoseIntelligence(patientId, {
    scopeKey,
    now: options.now,
  });

  const sections: GlucoseReviewSection[] = [
    {
      id: "hba1c",
      title: "HbA1c trend (deterministic)",
      clinical: true,
      items: [
        ...snap.hba1c.explanations,
        `Trend label: ${snap.hba1c.trend}`,
        "Non-diagnostic; clinician confirms before patient-facing use.",
      ],
    },
    {
      id: "tir",
      title: "Time-in-range analytics",
      clinical: true,
      items: [
        ...snap.cgm.tir.explanations,
        snap.cgm.tir.sufficient
          ? "Consensus sufficiency met — percentages may inform clinician review."
          : "Sufficiency not met — percentages are informational only.",
      ],
    },
    {
      id: "quality",
      title: "Missing data & measurement quality",
      clinical: false,
      items: [
        ...snap.missingData.map((m) => m.message),
        ...snap.qualityIndicators.slice(0, 6).map((q) => q.message),
        `Data completeness score: ${snap.dataCompleteness}`,
      ],
    },
    {
      id: "safety",
      title: "Safety & honesty",
      clinical: true,
      items: [
        "ehrWrite remains false — no EHR write from this review.",
        "No autonomous prescribing or dose recommendation.",
        "Synthetic demo data until integrations and clinical governance approve live use.",
        "Not clinically validated.",
      ],
    },
  ];

  const explanations = [
    ...snap.hba1c.explanations,
    ...snap.cgm.tir.explanations,
    ...snap.hba1c.limitations.slice(0, 2),
  ];

  await createGlucoseReview(
    {
      patientId,
      patientLabel: snap.patientLabel,
      summarySections: sections,
      calculationExplanations: explanations,
      missingData: snap.missingData,
      qualityIndicators: snap.qualityIndicators,
      worklistUrgency: snap.worklistHint.urgency,
      createdBy: options.createdBy,
    },
    { scopeKey }
  );

  return buildDiabetesGlucoseIntelligence(patientId, { scopeKey, now: options.now });
}

export async function decideGlucoseIntelligenceReview(
  input: {
    patientId: string;
    reviewId: string;
    action: GlucoseReviewDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: GlucoseReviewSection[];
  },
  options?: { scopeKey?: string }
): Promise<
  DiabetesGlucoseIntelligenceSnapshot & {
    shieldAuditWriteFailed?: boolean;
    shieldAuditWriteReason?: string | null;
  }
> {
  await decideGlucoseReview(input, options);
  const { persistDiabetesDomainShieldDecision } = await import("./shield-decision-audit");
  const shield = await persistDiabetesDomainShieldDecision({
    source: "glucose_review",
    action: input.action,
    actor: input.actor,
    patientId: input.patientId,
    subjectId: input.reviewId,
    reason: input.reason,
  });
  const snap = await buildDiabetesGlucoseIntelligence(input.patientId, {
    scopeKey: options?.scopeKey,
  });
  return {
    ...snap,
    shieldAuditWriteFailed: shield.shieldAuditWriteFailed,
    shieldAuditWriteReason: shield.shieldAuditWriteReason,
  };
}

export async function buildGlucoseIntelligenceWorklist(options?: {
  scopeKey?: string;
  patientIds?: string[];
}): Promise<GlucoseWorklistItem[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const pending = await listPendingGlucoseReviews({ scopeKey });
  const ids = new Set<string>([
    ...(options?.patientIds ?? ["P002", "P003", "P001"]),
    ...pending.map((p) => p.patientId),
  ]);

  const items: GlucoseWorklistItem[] = [];
  for (const patientId of ids) {
    const snap = await buildDiabetesGlucoseIntelligence(patientId, { scopeKey });
    // Prefer patients with any glucose data or a pending review
    if (
      snap.cgm.readings.length ||
      snap.smbg.readings.length ||
      snap.hba1c.series.length ||
      snap.worklistHint.pendingReviewId
    ) {
      items.push(snap.worklistHint);
    }
  }

  return items.sort((a, b) => a.urgency - b.urgency || a.patientId.localeCompare(b.patientId));
}
