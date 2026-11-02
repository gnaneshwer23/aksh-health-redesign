/**
 * Milestone A2 — durable CONDUCTOR / clinical-spine execution metadata.
 * Milestone D1 — Postgres-preferred ops reads when DATABASE_URL set; file is
 * hermetic / fallback. Claim/finalize still mirrors to file for local debug.
 *
 * Extends existing `aksh.agent_intel_runs` (migration 048 + 053). Not a second
 * orchestrator — stores A1 execution bundles for idempotent recovery.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { AGENT_INTEL_RUNS_SQL } from "../db/schema-sql";
import type { AgentRunBundleMetadata, AgentRunStatus } from "./execution-metadata";

export type DurableAgentRunSource =
  | "clinical_spine"
  | "clinical_proof"
  | "diabetes_agent_intel";

export type DurableAgentRunStatus =
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "blocked"
  | "timed_out";

/**
 * Milestone D1 — where Agent Ops / list APIs sourced durable runs.
 * - postgres: Neon list succeeded (shared-sandbox source of truth)
 * - file: Postgres not configured (hermetic)
 * - file_fallback: Postgres configured but list failed
 */
export type DurableRunStoreMode = "postgres" | "file" | "file_fallback";

export type DurableAgentRunListResult = {
  runs: DurableAgentRunRecord[];
  storeMode: DurableRunStoreMode;
};

export type DurableAgentRunRecord = {
  id: string;
  scopeKey: string;
  organisationId: string | null;
  patientId: string;
  patientLabel: string;
  status: DurableAgentRunStatus;
  source: DurableAgentRunSource;
  correlationId: string;
  careEpisodeId: string | null;
  idempotencyKey: string | null;
  guardianOutcome: string | null;
  reviewStatus: string | null;
  draftEnqueueAllowed: boolean;
  shieldAuditPersisted: boolean;
  agentsInvoked: string[];
  execution: AgentRunBundleMetadata;
  /** Full spine/orchestration result for idempotent recovery (JSON-safe). */
  resultSnapshot: Record<string, unknown> | null;
  modelId: string;
  modelVersion: string;
  promptId: string;
  promptVersion: string;
  draftingMode: "deterministic_synthetic" | "llm_gated";
  startedAt: string;
  completedAt: string | null;
  llmUsed: boolean;
  synthetic: true;
  ehrWrite: false;
  note: string;
};

type AgentIntelRunRow = {
  id: string;
  scope_key: string;
  organisation_id: string | null;
  patient_id: string;
  patient_label: string;
  status: DurableAgentRunStatus;
  source: DurableAgentRunSource;
  correlation_id: string | null;
  care_episode_id: string | null;
  idempotency_key: string | null;
  guardian_outcome: string | null;
  review_status: string | null;
  draft_enqueue_allowed: boolean;
  shield_audit_persisted: boolean;
  agents_invoked: unknown;
  execution_metadata: AgentRunBundleMetadata | null;
  result_snapshot: Record<string, unknown> | null;
  model_id: string;
  model_version: string;
  prompt_id: string;
  prompt_version: string;
  drafting_mode: "deterministic_synthetic" | "llm_gated";
  started_at: Date;
  completed_at: Date | null;
  llm_used: boolean;
  note: string | null;
};

const AGENT_INTEL_RUN_SELECT = `id, scope_key, organisation_id, patient_id, patient_label, status, source,
              correlation_id, care_episode_id, idempotency_key, guardian_outcome, review_status,
              draft_enqueue_allowed, shield_audit_persisted, agents_invoked, execution_metadata,
              result_snapshot, model_id, model_version, prompt_id, prompt_version, drafting_mode,
              started_at, completed_at, llm_used, note`;

function mapPgRowToRecord(row: AgentIntelRunRow): DurableAgentRunRecord {
  return {
    id: row.id,
    scopeKey: row.scope_key,
    organisationId: row.organisation_id,
    patientId: row.patient_id,
    patientLabel: row.patient_label,
    status: row.status,
    source: row.source ?? "clinical_spine",
    correlationId: row.correlation_id ?? "",
    careEpisodeId: row.care_episode_id,
    idempotencyKey: row.idempotency_key,
    guardianOutcome: row.guardian_outcome,
    reviewStatus: row.review_status,
    draftEnqueueAllowed: row.draft_enqueue_allowed,
    shieldAuditPersisted: row.shield_audit_persisted,
    agentsInvoked: Array.isArray(row.agents_invoked) ? (row.agents_invoked as string[]) : [],
    execution: (row.execution_metadata ?? {}) as AgentRunBundleMetadata,
    resultSnapshot: row.result_snapshot,
    modelId: row.model_id,
    modelVersion: row.model_version,
    promptId: row.prompt_id,
    promptVersion: row.prompt_version,
    draftingMode: row.drafting_mode,
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at?.toISOString() ?? null,
    llmUsed: row.llm_used,
    synthetic: true,
    ehrWrite: false,
    note: row.note ?? "",
  };
}

