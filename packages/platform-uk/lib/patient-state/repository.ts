import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { PATIENT_STATE_FACTS_SQL } from "../db/schema-sql";
import { buildPatientStateSnapshot } from "./projection";
import type { PatientStateFact, PatientStateFactInput, PatientStateSnapshot } from "./types";

/**
 * Patient State foundation repository (C1 — docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1).
 *
 * Postgres-preferred with a controlled file fallback, mirroring the existing
 * dual-path pattern in lib/repositories/learning-event-repository.ts — never
 * a hard dependency on a live DB. Append-only: `recordPatientStateFact`
 * always INSERTs; `supersedePatientStateFact` only ever sets a foreign-key
 * pointer on the prior row, it never mutates that row's `value`.
 */

const dataDir = path.join(process.cwd(), "data");

function resolvePatientStateFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(dataDir, safe === "shared" ? "patient-state-facts.json" : `patient-state-facts.${safe}.json`);
}

let schemaReady: Promise<void> | null = null;

export async function ensurePatientStateSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(PATIENT_STATE_FACTS_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

async function readFileStore(scopeKey: string): Promise<PatientStateFact[]> {
  const file = resolvePatientStateFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { facts?: PatientStateFact[] };
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch {
    return [];
  }
}

async function writeFileStore(facts: PatientStateFact[], scopeKey: string) {
  const file = resolvePatientStateFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ facts }, null, 2), "utf8");
}

async function insertPostgres(fact: PatientStateFact): Promise<boolean> {
  try {
    await ensurePatientStateSchema();
    await getPgPool().query(
      `INSERT INTO aksh.patient_state_facts (
        id, patient_id, fact_type, value, source_system, source_reference,
        confidence, consent_scope_id, effective_at, recorded_at, superseded_by
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11)`,
      [
        fact.id,
        fact.patientId,
        fact.factType,
        JSON.stringify(fact.value),
        fact.source.system,
        fact.source.reference ?? null,
        fact.confidence,
        fact.consentScopeId,
        fact.effectiveAt,
        fact.recordedAt,
        fact.supersededBy
      ]
    );
    return true;
  } catch (error) {
    console.error("[patient-state] postgres insert failed", error);
    return false;
  }
}

async function markSupersededPostgres(factId: string, supersededBy: string): Promise<boolean> {
  try {
    await ensurePatientStateSchema();
    await getPgPool().query(
      `UPDATE aksh.patient_state_facts SET superseded_by = $2 WHERE id = $1 AND superseded_by IS NULL`,
      [factId, supersededBy]
    );
    return true;
  } catch (error) {
    console.error("[patient-state] postgres supersede-mark failed", error);
    return false;
  }
}

function rowToFact(row: {
  id: string;
  patient_id: string;
  fact_type: string;
  value: unknown;
  source_system: string;
  source_reference: string | null;
  confidence: number;
  consent_scope_id: string | null;
  effective_at: Date;
  recorded_at: Date;
  superseded_by: string | null;
}): PatientStateFact {
  return {
    id: row.id,
    patientId: row.patient_id,
    factType: row.fact_type,
    value: row.value,
    source: { system: row.source_system, reference: row.source_reference ?? undefined },
    confidence: row.confidence,
    consentScopeId: row.consent_scope_id,
    effectiveAt: row.effective_at.toISOString(),
    recordedAt: row.recorded_at.toISOString(),
    supersededBy: row.superseded_by
  };
}

async function listPostgres(patientId: string): Promise<PatientStateFact[] | null> {
  try {
    await ensurePatientStateSchema();
    const result = await getPgPool().query(
      `SELECT id, patient_id, fact_type, value, source_system, source_reference,
              confidence, consent_scope_id, effective_at, recorded_at, superseded_by
       FROM aksh.patient_state_facts
       WHERE patient_id = $1
       ORDER BY recorded_at ASC, id ASC`,
      [patientId]
    );
    return result.rows.map(rowToFact);
  } catch (error) {
    console.error("[patient-state] postgres list failed", error);
    return null;
  }
}

/**
 * Append one new fact. If `input.factType` already has a current
 * (non-superseded) fact for this patient, that prior fact is marked
 * superseded (never mutated in place — only its `supersededBy` pointer is
 * set) as part of the same logical write. Append-only: the prior fact row
 * always remains readable via `listPatientStateFacts`.
 */
export async function recordPatientStateFact(
  input: PatientStateFactInput,
  options?: { scopeKey?: string }
): Promise<{ fact: PatientStateFact; source: "postgres" | "file" }> {
  const now = new Date().toISOString();
  const fact: PatientStateFact = {
    id: `pstate-${randomUUID()}`,
    patientId: input.patientId,
    factType: input.factType,
    value: input.value,
    source: input.source,
    confidence: input.confidence ?? 1,
    consentScopeId: input.consentScopeId ?? null,
    effectiveAt: input.effectiveAt ?? now,
    recordedAt: now,
    supersededBy: null
  };

  let source: "postgres" | "file" = "file";

  if (isPostgresConfigured()) {
    const ok = await insertPostgres(fact);
    if (ok) {
      source = "postgres";
      const existing = await listPostgres(input.patientId);
      const priorCurrent = (existing ?? [])
        .filter((f) => f.factType === fact.factType && f.id !== fact.id && f.supersededBy === null)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
      if (priorCurrent) {
        await markSupersededPostgres(priorCurrent.id, fact.id);
      }
      return { fact, source };
    }
  }

  const scopeKey = options?.scopeKey ?? "shared";
  const facts = await readFileStore(scopeKey);
  const priorCurrentIndex = [...facts]
    .map((f, index) => ({ f, index }))
    .filter(({ f }) => f.patientId === fact.patientId && f.factType === fact.factType && f.supersededBy === null)
    .sort((a, b) => new Date(b.f.recordedAt).getTime() - new Date(a.f.recordedAt).getTime())[0];
  if (priorCurrentIndex) {
    facts[priorCurrentIndex.index] = { ...priorCurrentIndex.f, supersededBy: fact.id };
  }
  facts.push(fact);
  await writeFileStore(facts, scopeKey);

  return { fact, source: "file" };
}

export async function listPatientStateFacts(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<{ source: "postgres" | "file"; facts: PatientStateFact[] }> {
  if (isPostgresConfigured()) {
    const rows = await listPostgres(patientId);
    if (rows) {
      return { source: "postgres", facts: rows };
    }
  }

  const facts = await readFileStore(options?.scopeKey ?? "shared");
  return {
    source: "file",
    facts: facts.filter((fact) => fact.patientId === patientId)
  };
}

export async function getPatientStateSnapshot(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<PatientStateSnapshot> {
  const { facts } = await listPatientStateFacts(patientId, options);
  return buildPatientStateSnapshot(patientId, facts);
}
