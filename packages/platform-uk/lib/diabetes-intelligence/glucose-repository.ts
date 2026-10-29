import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { normalizeIngestPoint } from "./glucose-calculations";
import type {
  GlucoseChannel,
  GlucoseIngestBatch,
  GlucoseIntelligenceReview,
  GlucoseQualityFlag,
  GlucoseReviewDecision,
  GlucoseReviewDecisionAction,
  GlucoseReviewSection,
  GlucoseSeriesReading,
} from "./glucose-types";
import type { MissingDataIndicator } from "./types";
import type { MeasurementQualityIndicator } from "./glucose-types";

type Store = {
  readings: GlucoseSeriesReading[];
  reviews: GlucoseIntelligenceReview[];
  decisions: GlucoseReviewDecision[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared"
      ? "diabetes-glucose-intelligence.json"
      : `diabetes-glucose-intelligence.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      readings: Array.isArray(parsed.readings) ? parsed.readings : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    };
  } catch {
    return { readings: [], reviews: [], decisions: [] };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function usePg(): boolean {
  return isPostgresConfigured();
}

function mapReadingRow(r: {
  id: string;
  patient_id: string;
  channel: GlucoseChannel;
  recorded_at: Date | string;
  value_numeric: number;
  unit: string;
  value_mmol_l: number | null;
  value_mmol_mol: number | null;
  context: string | null;
  quality_flag: GlucoseQualityFlag;
  source_system: string;
  source_reference: string | null;
  verified: boolean;
  ingested_at: Date | string;
}): GlucoseSeriesReading {
  return {
    id: r.id,
    patientId: r.patient_id,
    channel: r.channel,
    recordedAt: new Date(r.recorded_at).toISOString(),
    valueNumeric: Number(r.value_numeric),
    unit: r.unit,
    valueMmolL: r.value_mmol_l == null ? null : Number(r.value_mmol_l),
    valueMmolMol: r.value_mmol_mol == null ? null : Number(r.value_mmol_mol),
    context: r.context,
    qualityFlag: r.quality_flag,
    sourceSystem: r.source_system,
    sourceReference: r.source_reference,
    verified: r.verified,
    synthetic: true,
    ingestedAt: new Date(r.ingested_at).toISOString(),
  };
}

export async function replacePatientGlucoseSeries(
  patientId: string,
  batches: GlucoseIngestBatch[],
  options?: { scopeKey?: string }
): Promise<GlucoseSeriesReading[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();
  const rows: GlucoseSeriesReading[] = [];

  for (const batch of batches) {
    for (const point of batch.points) {
      const norm = normalizeIngestPoint(point, batch.channel);
      rows.push({
        id: `gsr-${randomUUID()}`,
        patientId,
        channel: batch.channel,
        recordedAt: point.recordedAt,
        valueNumeric: point.value,
        unit: point.unit,
        valueMmolL: norm.valueMmolL,
        valueMmolMol: norm.valueMmolMol,
        context: point.context ?? null,
        qualityFlag: norm.qualityFlag,
        sourceSystem: batch.sourceSystem,
        sourceReference: point.sourceReference ?? null,
        verified: point.verified ?? false,
        synthetic: true,
        ingestedAt: now,
      });
    }
  }

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM aksh.glucose_series_readings WHERE scope_key = $1 AND patient_id = $2`,
        [scopeKey, patientId]
      );
      for (const row of rows) {
        await client.query(
          `INSERT INTO aksh.glucose_series_readings
            (id, scope_key, patient_id, channel, recorded_at, value_numeric, unit,
             value_mmol_l, value_mmol_mol, context, quality_flag, source_system,
             source_reference, verified, synthetic, ingested_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)`,
          [
            row.id,
            scopeKey,
            row.patientId,
            row.channel,
            row.recordedAt,
            row.valueNumeric,
            row.unit,
            row.valueMmolL,
            row.valueMmolMol,
            row.context,
            row.qualityFlag,
            row.sourceSystem,
            row.sourceReference,
            row.verified,
            row.ingestedAt,
          ]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return rows;
  }

  const store = await readStore(scopeKey);
  store.readings = [
    ...store.readings.filter((r) => r.patientId !== patientId),
    ...rows,
  ];
  await writeStore(store, scopeKey);
  return rows;
}

export async function appendGlucoseBatch(
  patientId: string,
  batch: GlucoseIngestBatch,
  options?: { scopeKey?: string }
): Promise<GlucoseSeriesReading[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();
  const rows: GlucoseSeriesReading[] = batch.points.map((point) => {
    const norm = normalizeIngestPoint(point, batch.channel);
    return {
      id: `gsr-${randomUUID()}`,
      patientId,
      channel: batch.channel,
      recordedAt: point.recordedAt,
      valueNumeric: point.value,
      unit: point.unit,
      valueMmolL: norm.valueMmolL,
      valueMmolMol: norm.valueMmolMol,
      context: point.context ?? null,
      qualityFlag: norm.qualityFlag,
      sourceSystem: batch.sourceSystem,
      sourceReference: point.sourceReference ?? null,
      verified: point.verified ?? false,
      synthetic: true as const,
      ingestedAt: now,
    };
  });

  if (usePg()) {
    const pool = getPgPool();
    for (const row of rows) {
      await pool.query(
        `INSERT INTO aksh.glucose_series_readings
          (id, scope_key, patient_id, channel, recorded_at, value_numeric, unit,
           value_mmol_l, value_mmol_mol, context, quality_flag, source_system,
           source_reference, verified, synthetic, ingested_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)`,
        [
          row.id,
          scopeKey,
          row.patientId,
          row.channel,
          row.recordedAt,
          row.valueNumeric,
          row.unit,
          row.valueMmolL,
          row.valueMmolMol,
          row.context,
          row.qualityFlag,
          row.sourceSystem,
          row.sourceReference,
          row.verified,
          row.ingestedAt,
        ]
      );
    }
    return rows;
  }

  const store = await readStore(scopeKey);
  store.readings.push(...rows);
  await writeStore(store, scopeKey);
  return rows;
}

export async function listGlucoseSeries(
  patientId: string,
  options?: { scopeKey?: string; channel?: GlucoseChannel }
): Promise<GlucoseSeriesReading[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const params: unknown[] = [scopeKey, patientId];
    let sql = `SELECT id, patient_id, channel, recorded_at, value_numeric, unit,
                      value_mmol_l, value_mmol_mol, context, quality_flag,
                      source_system, source_reference, verified, ingested_at
               FROM aksh.glucose_series_readings
               WHERE scope_key = $1 AND patient_id = $2`;
    if (options?.channel) {
      params.push(options.channel);
      sql += ` AND channel = $3`;
    }
    sql += ` ORDER BY recorded_at ASC`;
    const { rows } = await pool.query(sql, params);
    return rows.map(mapReadingRow);
  }
  const store = await readStore(scopeKey);
  return store.readings
    .filter(
      (r) =>
        r.patientId === patientId &&
        (!options?.channel || r.channel === options.channel)
    )
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export async function createGlucoseReview(
  input: {
    patientId: string;
    patientLabel: string;
    summarySections: GlucoseReviewSection[];
    calculationExplanations: string[];
    missingData: MissingDataIndicator[];
    qualityIndicators: MeasurementQualityIndicator[];
    worklistUrgency: number;
    createdBy: string;
  },
  options?: { scopeKey?: string }
): Promise<GlucoseIntelligenceReview> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();
  const review: GlucoseIntelligenceReview = {
    id: `gir-${randomUUID()}`,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    status: "DRAFT",
    summarySections: input.summarySections,
    calculationExplanations: input.calculationExplanations,
    missingData: input.missingData,
    qualityIndicators: input.qualityIndicators,
    worklistUrgency: input.worklistUrgency,
    createdBy: input.createdBy,
    createdAt: now,
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    version: 1,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.glucose_intelligence_reviews
        (id, scope_key, patient_id, patient_label, status, summary_sections,
         calculation_explanations, missing_data, quality_indicators, worklist_urgency,
         created_by, created_at, version, hitl_required, ehr_write, synthetic)
       VALUES ($1,$2,$3,$4,'DRAFT',$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,1,true,false,true)`,
      [
        review.id,
        scopeKey,
        review.patientId,
        review.patientLabel,
        JSON.stringify(review.summarySections),
        JSON.stringify(review.calculationExplanations),
        JSON.stringify(review.missingData),
        JSON.stringify(review.qualityIndicators),
        review.worklistUrgency,
        review.createdBy,
        review.createdAt,
      ]
    );
    return review;
  }

  const store = await readStore(scopeKey);
  store.reviews.push(review);
  await writeStore(store, scopeKey);
  return review;
}

export async function listGlucoseReviews(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<GlucoseIntelligenceReview[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT id, patient_id, patient_label, status, summary_sections,
              calculation_explanations, missing_data, quality_indicators,
              worklist_urgency, created_by, created_at, decided_by, decided_at,
              decision_reason, version
       FROM aksh.glucose_intelligence_reviews
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      patientLabel: r.patient_label,
      status: r.status,
      summarySections: r.summary_sections,
      calculationExplanations: r.calculation_explanations,
      missingData: r.missing_data,
      qualityIndicators: r.quality_indicators,
      worklistUrgency: r.worklist_urgency,
      createdBy: r.created_by,
      createdAt: new Date(r.created_at).toISOString(),
      decidedBy: r.decided_by,
      decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
      decisionReason: r.decision_reason,
      version: r.version,
      hitlRequired: true as const,
      ehrWrite: false as const,
      synthetic: true as const,
    }));
  }
  const store = await readStore(scopeKey);
  return store.reviews
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPendingGlucoseReviews(options?: {
  scopeKey?: string;
}): Promise<GlucoseIntelligenceReview[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT id, patient_id, patient_label, status, summary_sections,
              calculation_explanations, missing_data, quality_indicators,
              worklist_urgency, created_by, created_at, decided_by, decided_at,
              decision_reason, version
       FROM aksh.glucose_intelligence_reviews
       WHERE scope_key = $1 AND status = 'DRAFT'
       ORDER BY worklist_urgency ASC, created_at ASC`,
      [scopeKey]
    );
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      patientLabel: r.patient_label,
      status: r.status,
      summarySections: r.summary_sections,
      calculationExplanations: r.calculation_explanations,
      missingData: r.missing_data,
      qualityIndicators: r.quality_indicators,
      worklistUrgency: r.worklist_urgency,
      createdBy: r.created_by,
      createdAt: new Date(r.created_at).toISOString(),
      decidedBy: r.decided_by,
      decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
      decisionReason: r.decision_reason,
      version: r.version,
      hitlRequired: true as const,
      ehrWrite: false as const,
      synthetic: true as const,
    }));
  }
  const store = await readStore(scopeKey);
  return store.reviews
    .filter((r) => r.status === "DRAFT")
    .sort(
      (a, b) =>
        a.worklistUrgency - b.worklistUrgency ||
        a.createdAt.localeCompare(b.createdAt)
    );
}