type Store = { runs: DurableAgentRunRecord[] };

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "conductor-execution-runs.json" : `conductor-execution-runs.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { runs: Array.isArray(parsed.runs) ? parsed.runs : [] };
  } catch {
    return { runs: [] };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

let schemaReady: Promise<void> | null = null;

export async function ensureAgentIntelRunsSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(AGENT_INTEL_RUNS_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

export function toDurableRunStatus(status: AgentRunStatus | DurableAgentRunStatus): DurableAgentRunStatus {
  if (status === "pending" || status === "running") return status === "pending" ? "running" : "running";
  if (status === "skipped") return "partial";
  if (
    status === "completed" ||
    status === "partial" ||
    status === "failed" ||
    status === "blocked" ||
    status === "timed_out"
  ) {
    return status;
  }
  return "failed";
}

function isTerminal(status: DurableAgentRunStatus): boolean {
  return status !== "running";
}

async function findInPostgres(scopeKey: string, idempotencyKey: string): Promise<DurableAgentRunRecord | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureAgentIntelRunsSchema();
    const result = await getPgPool().query<AgentIntelRunRow>(
      `SELECT ${AGENT_INTEL_RUN_SELECT}
       FROM aksh.agent_intel_runs
       WHERE scope_key = $1 AND idempotency_key = $2
       LIMIT 1`,
      [scopeKey, idempotencyKey]
    );
    const row = result.rows[0];
    if (!row) return null;
    return mapPgRowToRecord(row);
  } catch (error) {
    console.error("[execution-run-store] findInPostgres failed", error);
    return null;
  }
}

/** Milestone D1 — list from Neon; null means query failed (caller may file-fallback). */
async function listPostgresForScope(
  scopeKey: string,
  limit: number
): Promise<DurableAgentRunRecord[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureAgentIntelRunsSchema();
    const result = await getPgPool().query<AgentIntelRunRow>(
      `SELECT ${AGENT_INTEL_RUN_SELECT}
       FROM aksh.agent_intel_runs
       WHERE scope_key = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [scopeKey, limit]
    );
    return result.rows.map(mapPgRowToRecord);
  } catch (error) {
    console.error("[execution-run-store] listPostgresForScope failed", error);
    return null;
  }
}

async function listPostgresForPatient(
  scopeKey: string,
  patientId: string,
  limit: number
): Promise<DurableAgentRunRecord[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureAgentIntelRunsSchema();
    const result = await getPgPool().query<AgentIntelRunRow>(
      `SELECT ${AGENT_INTEL_RUN_SELECT}
       FROM aksh.agent_intel_runs
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY started_at DESC
       LIMIT $3`,
      [scopeKey, patientId, limit]
    );
    return result.rows.map(mapPgRowToRecord);
  } catch (error) {
    console.error("[execution-run-store] listPostgresForPatient failed", error);
    return null;
  }
}

