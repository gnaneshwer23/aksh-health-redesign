/**
 * INT-02 — glucose dual-store bridge.
 *
 * Canonical series for diabetes glucose intelligence: `glucose_series_readings`
 * (via glucose-repository). Journey / disease-module patient-state ingest remains
 * for clinical-spine consumers; writes from the connected journey dual-write into
 * the canonical series so UI state stays consistent. No Neon schema changes.
 */

import { MG_PER_MMOL } from "../units";
import {
  loadIngestedDiabetesReadings,
  recordDiabetesGlucoseReading,
} from "../disease-modules/diabetes/ingest";
import { appendGlucoseBatch, listGlucoseSeries } from "./glucose-repository";
import type { GlucoseSeriesReading } from "./glucose-types";
import type { GlucoseObservation } from "./types";

export const GLUCOSE_CANONICAL_STORE = "glucose_series_readings" as const;
export const GLUCOSE_LEGACY_INGEST_STORE = "patient_state_diabetes_ingest" as const;

export type GlucoseBridgeWriteResult = {
  observation: GlucoseObservation;
  seriesReadingIds: string[];
  patientStateFactWritten: true;
  canonicalStore: typeof GLUCOSE_CANONICAL_STORE;
  ehrWrite: false;
};

function seriesToMgDl(reading: GlucoseSeriesReading): number | null {
  if (reading.channel === "lab_hba1c") return null;
  if (reading.unit === "mg/dL") return reading.valueNumeric;
  if (reading.valueMmolL != null) return Math.round(reading.valueMmolL * MG_PER_MMOL);
  if (reading.unit === "mmol/L") return Math.round(reading.valueNumeric * MG_PER_MMOL);
  return null;
}

function seriesContext(
  reading: GlucoseSeriesReading
): GlucoseObservation["context"] | undefined {
  const c = reading.context?.trim().toLowerCase();
  if (!c) return undefined;
  if (c === "fasting" || c === "post_prandial" || c === "bedtime" || c === "unspecified") {
    return c;
  }
  return "unspecified";
}

/** Map canonical glucose series → journey observation panel shape. */
export function glucoseSeriesToObservations(
  readings: GlucoseSeriesReading[]
): GlucoseObservation[] {
  const out: GlucoseObservation[] = [];
  for (const r of readings) {
    if (r.channel === "lab_hba1c") continue;
    const glucoseMgDl = seriesToMgDl(r);
    if (glucoseMgDl == null || !Number.isFinite(glucoseMgDl)) continue;
    out.push({
      recordedAt: r.recordedAt,
      glucoseMgDl,
      context: seriesContext(r),
    });
  }
  return out.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/**
 * Prefer canonical glucose series; fall back to disease-module patient-state ingest.
 * Dedupes by recordedAt when both stores have overlapping points.
 */
export async function loadUnifiedGlucoseObservations(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<{
  observations: GlucoseObservation[];
  fromCanonicalSeries: boolean;
  fromLegacyIngest: boolean;
  canonicalCount: number;
  legacyCount: number;
}> {
  const scopeKey = options?.scopeKey ?? "shared";
  const series = await listGlucoseSeries(patientId, { scopeKey });
  const fromSeries = glucoseSeriesToObservations(series);

  const { glucoseReadings } = await loadIngestedDiabetesReadings(patientId, { scopeKey });
  const fromLegacy: GlucoseObservation[] = glucoseReadings.map((r) => ({
    recordedAt: r.recordedAt,
    glucoseMgDl: r.glucoseMgDl,
    context: r.context,
  }));

  if (fromSeries.length > 0) {
    const byAt = new Map<string, GlucoseObservation>();
    for (const o of fromLegacy) byAt.set(o.recordedAt, o);
    for (const o of fromSeries) byAt.set(o.recordedAt, o); // series wins on conflict
    return {
      observations: [...byAt.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
      fromCanonicalSeries: true,
      fromLegacyIngest: fromLegacy.length > 0,
      canonicalCount: fromSeries.length,
      legacyCount: fromLegacy.length,
    };
  }

  return {
    observations: fromLegacy.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    fromCanonicalSeries: false,
    fromLegacyIngest: fromLegacy.length > 0,
    canonicalCount: 0,
    legacyCount: fromLegacy.length,
  };
}

/**
 * Connected-journey / disease-module glucose write: patient-state ingest +
 * canonical SMBG series append (same recordedAt / value).
 */
export async function recordGlucoseViaBridge(
  input: {
    patientId: string;
    reading: {
      recordedAt: string;
      glucoseMgDl: number;
      context?: "fasting" | "post_prandial" | "bedtime" | "unspecified";
    };
  },
  options?: { scopeKey?: string; sourceSystem?: string }
): Promise<GlucoseBridgeWriteResult> {
  const scopeKey = options?.scopeKey ?? "shared";
  const sourceSystem = options?.sourceSystem ?? "connected_diabetes_bridge";

  await recordDiabetesGlucoseReading(
    {
      patientId: input.patientId,
      reading: {
        recordedAt: input.reading.recordedAt,
        glucoseMgDl: input.reading.glucoseMgDl,
        context: input.reading.context,
      },
      source: { system: sourceSystem },
    },
    { scopeKey }
  );

  const seriesRows = await appendGlucoseBatch(
    input.patientId,
    {
      channel: "smbg",
      sourceSystem,
      points: [
        {
          recordedAt: input.reading.recordedAt,
          value: input.reading.glucoseMgDl,
          unit: "mg/dL",
          context: input.reading.context,
          qualityFlag: "ok",
          verified: false,
        },
      ],
    },
    { scopeKey }
  );

  return {
    observation: {
      recordedAt: input.reading.recordedAt,
      glucoseMgDl: input.reading.glucoseMgDl,
      context: input.reading.context,
    },
    seriesReadingIds: seriesRows.map((r) => r.id),
    patientStateFactWritten: true,
    canonicalStore: GLUCOSE_CANONICAL_STORE,
    ehrWrite: false,
  };
}
