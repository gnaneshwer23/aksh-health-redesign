/**
 * Explainable deterministic clinical calculations for Phase 2 glucose intelligence.
 * Reuses CGM consensus metrics (Battelino 2019) and HbA1c two-point trend rules.
 * Never claims diagnostic authority or clinical validation.
 */

import { computeMetrics, type CgmPoint } from "../cgm/metrics";
import { buildHbA1cSignal } from "../disease-modules/diabetes/hba1c";
import type { DiabetesHbA1cReading } from "../disease-modules/diabetes/types";
import { MG_PER_MMOL, hba1cMmolFromPercent } from "../units";
import type { MissingDataIndicator } from "./types";
import type {
  ChartPoint,
  GlucoseIngestPoint,
  GlucoseQualityFlag,
  GlucoseSeriesReading,
  HbA1cTrendSnapshot,
  MeasurementQualityIndicator,
  TirAnalytics,
} from "./glucose-types";

export function toMmolL(value: number, unit: string): number | null {
  if (unit === "mmol/L") return value;
  if (unit === "mg/dL") return value / MG_PER_MMOL;
  return null;
}

export function toMmolMol(value: number, unit: string): number | null {
  if (unit === "mmol/mol") return value;
  if (unit === "%") return hba1cMmolFromPercent(value);
  return null;
}

export function normalizeIngestPoint(
  point: GlucoseIngestPoint,
  channel: "cgm" | "smbg" | "lab_hba1c"
): {
  valueMmolL: number | null;
  valueMmolMol: number | null;
  qualityFlag: GlucoseQualityFlag;
} {
  if (channel === "lab_hba1c") {
    const valueMmolMol = toMmolMol(point.value, point.unit);
    return {
      valueMmolL: null,
      valueMmolMol,
      qualityFlag: valueMmolMol == null ? "unassessed" : (point.qualityFlag ?? "ok"),
    };
  }
  const valueMmolL = toMmolL(point.value, point.unit);
  return {
    valueMmolL,
    valueMmolMol: null,
    qualityFlag: valueMmolL == null ? "unassessed" : (point.qualityFlag ?? "ok"),
  };
}

