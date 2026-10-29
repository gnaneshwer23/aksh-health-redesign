/**
 * Phase 2 — Diabetes glucose intelligence types.
 * Synthetic / simulation only. ehrWrite always false; reviews require HITL.
 */

import type { MissingDataIndicator } from "./types";

export type GlucoseChannel = "cgm" | "smbg" | "lab_hba1c";

export type GlucoseQualityFlag =
  | "ok"
  | "stale"
  | "unverified"
  | "conflict"
  | "missing"
  | "unassessed"
  | "gap";

/** Ingestion contract for CGM / SMBG / lab HbA1c points (synthetic staging). */
export type GlucoseIngestPoint = {
  recordedAt: string;
  /** Raw numeric as supplied by the channel. */
  value: number;
  unit: "mmol/L" | "mg/dL" | "mmol/mol" | "%";
  context?: string;
  qualityFlag?: GlucoseQualityFlag;
  sourceReference?: string;
  verified?: boolean;
};

export type GlucoseIngestBatch = {
  channel: GlucoseChannel;
  sourceSystem: string;
  points: GlucoseIngestPoint[];
};

export type GlucoseSeriesReading = {
  id: string;
  patientId: string;
  channel: GlucoseChannel;
  recordedAt: string;
  valueNumeric: number;
  unit: string;
  valueMmolL: number | null;
  valueMmolMol: number | null;
  context: string | null;
  qualityFlag: GlucoseQualityFlag;
  sourceSystem: string;
  sourceReference: string | null;
  verified: boolean;
  synthetic: true;
  ingestedAt: string;
};

export type ChartPoint = {
  at: string;
  /** Always mmol/L for glucose chart series; mmol/mol for HbA1c chart. */
  value: number;
  channel: GlucoseChannel;
  context?: string | null;
  qualityFlag: GlucoseQualityFlag;
};

export type TirAnalytics = {
  computed: boolean;
  sufficient: boolean;
  reason: string;
  windowDays: number;
  readings: number;
  days: number | null;
  wearPct: number | null;
  pct: {
    veryLow: number;
    low: number;
    inRange: number;
    high: number;
    veryHigh: number;
  } | null;
  meanMmol: number | null;
  cvPct: number | null;
  gmiMmolMol: number | null;
  flags: string[];
  /** Consensus adult targets citation — not a personalised clinical target. */
  definition:
    | "battelino_2019_consensus_adult"
    | "insufficient_data"
    | "not_applicable";
  explanations: string[];
};

export type HbA1cTrendSnapshot = {
  latestMmolMol: number | null;
  trend: "insufficient_data" | "improving" | "stable" | "worsening";
  predictedNext3MonthsMmolMol: number | null;
  isDiagnosticPrediction: false;
  series: ChartPoint[];
  explanations: string[];
  limitations: string[];
};

export type MeasurementQualityIndicator = {
  code: string;
  message: string;
  flag: GlucoseQualityFlag;
  field?: string;
};

export type GlucoseReviewStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SUPERSEDED";

export type GlucoseReviewSection = {
  id: string;
  title: string;
  items: string[];
  clinical: boolean;
};

export type GlucoseIntelligenceReview = {
  id: string;
  patientId: string;
  patientLabel: string;
  status: GlucoseReviewStatus;
  summarySections: GlucoseReviewSection[];
  calculationExplanations: string[];
  missingData: MissingDataIndicator[];
  qualityIndicators: MeasurementQualityIndicator[];
  worklistUrgency: number;
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  version: number;
  hitlRequired: true;
  ehrWrite: false;
  synthetic: true;
};

export type GlucoseReviewDecisionAction = "accept" | "edit" | "reject";

export type GlucoseReviewDecision = {
  id: string;
  reviewId: string;
  action: GlucoseReviewDecisionAction;
  actor: string;
  reason: string | null;
  editedSections: GlucoseReviewSection[] | null;
  createdAt: string;
};

export type GlucoseWorklistItem = {
  patientId: string;
  patientLabel: string;
  urgency: number;
  flags: string[];
  tirPercent: number | null;
  hba1cTrend: HbA1cTrendSnapshot["trend"];
  latestHba1cMmolMol: number | null;
  dataSufficient: boolean;
  pendingReviewId: string | null;
  missingDataCodes: string[];
  synthetic: true;
};

export type DiabetesGlucoseIntelligenceSnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  clinicalValidationClaim: false;
  cgm: {
    readings: GlucoseSeriesReading[];
    chart: ChartPoint[];
    tir: TirAnalytics;
  };
  smbg: {
    readings: GlucoseSeriesReading[];
    chart: ChartPoint[];
  };
  hba1c: HbA1cTrendSnapshot;
  missingData: MissingDataIndicator[];
  qualityIndicators: MeasurementQualityIndicator[];
  dataCompleteness: number;
  reviews: GlucoseIntelligenceReview[];
  worklistHint: GlucoseWorklistItem;
};