function sortRunsByStartedDesc(runs: DurableAgentRunRecord[]): DurableAgentRunRecord[] {
  return [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

async function upsertPostgres(record: DurableAgentRunRecord): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  try {
    await ensureAgentIntelRunsSchema();
    await getPgPool().query(
      `INSERT INTO aksh.agent_intel_runs (
         id, scope_key, organisation_id, patient_id, patient_label, status, agents_invoked,
         draft_ids, shared_context_built_at, model_id, model_version, prompt_id, prompt_version,
         drafting_mode, started_at, completed_at, llm_used, synthetic, ehr_write, note,
         correlation_id, care_episode_id, idempotency_key, source, guardian_outcome, review_status,
         draft_enqueue_allowed, shield_audit_persisted, execution_metadata, result_snapshot
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7::jsonb,'[]'::jsonb,$8::timestamptz,$9,$10,$11,$12,$13,
         $14::timestamptz,$15::timestamptz,$16,TRUE,FALSE,$17,
         $18,$19,$20,$21,$22,$23,$24,$25,$26::jsonb,$27::jsonb
       )
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         agents_invoked = EXCLUDED.agents_invoked,
         completed_at = EXCLUDED.completed_at,
         note = EXCLUDED.note,
         guardian_outcome = EXCLUDED.guardian_outcome,
         review_status = EXCLUDED.review_status,
         draft_enqueue_allowed = EXCLUDED.draft_enqueue_allowed,
         shield_audit_persisted = EXCLUDED.shield_audit_persisted,
         execution_metadata = EXCLUDED.execution_metadata,
         result_snapshot = EXCLUDED.result_snapshot`,
      [
        record.id,
        record.scopeKey,
        record.organisationId,
        record.patientId,
        record.patientLabel,
        record.status,
        JSON.stringify(record.agentsInvoked),
        record.startedAt,
        record.modelId,
        record.modelVersion,
        record.promptId,
        record.promptVersion,
        record.draftingMode,
        record.startedAt,
        record.completedAt,
        record.llmUsed,
        record.note,
        record.correlationId,
        record.careEpisodeId,
        record.idempotencyKey,
        record.source,
        record.guardianOutcome,
        record.reviewStatus,
        record.draftEnqueueAllowed,
        record.shieldAuditPersisted,
        JSON.stringify(record.execution),
        record.resultSnapshot ? JSON.stringify(record.resultSnapshot) : null,
      ]
    );
    return true;
  } catch (error) {
    console.error("[execution-run-store] upsertPostgres failed", error);
    return false;
  }
}

export async function findDurableAgentRunByIdempotencyKey(
  idempotencyKey: string,
  scopeKey = "shared"
): Promise<DurableAgentRunRecord | null> {
  const key = idempotencyKey.trim();
  if (!key) return null;

  const pg = await findInPostgres(scopeKey, key);
  if (pg) return pg;

  const store = await readStore(scopeKey);
  return store.runs.find((r) => r.idempotencyKey === key) ?? null;
}

export async function listDurableAgentRunsForPatient(
  patientId: string,
  scopeKey = "shared"
): Promise<DurableAgentRunRecord[]> {
  const { runs } = await listDurableAgentRunsForPatientWithMode(patientId, scopeKey);
  return runs;
}

/** Milestone D1 — patient list with storeMode (Postgres-preferred when configured). */
export async function listDurableAgentRunsForPatientWithMode(
  patientId: string,
  scopeKey = "shared",
  limit = 50
): Promise<DurableAgentRunListResult> {
  const capped = Math.min(Math.max(limit, 1), 200);
  if (isPostgresConfigured()) {
    const pg = await listPostgresForPatient(scopeKey, patientId, capped);
    if (pg) {
      return { runs: sortRunsByStartedDesc(pg).slice(0, capped), storeMode: "postgres" };
    }
    const store = await readStore(scopeKey);
    const fileRuns = store.runs.filter((r) => r.patientId === patientId);
    return {
      runs: sortRunsByStartedDesc(fileRuns).slice(0, capped),
      storeMode: "file_fallback",
    };
  }
  const store = await readStore(scopeKey);
  const fileRuns = store.runs.filter((r) => r.patientId === patientId);
  return { runs: sortRunsByStartedDesc(fileRuns).slice(0, capped), storeMode: "file" };
}

/**
 * A3 — list recent durable runs for a tenant scope (Agent Ops / GP visibility).
 * Milestone D1 — prefers Neon when configured; file is hermetic / fallback only.
 */
export async function listDurableAgentRunsForScope(
  scopeKey = "shared",
  limit = 50
): Promise<DurableAgentRunRecord[]> {
  const { runs } = await listDurableAgentRunsForScopeWithMode(scopeKey, limit);
  return runs;
}

/** Milestone D1 — scope list with honest storeMode for Agent Ops / alerts. */
export async function listDurableAgentRunsForScopeWithMode(
  scopeKey = "shared",
  limit = 50
): Promise<DurableAgentRunListResult> {
  const capped = Math.min(Math.max(limit, 1), 200);
  if (isPostgresConfigured()) {
    const pg = await listPostgresForScope(scopeKey, capped);
    if (pg) {
      return { runs: sortRunsByStartedDesc(pg).slice(0, capped), storeMode: "postgres" };
    }
    const store = await readStore(scopeKey);
    return {
      runs: sortRunsByStartedDesc(store.runs).slice(0, capped),
      storeMode: "file_fallback",
    };
  }
  const store = await readStore(scopeKey);
  return { runs: sortRunsByStartedDesc(store.runs).slice(0, capped), storeMode: "file" };
}

/**
 * Claim an idempotency key (insert running) or return the terminal prior run for recovery.
 * Process-local duplicate guard remains in execution-metadata; this is multi-instance durable.
 *
 * - Terminal with/without snapshot → recovered (idempotent replay).
 * - In-flight `running` without snapshot → reclaim same row (crash recovery).
 */
export async function claimOrRecoverDurableAgentRun(input: {
  scopeKey?: string;
  patientId: string;
  patientLabel: string;
  correlationId: string;
  careEpisodeId?: string | null;
  idempotencyKey: string;
  source?: DurableAgentRunSource;
  organisationId?: string | null;
}): Promise<
  | { outcome: "claimed"; record: DurableAgentRunRecord }
  | { outcome: "recovered"; record: DurableAgentRunRecord }
> {
  const scopeKey = input.scopeKey ?? "shared";
  const key = input.idempotencyKey.trim();
  const existing = await findDurableAgentRunByIdempotencyKey(key, scopeKey);
  if (existing && isTerminal(existing.status)) {
    return { outcome: "recovered", record: existing };
  }
  if (existing && existing.status === "running" && existing.resultSnapshot) {
    // Unusual: running with snapshot — treat as recovered to avoid double-finalise races.
    return { outcome: "recovered", record: existing };
  }
  if (existing && existing.status === "running") {
    // Stale in-flight claim after crash — reclaim same id and continue execution.
    return { outcome: "claimed", record: existing };
  }

  const startedAt = new Date().toISOString();
  const record: DurableAgentRunRecord = {
    id: `airun-orch-${randomUUID()}`,
    scopeKey,
    organisationId: input.organisationId ?? null,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    status: "running",
    source: input.source ?? "clinical_spine",
    correlationId: input.correlationId,
    careEpisodeId: input.careEpisodeId ?? null,
    idempotencyKey: key,
    guardianOutcome: null,
    reviewStatus: null,
    draftEnqueueAllowed: false,
    shieldAuditPersisted: false,
    agentsInvoked: ["CONDUCTOR"],
    execution: {
      schemaVersion: "agent-execution-metadata-v1",
      correlationId: input.correlationId,
      careEpisodeId: input.careEpisodeId ?? null,
      scopeKey,
      startedAt,
      completedAt: null,
      durationMs: null,
      status: "running",
      guardianOutcome: null,
      reviewStatus: "pending_hitl",
      agents: [],
      evidenceRefs: [],
      errorCode: null,
      errorMessage: null,
      ehrWrite: false,
      hitlRequired: true,
    },
    resultSnapshot: null,
    modelId: "none",
    modelVersion: "n/a",
    promptId: "conductor-orchestrate",
    promptVersion: "2026-10-30.1",
    draftingMode: "deterministic_synthetic",
    startedAt,
    completedAt: null,
    llmUsed: false,
    synthetic: true,
    ehrWrite: false,
    note: "CONDUCTOR orchestration claimed (A2 durable run)",
  };

  const store = await readStore(scopeKey);
  store.runs.unshift(record);
  await writeStore(store, scopeKey);
  await upsertPostgres(record);
  return { outcome: "claimed", record };
}

export async function finalizeDurableAgentRun(
  input: Omit<DurableAgentRunRecord, "synthetic" | "ehrWrite"> & {
    synthetic?: true;
    ehrWrite?: false;
  }
): Promise<{ record: DurableAgentRunRecord; persistedPostgres: boolean }> {
  const record: DurableAgentRunRecord = {
    ...input,
    synthetic: true,
    ehrWrite: false,
  };
  const store = await readStore(record.scopeKey);
  const idx = store.runs.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    store.runs[idx] = record;
  } else {
    store.runs.unshift(record);
  }
  // Also replace by idempotency key to avoid duplicates after claim.
  if (record.idempotencyKey) {
    store.runs = store.runs.filter(
      (r, i) => r.idempotencyKey !== record.idempotencyKey || (idx >= 0 ? i === idx : r.id === record.id)
    );
    if (!store.runs.some((r) => r.id === record.id)) {
      store.runs.unshift(record);
    }
  }
  await writeStore(store, record.scopeKey);
  const persistedPostgres = await upsertPostgres(record);
  return { record, persistedPostgres };
}

export async function resetDurableAgentRunStoreForTests(scopeKey = "shared"): Promise<void> {
  await writeStore({ runs: [] }, scopeKey);
}