export async function decideGlucoseReview(
  input: {
    patientId: string;
    reviewId: string;
    action: GlucoseReviewDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: GlucoseReviewSection[];
  },
  options?: { scopeKey?: string }
): Promise<GlucoseIntelligenceReview> {
  const scopeKey = options?.scopeKey ?? "shared";
  const now = new Date().toISOString();

  if (input.action === "reject" && !input.reason?.trim()) {
    throw Object.assign(new Error("reason required for reject"), { status: 400 });
  }
  if (input.action === "edit" && (!input.editedSections || !input.editedSections.length)) {
    throw Object.assign(new Error("editedSections required for edit"), { status: 400 });
  }

  const reviews = await listGlucoseReviews(input.patientId, { scopeKey });
  const review = reviews.find((r) => r.id === input.reviewId);
  if (!review) {
    throw Object.assign(new Error("review not found"), { status: 404 });
  }
  if (review.status !== "DRAFT") {
    throw Object.assign(new Error("review already decided"), { status: 409 });
  }

  const nextStatus =
    input.action === "accept" || input.action === "edit" ? "APPROVED" : "REJECTED";
  const updated: GlucoseIntelligenceReview = {
    ...review,
    status: nextStatus,
    summarySections:
      input.action === "edit" && input.editedSections
        ? input.editedSections
        : review.summarySections,
    decidedBy: input.actor,
    decidedAt: now,
    decisionReason: input.reason ?? null,
    version: review.version + 1,
    ehrWrite: false,
    hitlRequired: true,
    synthetic: true,
  };

  const decision: GlucoseReviewDecision = {
    id: `gird-${randomUUID()}`,
    reviewId: review.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    editedSections: input.editedSections ?? null,
    createdAt: now,
  };

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE aksh.glucose_intelligence_reviews
         SET status = $1, summary_sections = $2::jsonb, decided_by = $3,
             decided_at = $4, decision_reason = $5, version = $6, ehr_write = false
         WHERE id = $7 AND scope_key = $8 AND patient_id = $9`,
        [
          updated.status,
          JSON.stringify(updated.summarySections),
          updated.decidedBy,
          updated.decidedAt,
          updated.decisionReason,
          updated.version,
          review.id,
          scopeKey,
          input.patientId,
        ]
      );
      await client.query(
        `INSERT INTO aksh.glucose_intelligence_review_decisions
          (id, scope_key, review_id, action, actor, reason, edited_sections, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [
          decision.id,
          scopeKey,
          decision.reviewId,
          decision.action,
          decision.actor,
          decision.reason,
          JSON.stringify(decision.editedSections),
          decision.createdAt,
        ]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return updated;
  }

  const store = await readStore(scopeKey);
  const idx = store.reviews.findIndex((r) => r.id === review.id);
  if (idx >= 0) store.reviews[idx] = updated;
  store.decisions.push(decision);
  await writeStore(store, scopeKey);
  return updated;
}

export { randomUUID };
