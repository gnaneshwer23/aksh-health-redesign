/**
 * Milestone C3 — durable lab/pharmacy HITL draft store.
 * Milestone E1 — Postgres-preferred reads with storeMode honesty (D1 pattern).
 * File-scoped by tenant scopeKey for hermetic tests; dual-write when Neon configured.
 * SHIELD audit dual-write when Neon/Postgres is configured.
 * care_episode_id / organisationId preserved for isolation. liveEmis stays false.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  applyLabPharmacyReview,
  canReviewDraft,
  canStageDraft,
  filterQueue,
  stageLabPharmacyDraft,
  type LabPharmacyDraft,
  type LabPharmacyKind,
  type ReviewLabPharmacyDraftInput,
  type StageLabPharmacyDraftInput,
} from "@/lib/lab-pharmacy-hitl";
import type { AppRole } from "@/lib/permission-matrix";
import type { ClinicalPersona } from "@/lib/user-scope";
import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import { LAB_PHARMACY_HITL_SQL } from "@/lib/db/schema-sql";
import { persistShieldAuditEvent } from "./shield-audit-repository";

const STORE_KIND = "lab_pharmacy_hitl_v1" as const;
const dataDir = path.join(process.cwd(), "data");

/**
 * Where list APIs sourced lab/pharmacy HITL drafts.
 * - postgres: Neon list succeeded (shared-sandbox source of truth)
 * - file: Postgres not configured (hermetic)
 * - file_fallback: Postgres configured but list failed
 */
export type LabPharmacyHitlStoreMode = "postgres" | "file" | "file_fallback";

export type LabPharmacyHitlListResult = {
  drafts: LabPharmacyDraft[];
  storeMode: LabPharmacyHitlStoreMode;
  /** @deprecated Prefer storeMode — kept for C3 API compatibility. */
  source: LabPharmacyHitlStoreMode;
};

type DraftRow = {
  id: string;
  scope_key: string;
  draft: LabPharmacyDraft | string;
};

function resolveStoreFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "lab-pharmacy-hitl.json");
  }
  return path.join(dataDir, `lab-pharmacy-hitl.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<LabPharmacyDraft[]> {
  const file = resolveStoreFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { drafts?: LabPharmacyDraft[] };
    return Array.isArray(parsed.drafts) ? parsed.drafts : [];
  } catch {
    return [];
  }
}

async function writeStore(scopeKey: string, drafts: LabPharmacyDraft[]) {
  const file = resolveStoreFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ kind: STORE_KIND, drafts }, null, 2), "utf8");
}

let schemaReady: Promise<void> | null = null;

export async function ensureLabPharmacyHitlSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(LAB_PHARMACY_HITL_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

function parseDraft(raw: LabPharmacyDraft | string): LabPharmacyDraft | null {
  if (raw && typeof raw === "object" && "id" in raw) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as LabPharmacyDraft;
    } catch {
      return null;
    }
  }
  return null;
}

async function upsertPostgresDraft(draft: LabPharmacyDraft): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  try {
    await ensureLabPharmacyHitlSchema();
    await getPgPool().query(
      `INSERT INTO aksh.lab_pharmacy_hitl_drafts (
         id, scope_key, organisation_id, kind, status, synthetic_patient_id,
         care_episode_id, case_id, draft, staged_at, updated_at,
         synthetic, ehr_write, live
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::timestamptz,NOW(),
         TRUE,FALSE,FALSE
       )
       ON CONFLICT (id, scope_key) DO UPDATE SET
         organisation_id = EXCLUDED.organisation_id,
         kind = EXCLUDED.kind,
         status = EXCLUDED.status,
         synthetic_patient_id = EXCLUDED.synthetic_patient_id,
         care_episode_id = EXCLUDED.care_episode_id,
         case_id = EXCLUDED.case_id,
         draft = EXCLUDED.draft,
         updated_at = NOW()`,
      [
        draft.id,
        draft.scopeKey,
        draft.organisationId,
        draft.kind,
        draft.status,
        draft.syntheticPatientId,
        draft.careEpisodeId,
        draft.caseId,
        JSON.stringify(draft),
        draft.stagedAt,
      ]
    );
    return true;
  } catch (error) {
    console.warn("[lab-pharmacy-hitl] postgres upsert failed:", (error as Error).message);
    return false;
  }
}

async function listPostgresDrafts(
  scopeKey: string,
  limit: number
): Promise<LabPharmacyDraft[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureLabPharmacyHitlSchema();
    const result = await getPgPool().query<DraftRow>(
      `SELECT id, scope_key, draft
       FROM aksh.lab_pharmacy_hitl_drafts
       WHERE scope_key = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [scopeKey, limit]
    );
    return result.rows
      .map((row) => parseDraft(row.draft))
      .filter((d): d is LabPharmacyDraft => Boolean(d));
  } catch (error) {
    console.warn("[lab-pharmacy-hitl] listPostgresDrafts failed:", (error as Error).message);
    return null;
  }
}

