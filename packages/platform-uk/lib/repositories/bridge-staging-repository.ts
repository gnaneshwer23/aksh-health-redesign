/**
 * BRIDGE FHIR staging persistence — Neon JSONB when configured, durable file otherwise.
 * Never claims live EMIS. Never requires Medplum OAuth.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { FHIR_STAGING_BUNDLES_SQL } from "../db/schema-sql";

export type BridgeStagingStatus = "preliminary" | "staging" | "superseded";

export type BridgeStagingRecord = {
  id: string;
  stagedAt: string;
  caseId: string | null;
  practiceId: string | null;
  scopeKey: string;
  acceptedBy: string;
  status: BridgeStagingStatus;
  syntheticOnly: true;
  liveEmis: false;
  medplumRequired: false;
  bundleSummary: string;
  bundle: Record<string, unknown>;
  note: string;
  storage: "neon" | "file";
};

export type BridgeStagingInput = {
  caseId?: string | null;
  practiceId?: string | null;
  scopeKey?: string;
  acceptedBy: string;
  status?: BridgeStagingStatus;
  bundleSummary: string;
  bundle: Record<string, unknown>;
  note?: string;
};

const BRIDGE_STAGING_NOTE =
  "BRIDGE in-app FHIR staging · preliminary/staging only · not live EMIS · Medplum not required · liveEmis:false";

const dataDir = path.join(process.cwd(), "data");
let schemaReady: Promise<void> | null = null;

export async function ensureBridgeStagingSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(FHIR_STAGING_BUNDLES_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "bridge-staging-bundles.json");
  }
  return path.join(dataDir, `bridge-staging-bundles.${safe}.json`);
}

async function readFileStore(scopeKey: string): Promise<BridgeStagingRecord[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { records?: BridgeStagingRecord[] };
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

async function writeFileStore(records: BridgeStagingRecord[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ records: records.slice(0, 200) }, null, 2), "utf8");
}

function toRecord(input: BridgeStagingInput, storage: "neon" | "file"): BridgeStagingRecord {
  return {
    id: `bridge-stage-${randomUUID()}`,
    stagedAt: new Date().toISOString(),
    caseId: input.caseId ?? null,
    practiceId: input.practiceId ?? null,
    scopeKey: input.scopeKey ?? "shared",
    acceptedBy: input.acceptedBy,
    status: input.status ?? "preliminary",
    syntheticOnly: true,
    liveEmis: false,
    medplumRequired: false,
    bundleSummary: input.bundleSummary,
    bundle: input.bundle,
    note: input.note ?? BRIDGE_STAGING_NOTE,
    storage
  };
}

async function persistNeon(record: BridgeStagingRecord): Promise<BridgeStagingRecord> {
  await ensureBridgeStagingSchema();
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO aksh.fhir_staging_bundles (
      id, staged_at, case_id, practice_id, scope_key, accepted_by, status,
      synthetic_only, live_emis, medplum_required, bundle_summary, bundle, note
    ) VALUES (
      $1, $2::timestamptz, $3, $4, $5, $6, $7,
      TRUE, FALSE, FALSE, $8, $9::jsonb, $10
    )`,
    [
      record.id,
      record.stagedAt,
      record.caseId,
      record.practiceId,
      record.scopeKey,
      record.acceptedBy,
      record.status,
      record.bundleSummary,
      JSON.stringify(record.bundle),
      record.note
    ]
  );
  return { ...record, storage: "neon" };
}

function mapNeonRow(row: {
  id: string;
  staged_at: Date | string;
  case_id: string | null;
  practice_id: string | null;
  scope_key: string;
  accepted_by: string;
  status: string;
  bundle_summary: string;
  bundle: Record<string, unknown> | string;
  note: string;
}): BridgeStagingRecord {
  const bundle =
    typeof row.bundle === "string"
      ? (JSON.parse(row.bundle) as Record<string, unknown>)
      : row.bundle;
  return {
    id: row.id,
    stagedAt: typeof row.staged_at === "string" ? row.staged_at : row.staged_at.toISOString(),
    caseId: row.case_id,
    practiceId: row.practice_id,
    scopeKey: row.scope_key,
    acceptedBy: row.accepted_by,
    status: row.status as BridgeStagingStatus,
    syntheticOnly: true,
    liveEmis: false,
    medplumRequired: false,
    bundleSummary: row.bundle_summary,
    bundle,
    note: row.note,
    storage: "neon"
  };
}

/** Persist Accept-staged FHIR Bundle. Neon preferred; durable file fallback. */
export async function persistBridgeStagingBundle(
  input: BridgeStagingInput
): Promise<BridgeStagingRecord> {
  const scopeKey = input.scopeKey ?? "shared";

  if (isPostgresConfigured()) {
    try {
      const record = toRecord(input, "neon");
      return await persistNeon(record);
    } catch (error) {
      console.error(
        "[bridge-staging] Neon persist failed; falling back to durable file",
        error
      );
    }
  }

  const record = toRecord(input, "file");
  const existing = await readFileStore(scopeKey);
  existing.unshift(record);
  await writeFileStore(existing, scopeKey);
  return record;
}

