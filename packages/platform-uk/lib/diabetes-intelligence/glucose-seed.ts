/**
 * Synthetic CGM / SMBG / HbA1c series for Phase 2 diabetes intelligence demos.
 * Deterministic enough for tests; clinically plausible for P002-style T2D.
 */

import { randomUUID } from "crypto";

import type { GlucoseIngestBatch, GlucoseIngestPoint } from "./glucose-types";

function hoursAgo(h: number, now = Date.now()): string {
  return new Date(now - h * 3_600_000).toISOString();
}

function daysAgo(d: number, hourUtc = 8, now = Date.now()): string {
  const t = new Date(now - d * 86_400_000);
  t.setUTCHours(hourUtc, 0, 0, 0);
  return t.toISOString();
}

/** ~15-min CGM for `days` with mild dawn rise and post-meal bumps; sparse gaps on day 3. */
export function buildSyntheticCgmBatch(
  patientId: string,
  options?: { days?: number; now?: number }
): GlucoseIngestBatch {
  const days = options?.days ?? 16;
  const now = options?.now ?? Date.now();
  const points: GlucoseIngestPoint[] = [];
  const intervalMin = 15;
  const steps = Math.floor((days * 24 * 60) / intervalMin);

  for (let i = steps; i >= 0; i--) {
    const atMs = now - i * intervalMin * 60_000;
    const dayIndex = Math.floor((i * intervalMin) / (24 * 60));
    // Introduce a multi-hour gap on synthetic day ~3 for missing-data demos
    const hourOfDay = new Date(atMs).getUTCHours();
    if (dayIndex === 3 && hourOfDay >= 10 && hourOfDay < 14) continue;

    const base = 7.2; // mmol/L
    const dawn = hourOfDay >= 4 && hourOfDay < 8 ? 1.1 : 0;
    const postMeal =
      (hourOfDay >= 12 && hourOfDay < 14) || (hourOfDay >= 18 && hourOfDay < 20)
        ? 2.4
        : 0;
    const nightLow = hourOfDay >= 2 && hourOfDay < 4 ? -0.8 : 0;
    const wobble = Math.sin(i / 11) * 0.35;
    let mmol = base + dawn + postMeal + nightLow + wobble;
    // Occasional very high for TAR flags
    if (i % 97 === 0) mmol = 14.5;
    // Occasional very low for hypo flag demos on denser series
    if (patientId === "P002" && i % 211 === 0) mmol = 2.8;

    points.push({
      recordedAt: new Date(atMs).toISOString(),
      value: Math.round(mmol * 10) / 10,
      unit: "mmol/L",
      qualityFlag: dayIndex === 3 && hourOfDay === 14 ? "gap" : "ok",
      verified: true,
      sourceReference: `synth-cgm-${patientId}`,
    });
  }

  return {
    channel: "cgm",
    sourceSystem: "synthetic_cgm_seed",
    points,
  };
}

export function buildSyntheticSmbgBatch(
  patientId: string,
  options?: { now?: number }
): GlucoseIngestBatch {
  const now = options?.now ?? Date.now();
  const contexts: Array<{ d: number; h: number; ctx: string; mmol: number; flag?: GlucoseIngestPoint["qualityFlag"] }> = [
    { d: 1, h: 7, ctx: "fasting", mmol: 8.4 },
    { d: 1, h: 13, ctx: "post_prandial", mmol: 11.2 },
    { d: 2, h: 7, ctx: "fasting", mmol: 7.9 },
    { d: 3, h: 22, ctx: "bedtime", mmol: 6.1 },
    { d: 4, h: 7, ctx: "fasting", mmol: 9.1 },
    { d: 5, h: 13, ctx: "post_prandial", mmol: 12.8 },
    { d: 6, h: 7, ctx: "fasting", mmol: 8.0, flag: "unverified" },
    { d: 8, h: 7, ctx: "fasting", mmol: 7.6 },
  ];
  if (patientId === "P003") {
    // Sparse patient — quality / missing demos
    return {
      channel: "smbg",
      sourceSystem: "synthetic_smbg_seed",
      points: [
        {
          recordedAt: daysAgo(2, 7, now),
          value: 10.2,
          unit: "mmol/L",
          context: "fasting",
          qualityFlag: "unverified",
          verified: false,
        },
      ],
    };
  }

  return {
    channel: "smbg",
    sourceSystem: "synthetic_smbg_seed",
    points: contexts.map((c) => ({
      recordedAt: daysAgo(c.d, c.h, now),
      value: c.mmol,
      unit: "mmol/L" as const,
      context: c.ctx,
      qualityFlag: c.flag ?? "ok",
      verified: c.flag !== "unverified",
      sourceReference: `synth-smbg-${patientId}`,
    })),
  };
}

export function buildSyntheticHba1cBatch(
  patientId: string,
  options?: { now?: number }
): GlucoseIngestBatch {
  const now = options?.now ?? Date.now();
  // P002 matches flagship worsening trajectory (≈58 → 68 mmol/mol)
  const series =
    patientId === "P002"
      ? [
          { monthsAgo: 9, mmol: 58 },
          { monthsAgo: 6, mmol: 64 },
          { monthsAgo: 3, mmol: 68 },
        ]
      : [
          { monthsAgo: 6, mmol: 52 },
          { monthsAgo: 2, mmol: 50 },
        ];

  return {
    channel: "lab_hba1c",
    sourceSystem: "synthetic_lab_seed",
    points: series.map((s) => ({
      recordedAt: hoursAgo(s.monthsAgo * 30 * 24, now),
      value: s.mmol,
      unit: "mmol/mol" as const,
      verified: true,
      qualityFlag: "ok" as const,
      sourceReference: `synth-hba1c-${patientId}-${s.monthsAgo}`,
    })),
  };
}

export function buildAllSyntheticBatches(
  patientId: string,
  options?: { now?: number; cgmDays?: number }
): GlucoseIngestBatch[] {
  const now = options?.now ?? Date.now();
  return [
    buildSyntheticCgmBatch(patientId, { days: options?.cgmDays ?? 16, now }),
    buildSyntheticSmbgBatch(patientId, { now }),
    buildSyntheticHba1cBatch(patientId, { now }),
  ];
}

/** Stable id helper for file-store seeds (tests may ignore). */
export function newReadingId(): string {
  return `gsr-${randomUUID()}`;
}