export function readingsToChart(readings: GlucoseSeriesReading[]): ChartPoint[] {
  return readings
    .map((r) => {
      const value =
        r.channel === "lab_hba1c" ? r.valueMmolMol : r.valueMmolL;
      if (value == null) return null;
      return {
        at: r.recordedAt,
        value: Math.round(value * 100) / 100,
        channel: r.channel,
        context: r.context,
        qualityFlag: r.qualityFlag,
      } satisfies ChartPoint;
    })
    .filter((p): p is ChartPoint => p != null)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** TIR only when CGM-grade sufficiency (≥14 days, ≥70% wear) is met — same rule as lib/cgm/metrics. */
export function computeTirAnalytics(
  cgmReadings: GlucoseSeriesReading[],
  now = Date.now()
): TirAnalytics {
  const points: CgmPoint[] = cgmReadings
    .filter((r) => r.valueMmolL != null && r.qualityFlag !== "missing")
    .map((r) => ({ at: r.recordedAt, mmol: r.valueMmolL! }));

  const explanations: string[] = [
    "Time-in-range uses international consensus bands (Battelino et al., Diabetes Care 2019): very low <3.0, low 3.0–3.8, in range 3.9–10.0, high 10.1–13.9, very high >13.9 mmol/L.",
    "General adult targets (TIR >70%, TBR <4%, TAR <25%, CV ≤36%) are reference flags for clinicians — not personalised targets and not a diagnosis.",
  ];

  if (points.length < 2) {
    return {
      computed: false,
      sufficient: false,
      reason: "Fewer than 2 usable CGM points in window",
      windowDays: 14,
      readings: points.length,
      days: null,
      wearPct: null,
      pct: null,
      meanMmol: null,
      cvPct: null,
      gmiMmolMol: null,
      flags: ["insufficient_data"],
      definition: "insufficient_data",
      explanations: [
        ...explanations,
        "TIR withheld: need ≥2 CGM points before any percentage is computed.",
      ],
    };
  }

  const metrics = computeMetrics(points, 14, now, "mmol/L");
  if (!metrics) {
    return {
      computed: false,
      sufficient: false,
      reason: "Metric engine returned null",
      windowDays: 14,
      readings: points.length,
      days: null,
      wearPct: null,
      pct: null,
      meanMmol: null,
      cvPct: null,
      gmiMmolMol: null,
      flags: ["insufficient_data"],
      definition: "insufficient_data",
      explanations: [...explanations, "TIR withheld: computeMetrics could not form a window."],
    };
  }

  const computed = true;
  const sufficient = metrics.sufficient;
  return {
    computed,
    sufficient,
    reason: sufficient
      ? "≥14 days coverage and ≥70% sensor wear — consensus sufficiency met"
      : `Data present but not consensus-sufficient (${metrics.days} days, ${metrics.wearPct}% wear; needs 14 days and 70%)`,
    windowDays: 14,
    readings: metrics.readings,
    days: metrics.days,
    wearPct: metrics.wearPct,
    pct: metrics.pct,
    meanMmol: metrics.meanMmol,
    cvPct: metrics.cvPct,
    gmiMmolMol: metrics.gmiMmolMol,
    flags: metrics.flags,
    definition: sufficient ? "battelino_2019_consensus_adult" : "insufficient_data",
    explanations: [
      ...explanations,
      `Window ${metrics.from} → ${metrics.to}: ${metrics.readings} readings, ${metrics.days} days, wear ${metrics.wearPct}%.`,
      sufficient
        ? `TIR ${metrics.pct.inRange}% (in-range 3.9–10.0 mmol/L). GMI ≈ ${metrics.gmiMmolMol} mmol/mol. CV ${metrics.cvPct}%.`
        : "Percentages are shown for transparency but marked insufficient for clinical decision use until wear/days criteria are met.",
    ],
  };
}

export function computeHba1cTrend(
  patientId: string,
  patientLabel: string,
  hba1cReadings: GlucoseSeriesReading[]
): HbA1cTrendSnapshot {
  const series = readingsToChart(hba1cReadings.filter((r) => r.channel === "lab_hba1c"));
  const moduleReadings: DiabetesHbA1cReading[] = series.map((p) => ({
    recordedAt: p.at,
    valueMmolMol: p.value,
  }));
  const signal = buildHbA1cSignal(
    { patientId, patientLabel },
    moduleReadings,
    "patient_state_ingest"
  );
  return {
    latestMmolMol: signal.latestValueMmolMol,
    trend: signal.trend,
    predictedNext3MonthsMmolMol: signal.predictedNext3MonthsMmolMol,
    isDiagnosticPrediction: false,
    series,
    explanations: signal.explanation,
    limitations: signal.limitations,
  };
}

export function assessGlucoseSeriesQuality(input: {
  cgm: GlucoseSeriesReading[];
  smbg: GlucoseSeriesReading[];
  hba1c: GlucoseSeriesReading[];
  tir: TirAnalytics;
}): {
  missingData: MissingDataIndicator[];
  qualityIndicators: MeasurementQualityIndicator[];
  dataCompleteness: number;
} {
  const missingData: MissingDataIndicator[] = [];
  const qualityIndicators: MeasurementQualityIndicator[] = [];

  if (input.cgm.length === 0) {
    missingData.push({
      code: "cgm_none",
      message: "No CGM readings ingested",
      field: "cgm",
    });
  }
  if (input.smbg.length === 0) {
    missingData.push({
      code: "smbg_none",
      message: "No SMBG readings ingested",
      field: "smbg",
    });
  }
  if (input.hba1c.length === 0) {
    missingData.push({
      code: "hba1c_none",
      message: "No HbA1c lab points ingested",
      field: "hba1c",
    });
  } else if (input.hba1c.length < 2) {
    missingData.push({
      code: "hba1c_single",
      message: "Only one HbA1c point — trend needs ≥2",
      field: "hba1c",
    });
  }

  if (!input.tir.sufficient) {
    missingData.push({
      code: "tir_insufficient",
      message: input.tir.reason,
      field: "tir",
    });
  }

  const flagged = [...input.cgm, ...input.smbg, ...input.hba1c].filter(
    (r) => r.qualityFlag !== "ok"
  );
  for (const r of flagged.slice(0, 12)) {
    qualityIndicators.push({
      code: `quality_${r.qualityFlag}`,
      message: `${r.channel} @ ${r.recordedAt}: ${r.qualityFlag}`,
      flag: r.qualityFlag,
      field: r.channel,
    });
  }

  const unverified = [...input.cgm, ...input.smbg].filter((r) => !r.verified).length;
  if (unverified > 0) {
    qualityIndicators.push({
      code: "unverified_glucose",
      message: `${unverified} glucose reading(s) not clinician-verified`,
      flag: "unverified",
      field: "verified",
    });
  }

  let score = 0;
  if (input.cgm.length >= 10) score += 0.35;
  else if (input.cgm.length > 0) score += 0.15;
  if (input.smbg.length >= 3) score += 0.2;
  else if (input.smbg.length > 0) score += 0.1;
  if (input.hba1c.length >= 2) score += 0.25;
  else if (input.hba1c.length === 1) score += 0.1;
  if (input.tir.sufficient) score += 0.2;
  else if (input.tir.computed) score += 0.05;

  return {
    missingData,
    qualityIndicators,
    dataCompleteness: Math.min(1, Number(score.toFixed(2))),
  };
}

/** Urgency: hypo flags first, then insufficient data, then hyper / worsening HbA1c. */
export function worklistUrgency(input: {
  tir: TirAnalytics;
  hba1cTrend: HbA1cTrendSnapshot["trend"];
  missingCodes: string[];
}): number {
  if (input.tir.pct && input.tir.pct.veryLow >= 1) return 0;
  if (input.tir.pct && input.tir.pct.veryLow + input.tir.pct.low >= 4) return 1;
  if (input.missingCodes.includes("cgm_none") && input.missingCodes.includes("smbg_none"))
    return 2;
  if (!input.tir.sufficient) return 3;
  if (input.hba1cTrend === "worsening") return 4;
  if (input.tir.pct && input.tir.pct.inRange < 70) return 5;
  return 6;
}