export async function listBridgeStagingBundles(options?: {
  limit?: number;
  scopeKey?: string;
  caseId?: string;
}): Promise<BridgeStagingRecord[]> {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const scopeKey = options?.scopeKey ?? "shared";
  const caseId = options?.caseId;

  if (isPostgresConfigured()) {
    try {
      await ensureBridgeStagingSchema();
      const pool = getPgPool();
      const result = caseId
        ? await pool.query(
            `SELECT id, staged_at, case_id, practice_id, scope_key, accepted_by, status,
                    bundle_summary, bundle, note
             FROM aksh.fhir_staging_bundles
             WHERE scope_key = $1 AND case_id = $2
             ORDER BY staged_at DESC
             LIMIT $3`,
            [scopeKey, caseId, limit]
          )
        : await pool.query(
            `SELECT id, staged_at, case_id, practice_id, scope_key, accepted_by, status,
                    bundle_summary, bundle, note
             FROM aksh.fhir_staging_bundles
             WHERE scope_key = $1
             ORDER BY staged_at DESC
             LIMIT $2`,
            [scopeKey, limit]
          );
      return result.rows.map(mapNeonRow);
    } catch (error) {
      console.error("[bridge-staging] Neon list failed; using file store", error);
    }
  }

  const records = await readFileStore(scopeKey);
  const filtered = caseId ? records.filter((r) => r.caseId === caseId) : records;
  return filtered.slice(0, limit).map((r) => ({ ...r, liveEmis: false as const, syntheticOnly: true as const, medplumRequired: false as const }));
}

export async function getBridgeStagingBundleById(
  id: string,
  scopeKey = "shared"
): Promise<BridgeStagingRecord | null> {
  if (isPostgresConfigured()) {
    try {
      await ensureBridgeStagingSchema();
      const pool = getPgPool();
      const result = await pool.query(
        `SELECT id, staged_at, case_id, practice_id, scope_key, accepted_by, status,
                bundle_summary, bundle, note
         FROM aksh.fhir_staging_bundles
         WHERE id = $1 AND scope_key = $2
         LIMIT 1`,
        [id, scopeKey]
      );
      if (result.rows[0]) return mapNeonRow(result.rows[0]);
    } catch (error) {
      console.error("[bridge-staging] Neon getById failed; using file store", error);
    }
  }

  const records = await readFileStore(scopeKey);
  return records.find((r) => r.id === id) ?? null;
}

export function getBridgeStagingHonesty() {
  return {
    adapterId: "bridge-fhir-neon-staging",
    liveEmis: false as const,
    medplumRequired: false as const,
    syntheticOnly: true as const,
    statusLabels: ["preliminary", "staging"] as const,
    note: BRIDGE_STAGING_NOTE,
    storagePreference: isPostgresConfigured() ? ("neon" as const) : ("file" as const)
  };
}
