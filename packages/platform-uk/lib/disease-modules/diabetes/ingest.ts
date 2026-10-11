/**
 * C6 (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-2): real longitudinal
 * glucose/HbA1c ingestion tied to Patient State (C1).
 *
 * Writes one Patient State fact (lib/patient-state/repository.ts) per
 * reading, using a per-reading-kind factType ("diabetes_glucose_reading" /
 * "diabetes_hba1c_reading"). Because a new reading of the same factType
 * marks the prior one superseded (never deleted/mutated — see C1's
 * append-only guarantee), `listPatientStateFacts` reconstructs the full,
 * ordered series for a patient: nothing is lost, and every reading keeps its
 * own provenance (`source.system`).
 *
 * IMPORTANT (client-bundle safety, lesson from C5's `696e14b` fix): this
 * file transitively imports lib/patient-state/repository.ts, which imports
 * fs/promises + the Postgres client — Node-only. It is deliberately NOT
 * re-exported from lib/disease-modules/diabetes/index.ts (the barrel that
 * client components import via lib/precision-health/population-diabetes.ts).
 * Server-only call sites (API routes, lib/clinical-spine/orchestrate.ts)
 * must import directly from "./ingest".
 *
 * Does NOT touch lib/precision-health/modalities.ts and does NOT invent a
 * new glucose/CGM modality schema — OQ-DIAB-1 (docs/PHASED_BUILD_PLAN.md B3)
 * is still open. This module only gives glucose.ts/hba1c.ts a second,
 * real-data source of the SAME `DiabetesGlucoseReading`/`DiabetesHbA1cReading`
 * shapes fixtures.ts already used — glucose.ts's own derivation stays the
 * honest `insufficient_data` stub regardless of where readings came from.
 */

import { recordPatientStateFact, listPatientStateFacts } from "../../patient-state/repository";
import type { PatientStateFactSource } from "../../patient-state/types";
import type { DiabetesGlucoseReading, DiabetesHbA1cReading } from "./types";
import type { DiabetesFixtureBundle } from "./fixtures";

export const DIABETES_GLUCOSE_FACT_TYPE = "diabetes_glucose_reading";
export const DIABETES_HBA1C_FACT_TYPE = "diabetes_hba1c_reading";

export type RecordDiabetesGlucoseReadingInput = {
  patientId: string;
  reading: DiabetesGlucoseReading;
  source?: PatientStateFactSource;
  confidence?: number;
};

export type RecordDiabetesHbA1cReadingInput = {
  patientId: string;
  reading: DiabetesHbA1cReading;
  source?: PatientStateFactSource;
  confidence?: number;
};

const DEFAULT_INGEST_SOURCE: PatientStateFactSource = { system: "diabetes_ingest" };

/** Records one glucose reading as a Patient State fact. Never fabricates — the caller supplies the actual reading. */
export async function recordDiabetesGlucoseReading(
  input: RecordDiabetesGlucoseReadingInput,
  options?: { scopeKey?: string }
) {
  return recordPatientStateFact(
    {
      patientId: input.patientId,
      factType: DIABETES_GLUCOSE_FACT_TYPE,
      value: input.reading,
      source: input.source ?? DEFAULT_INGEST_SOURCE,
      confidence: input.confidence,
      effectiveAt: input.reading.recordedAt
    },
    options
  );
}

/** Records one HbA1c reading as a Patient State fact. Never fabricates — the caller supplies the actual lab value. */
export async function recordDiabetesHbA1cReading(
  input: RecordDiabetesHbA1cReadingInput,
  options?: { scopeKey?: string }
) {
  return recordPatientStateFact(
    {
      patientId: input.patientId,
      factType: DIABETES_HBA1C_FACT_TYPE,
      value: input.reading,
      source: input.source ?? DEFAULT_INGEST_SOURCE,
      confidence: input.confidence,
      effectiveAt: input.reading.recordedAt
    },
    options
  );
}

function isGlucoseReadingShape(value: unknown): value is DiabetesGlucoseReading {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DiabetesGlucoseReading).recordedAt === "string" &&
    typeof (value as DiabetesGlucoseReading).glucoseMgDl === "number"
  );
}

function isHbA1cReadingShape(value: unknown): value is DiabetesHbA1cReading {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DiabetesHbA1cReading).recordedAt === "string" &&
    typeof (value as DiabetesHbA1cReading).valuePercent === "number"
  );
}