async function getPostgresDraft(
  scopeKey: string,
  draftId: string
): Promise<LabPharmacyDraft | null | undefined> {
  if (!isPostgresConfigured()) return undefined;
  try {
    await ensureLabPharmacyHitlSchema();
    const result = await getPgPool().query<DraftRow>(
      `SELECT id, scope_key, draft
       FROM aksh.lab_pharmacy_hitl_drafts
       WHERE scope_key = $1 AND id = $2
       LIMIT 1`,
      [scopeKey, draftId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return parseDraft(row.draft);
  } catch (error) {
    console.warn("[lab-pharmacy-hitl] getPostgresDraft failed:", (error as Error).message);
    return undefined;
  }
}

export async function listLabPharmacyDrafts(options: {
  scopeKey: string;
  kind?: LabPharmacyKind;
  status?: LabPharmacyDraft["status"] | "open";
  organisationId?: string | null;
  limit?: number;
}): Promise<LabPharmacyHitlListResult> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const filterOpts = {
    kind: options.kind,
    status: options.status,
    organisationId: options.organisationId,
  };

  if (isPostgresConfigured()) {
    const pg = await listPostgresDrafts(options.scopeKey, Math.max(limit * 3, 100));
    if (pg) {
      const filtered = filterQueue(pg, filterOpts);
      return {
        drafts: filtered.slice(0, limit),
        storeMode: "postgres",
        source: "postgres",
      };
    }
    const all = await readStore(options.scopeKey);
    const filtered = filterQueue(all, filterOpts);
    return {
      drafts: filtered.slice(-limit).reverse(),
      storeMode: "file_fallback",
      source: "file_fallback",
    };
  }

  const all = await readStore(options.scopeKey);
  const filtered = filterQueue(all, filterOpts);
  return {
    drafts: filtered.slice(-limit).reverse(),
    storeMode: "file",
    source: "file",
  };
}

export async function stageAndPersistLabPharmacyDraft(
  input: StageLabPharmacyDraftInput,
  auth: { role: AppRole; persona: ClinicalPersona | null; practiceId?: string | null }
): Promise<{
  draft: LabPharmacyDraft;
  storeMode: LabPharmacyHitlStoreMode;
  source: LabPharmacyHitlStoreMode;
  shieldLogged: boolean;
}> {
  if (!canStageDraft(auth.role, auth.persona)) {
    throw new Error("Forbidden: role may not stage lab/pharmacy HITL drafts");
  }

  const draft = stageLabPharmacyDraft({
    ...input,
    organisationId: input.organisationId ?? auth.practiceId ?? null,
    roleHint: input.roleHint ?? auth.persona ?? auth.role,
  });

  const existing = await readStore(input.scopeKey);
  existing.push(draft);
  await writeStore(input.scopeKey, existing);
  const pgOk = await upsertPostgresDraft(draft);
  const storeMode: LabPharmacyHitlStoreMode = isPostgresConfigured()
    ? pgOk
      ? "postgres"
      : "file_fallback"
    : "file";

  const shield = await persistShieldAuditEvent({
    action: "stage",
    actor: draft.stagedBy,
    label: `LAB_PHARMACY_HITL: stage ${draft.kind} · ${draft.id}`,
    detail: [
      `kind=${draft.kind}`,
      `items=${draft.items.length}`,
      draft.careEpisodeId ? `careEpisodeId=${draft.careEpisodeId}` : null,
      "live:false",
      "ehrWrite:false",
      "syntheticOnly=true",
    ]
      .filter(Boolean)
      .join(" · "),
    category: "system",
    practiceId: draft.organisationId ?? undefined,
    caseId: draft.caseId ?? undefined,
    agentLabel: draft.kind === "lab" ? "PATHWAY" : "GUARDIAN",
    resourceRef: `lab-pharmacy-hitl:${draft.id}`,
    payload: {
      draftId: draft.id,
      kind: draft.kind,
      careEpisodeId: draft.careEpisodeId,
      syntheticPatientId: draft.syntheticPatientId,
      live: false,
      ehrWrite: false,
      clinicalValidationClaim: false,
    },
  });

  return { draft, storeMode, source: storeMode, shieldLogged: shield.persisted };
}

export async function reviewAndPersistLabPharmacyDraft(
  input: ReviewLabPharmacyDraftInput & { scopeKey: string },
  auth: { role: AppRole; persona: ClinicalPersona | null; practiceId?: string | null }
): Promise<{
  draft: LabPharmacyDraft;
  storeMode: LabPharmacyHitlStoreMode;
  source: LabPharmacyHitlStoreMode;
  shieldLogged: boolean;
}> {
  const existing = await readStore(input.scopeKey);
  let idx = existing.findIndex((d) => d.id === input.draftId);
  if (idx < 0) {
    const pg = await getPostgresDraft(input.scopeKey, input.draftId);
    if (pg) {
      existing.push(pg);
      idx = existing.length - 1;
    }
  }
  if (idx < 0) throw new Error(`Unknown draftId "${input.draftId}"`);

  const current = existing[idx]!;
  if (auth.practiceId && current.organisationId && current.organisationId !== auth.practiceId) {
    throw new Error("Forbidden: organisation boundary");
  }
  if (!canReviewDraft(current.kind, auth.role, auth.persona)) {
    throw new Error(`Forbidden: role may not review ${current.kind} drafts`);
  }

  const next = applyLabPharmacyReview(current, {
    decision: input.decision,
    actor: input.actor,
    roleHint: input.roleHint ?? auth.persona ?? auth.role,
    note: input.note,
    editedContent: input.editedContent,
  });

  existing[idx] = next;
  await writeStore(input.scopeKey, existing);
  const pgOk = await upsertPostgresDraft(next);
  const storeMode: LabPharmacyHitlStoreMode = isPostgresConfigured()
    ? pgOk
      ? "postgres"
      : "file_fallback"
    : "file";

  const shield = await persistShieldAuditEvent({
    action: input.decision,
    actor: input.actor,
    label: `LAB_PHARMACY_HITL: ${input.decision} ${next.kind} · ${next.id}`,
    detail: [
      `status=${next.status}`,
      next.careEpisodeId ? `careEpisodeId=${next.careEpisodeId}` : null,
      next.reviewNote ? `note=${next.reviewNote}` : null,
      "live:false",
      "ehrWrite:false",
    ]
      .filter(Boolean)
      .join(" · "),
    category: "reviewer_decision",
    practiceId: next.organisationId ?? undefined,
    caseId: next.caseId ?? undefined,
    agentLabel: next.kind === "lab" ? "PATHWAY" : "GUARDIAN",
    resourceRef: `lab-pharmacy-hitl:${next.id}`,
    payload: {
      draftId: next.id,
      kind: next.kind,
      decision: input.decision,
      careEpisodeId: next.careEpisodeId,
      live: false,
      ehrWrite: false,
      clinicalValidationClaim: false,
    },
  });

  return { draft: next, storeMode, source: storeMode, shieldLogged: shield.persisted };
}

export async function resetLabPharmacyHitlStoreForTests(scopeKey = "shared"): Promise<void> {
  await writeStore(scopeKey, []);
}