function sortByRecordedAt<T extends { recordedAt: string }>(readings: T[]): T[] {
  return [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

/** Last write wins per recordedAt — avoids duplicate golden re-ingests collapsing clinical trends. */
function dedupeByRecordedAt<T extends { recordedAt: string }>(readings: T[]): T[] {
  const byTime = new Map<string, T>();
  for (const reading of readings) {
    byTime.set(reading.recordedAt, reading);
  }
  return sortByRecordedAt([...byTime.values()]);
}

export type IngestedDiabetesReadings = {
  glucoseReadings: DiabetesGlucoseReading[];
  hba1cReadings: DiabetesHbA1cReading[];
};

/**
 * Reads back the full ingested series for a patient (superseded + current
 * facts alike — nothing is dropped), never throws: an unknown patient id or
 * an empty store both resolve to `{ glucoseReadings: [], hba1cReadings: [] }`,
 * mirroring the module's existing "honest empty, not a crash" convention
 * (see lib/patient-state/repository.ts's own unknown-patient behaviour).
 */
export async function loadIngestedDiabetesReadings(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<IngestedDiabetesReadings> {
  try {
    const { facts } = await listPatientStateFacts(patientId, options);
    const glucoseReadings = dedupeByRecordedAt(
      facts.filter((f) => f.factType === DIABETES_GLUCOSE_FACT_TYPE).map((f) => f.value).filter(isGlucoseReadingShape)
    );
    const hba1cReadings = dedupeByRecordedAt(
      facts.filter((f) => f.factType === DIABETES_HBA1C_FACT_TYPE).map((f) => f.value).filter(isHbA1cReadingShape)
    );
    return { glucoseReadings, hba1cReadings };
  } catch (error) {
    console.error("[disease-modules/diabetes/ingest] loadIngestedDiabetesReadings failed — degrading to empty (fail-open)", error);
    return { glucoseReadings: [], hba1cReadings: [] };
  }
}

export type DiabetesPatientStateOverrides = {
  input: Partial<DiabetesFixtureBundle>;
  glucoseReadingsSource?: "patient_state_ingest" | "care_network_cgm";
  hba1cReadingsSource?: "patient_state_ingest" | "care_network_cgm";
};

/** Readings from the care network (trusted CGM, recorded HbA1c) for a care-network patient. */
export type CareNetworkDiabetesReadings = { glucoseReadings: DiabetesGlucoseReading[]; hba1cReadings: DiabetesHbA1cReading[] };

/**
 * Builds the `input` override + provenance flags for
 * `buildDiabetesRiskContribution` (index.ts). Only sets a bundle key when
 * real ingested readings exist for that kind — when nothing has been
 * ingested yet, `input` is `{}` and the composite falls back to
 * `getDiabetesFixtureBundle` byte-for-byte, exactly as before this phase
 * (the regression guarantee migration plan P1-2 requires).
 */
export async function loadDiabetesPatientStateOverrides(
  patientId: string,
  options?: { scopeKey?: string; careNetwork?: CareNetworkDiabetesReadings }
): Promise<DiabetesPatientStateOverrides> {
  const { glucoseReadings, hba1cReadings } = await loadIngestedDiabetesReadings(patientId, options);
  const input: Partial<DiabetesFixtureBundle> = {};
  const overrides: DiabetesPatientStateOverrides = { input };

  // Patient State ingest wins when present; otherwise care-network readings, each tagged with its own source.
  if (glucoseReadings.length > 0) {
    input.glucoseReadings = glucoseReadings;
    overrides.glucoseReadingsSource = "patient_state_ingest";
  } else if (options?.careNetwork?.glucoseReadings.length) {
    input.glucoseReadings = options.careNetwork.glucoseReadings;
    overrides.glucoseReadingsSource = "care_network_cgm";
  }
  if (hba1cReadings.length > 0) {
    input.hba1cReadings = hba1cReadings;
    overrides.hba1cReadingsSource = "patient_state_ingest";
  } else if (options?.careNetwork?.hba1cReadings.length) {
    input.hba1cReadings = options.careNetwork.hba1cReadings;
    overrides.hba1cReadingsSource = "care_network_cgm";
  }

  return overrides;
}
