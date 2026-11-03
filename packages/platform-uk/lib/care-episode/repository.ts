/**
 * Care Episode persistence — dual-write file + Postgres when configured.
 * Milestone E1 — Postgres-preferred reads with storeMode honesty (D1 pattern).
 * Apply migration 052 on local-dev / simulation Neon only.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { CARE_EPISODES_SQL } from "../db/schema-sql";
import type {
  CareEpisode,
  CareEpisodeEvent,
  CareEpisodeLink,
  CareEpisodeStatus,
  CareEpisodeTask,
  CreateCareEpisodeInput,
  TransitionCareEpisodeInput,
} from "./types";
import { validateCareEpisodeTransition } from "./transitions";

/**
 * Where list/get APIs sourced care episodes (shared Neon honesty).
 * - postgres: Neon list/get succeeded
 * - file: Postgres not configured (hermetic)
 * - file_fallback: Postgres configured but query failed
 */
export type CareEpisodeStoreMode = "postgres" | "file" | "file_fallback";

export type CareEpisodeListResult = {
  episodes: CareEpisode[];
  storeMode: CareEpisodeStoreMode;
};

export type CareEpisodeGetResult = {
  episode: CareEpisode | null;
  storeMode: CareEpisodeStoreMode;
};

type Store = {
  episodes: CareEpisode[];
  events: CareEpisodeEvent[];
};

type CareEpisodeRow = {
  id: string;
  public_id: string;
  scope_key: string;
  organisation_id: string | null;
  practice_id: string | null;
  patient_id: string;
  patient_label: string | null;
  status: CareEpisodeStatus;
  pathway: string | null;
  links: unknown;
  tasks: unknown;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
  created_by: string;
  version: number;
  idempotency_key: string | null;
  metadata: unknown;
};

type CareEpisodeEventRow = {
  id: string;
  episode_id: string;
  scope_key: string;
  kind: CareEpisodeEvent["kind"];
  at: Date;
  actor: string;
  from_status: CareEpisodeStatus | null;
  to_status: CareEpisodeStatus | null;
  detail: string | null;
  payload: unknown;
  idempotency_key: string | null;
  processed: boolean;
};

const CARE_EPISODE_SELECT = `id, public_id, scope_key, organisation_id, practice_id, patient_id,
  patient_label, status, pathway, links, tasks, created_at, updated_at, closed_at,
  created_by, version, idempotency_key, metadata`;

function asJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapPgEpisode(row: CareEpisodeRow): CareEpisode {
  return {
    id: row.id,
    publicId: row.public_id,
    scopeKey: row.scope_key,
    organisationId: row.organisation_id ?? undefined,
    practiceId: row.practice_id ?? undefined,
    patientId: row.patient_id,
    patientLabel: row.patient_label ?? undefined,
    status: row.status,
    pathway: row.pathway ?? undefined,
    links: asJsonArray<CareEpisodeLink>(row.links),
    tasks: asJsonArray<CareEpisodeTask>(row.tasks),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    closedAt: row.closed_at ? row.closed_at.toISOString() : undefined,
    createdBy: row.created_by,
    version: row.version,
    synthetic: true,
    ehrWrite: false,
    idempotencyKey: row.idempotency_key ?? undefined,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : undefined,
  };
}

function mapPgEvent(row: CareEpisodeEventRow): CareEpisodeEvent {
  return {
    id: row.id,
    episodeId: row.episode_id,
    kind: row.kind,
    at: row.at.toISOString(),
    actor: row.actor,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status ?? undefined,
    detail: row.detail ?? undefined,
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : undefined,
    idempotencyKey: row.idempotency_key ?? undefined,
    processed: row.processed,
  };
}

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(dataDir, safe === "shared" ? "care-episodes.json" : `care-episodes.${safe}.json`);
}

function nowIso() {
  return new Date().toISOString();
}

function publicIdFrom(id: string): string {
  const short = id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  const year = new Date().getUTCFullYear();
  return `CE-${year}-${short}`;
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      episodes: Array.isArray(parsed.episodes) ? parsed.episodes : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { episodes: [], events: [] };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

let schemaReady: Promise<void> | null = null;

export async function ensureCareEpisodesSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(CARE_EPISODES_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

function makeEvent(
  episodeId: string,
  kind: CareEpisodeEvent["kind"],
  actor: string,
  extras?: Partial<CareEpisodeEvent>
): CareEpisodeEvent {
  return {
    id: `cee-${randomUUID()}`,
    episodeId,
    kind,
    at: nowIso(),
    actor,
    processed: false,
    ...extras,
  };
}

async function persistPostgresEpisode(episode: CareEpisode, event: CareEpisodeEvent): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  try {
    await ensureCareEpisodesSchema();
    const client = await getPgPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO aksh.care_episodes (
          id, public_id, scope_key, organisation_id, practice_id, patient_id, patient_label,
          status, pathway, links, tasks, created_at, updated_at, closed_at, created_by,
          version, synthetic, ehr_write, idempotency_key, metadata
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10::jsonb,$11::jsonb,$12::timestamptz,$13::timestamptz,$14::timestamptz,$15,
          $16,TRUE,FALSE,$17,$18::jsonb
        )
        ON CONFLICT (id, scope_key) DO UPDATE SET
          status = EXCLUDED.status,
          pathway = EXCLUDED.pathway,
          links = EXCLUDED.links,
          tasks = EXCLUDED.tasks,
          updated_at = EXCLUDED.updated_at,
          closed_at = EXCLUDED.closed_at,
          version = EXCLUDED.version,
          metadata = EXCLUDED.metadata`,
        [
          episode.id,
          episode.publicId,
          episode.scopeKey,
          episode.organisationId ?? null,
          episode.practiceId ?? null,
          episode.patientId,
          episode.patientLabel ?? null,
          episode.status,
          episode.pathway ?? null,
          JSON.stringify(episode.links),
          JSON.stringify(episode.tasks),
          episode.createdAt,
          episode.updatedAt,
          episode.closedAt ?? null,
          episode.createdBy,
          episode.version,
          episode.idempotencyKey ?? null,
          JSON.stringify(episode.metadata ?? {}),
        ]
      );
      await client.query(
        `INSERT INTO aksh.care_episode_events (
          id, episode_id, scope_key, kind, at, actor, from_status, to_status,
          detail, payload, idempotency_key, processed, synthetic
        ) VALUES (
          $1,$2,$3,$4,$5::timestamptz,$6,$7,$8,
          $9,$10::jsonb,$11,FALSE,TRUE
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          event.episodeId,
          episode.scopeKey,
          event.kind,
          event.at,
          event.actor,
          event.fromStatus ?? null,
          event.toStatus ?? null,
          event.detail ?? null,
          JSON.stringify(event.payload ?? {}),
          event.idempotencyKey ?? null,
        ]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn("[care-episode] postgres persist failed, using file store:", (error as Error).message);
    return false;
  }
}

async function findPostgresByIdempotency(
  scopeKey: string,
  patientId: string,
  idempotencyKey: string
): Promise<CareEpisode | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureCareEpisodesSchema();
    const result = await getPgPool().query<CareEpisodeRow>(
      `SELECT ${CARE_EPISODE_SELECT}
       FROM aksh.care_episodes
       WHERE scope_key = $1 AND patient_id = $2 AND idempotency_key = $3
       LIMIT 1`,
      [scopeKey, patientId, idempotencyKey]
    );
    const row = result.rows[0];
    return row ? mapPgEpisode(row) : null;
  } catch (error) {
    console.warn("[care-episode] findPostgresByIdempotency failed:", (error as Error).message);
    return null;
  }
}

async function getPostgresEpisode(
  episodeId: string,
  scopeKey: string
): Promise<CareEpisode | null | undefined> {
  if (!isPostgresConfigured()) return undefined;
  try {
    await ensureCareEpisodesSchema();
    const result = await getPgPool().query<CareEpisodeRow>(
      `SELECT ${CARE_EPISODE_SELECT}
       FROM aksh.care_episodes
       WHERE scope_key = $1 AND id = $2
       LIMIT 1`,
      [scopeKey, episodeId]
    );
    const row = result.rows[0];
    return row ? mapPgEpisode(row) : null;
  } catch (error) {
    console.warn("[care-episode] getPostgresEpisode failed:", (error as Error).message);
    return undefined;
  }
}

async function listPostgresForPatient(
  scopeKey: string,
  patientId: string,
  limit: number
): Promise<CareEpisode[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureCareEpisodesSchema();
    const result = await getPgPool().query<CareEpisodeRow>(
      `SELECT ${CARE_EPISODE_SELECT}
       FROM aksh.care_episodes
       WHERE scope_key = $1 AND patient_id = $2
       ORDER BY updated_at DESC
       LIMIT $3`,
      [scopeKey, patientId, limit]
    );
    return result.rows.map(mapPgEpisode);
  } catch (error) {
    console.warn("[care-episode] listPostgresForPatient failed:", (error as Error).message);
    return null;
  }
}

async function listPostgresForScope(
  scopeKey: string,
  limit: number
): Promise<CareEpisode[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureCareEpisodesSchema();
    const result = await getPgPool().query<CareEpisodeRow>(
      `SELECT ${CARE_EPISODE_SELECT}
       FROM aksh.care_episodes
       WHERE scope_key = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [scopeKey, limit]
    );
    return result.rows.map(mapPgEpisode);
  } catch (error) {
    console.warn("[care-episode] listPostgresForScope failed:", (error as Error).message);
    return null;
  }
}

async function listPostgresEvents(
  episodeId: string,
  scopeKey: string
): Promise<CareEpisodeEvent[] | null> {
  if (!isPostgresConfigured()) return null;
  try {
    await ensureCareEpisodesSchema();
    const result = await getPgPool().query<CareEpisodeEventRow>(
      `SELECT id, episode_id, scope_key, kind, at, actor, from_status, to_status,
              detail, payload, idempotency_key, processed
       FROM aksh.care_episode_events
       WHERE scope_key = $1 AND episode_id = $2
       ORDER BY at ASC`,
      [scopeKey, episodeId]
    );
    return result.rows.map(mapPgEvent);
  } catch (error) {
    console.warn("[care-episode] listPostgresEvents failed:", (error as Error).message);
    return null;
  }
}

export async function createCareEpisode(input: CreateCareEpisodeInput): Promise<CareEpisode> {
  const scopeKey = input.scopeKey ?? "shared";
  const store = await readStore(scopeKey);

  if (input.idempotencyKey) {
    const pgExisting = await findPostgresByIdempotency(scopeKey, input.patientId, input.idempotencyKey);
    if (pgExisting) return pgExisting;
    const existing = store.episodes.find(
      (e) => e.patientId === input.patientId && e.idempotencyKey === input.idempotencyKey
    );
    if (existing) return existing;
  }

  const id = `ce-${randomUUID()}`;
  const at = nowIso();
  const episode: CareEpisode = {
    id,
    publicId: publicIdFrom(id),
    scopeKey,
    organisationId: input.organisationId,
    practiceId: input.practiceId,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    status: input.initialStatus ?? "draft",
    pathway: input.pathway,
    links: [],
    tasks: [],
    createdAt: at,
    updatedAt: at,
    createdBy: input.createdBy,
    version: 1,
    synthetic: true,
    ehrWrite: false,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
  };

  const event = makeEvent(id, "created", input.createdBy, {
    toStatus: episode.status,
    detail: "Care episode created",
    idempotencyKey: input.idempotencyKey,
    payload: { pathway: input.pathway },
  });

  store.episodes.push(episode);
  store.events.push(event);
  await writeStore(store, scopeKey);
  await persistPostgresEpisode(episode, event);
  return episode;
}

/** Milestone E1 — get with storeMode (Postgres-preferred when configured). */
export async function getCareEpisodeWithMode(
  episodeId: string,
  scopeKey = "shared"
): Promise<CareEpisodeGetResult> {
  if (isPostgresConfigured()) {
    const pg = await getPostgresEpisode(episodeId, scopeKey);
    if (pg !== undefined) {
      return { episode: pg, storeMode: "postgres" };
    }
    const store = await readStore(scopeKey);
    return {
      episode: store.episodes.find((e) => e.id === episodeId) ?? null,
      storeMode: "file_fallback",
    };
  }
  const store = await readStore(scopeKey);
  return {
    episode: store.episodes.find((e) => e.id === episodeId) ?? null,
    storeMode: "file",
  };
}

export async function getCareEpisode(
  episodeId: string,
  scopeKey = "shared"
): Promise<CareEpisode | null> {
  const { episode } = await getCareEpisodeWithMode(episodeId, scopeKey);
  return episode;
}

/** Milestone E1 — patient list with storeMode. */
export async function listCareEpisodesForPatientWithMode(
  patientId: string,
  scopeKey = "shared",
  limit = 100
): Promise<CareEpisodeListResult> {
  const capped = Math.min(Math.max(limit, 1), 200);
  if (isPostgresConfigured()) {
    const pg = await listPostgresForPatient(scopeKey, patientId, capped);
    if (pg) {
      return { episodes: pg.slice(0, capped), storeMode: "postgres" };
    }
    const store = await readStore(scopeKey);
    return {
      episodes: store.episodes
        .filter((e) => e.patientId === patientId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, capped),
      storeMode: "file_fallback",
    };
  }
  const store = await readStore(scopeKey);
  return {
    episodes: store.episodes
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, capped),
    storeMode: "file",
  };
}

export async function listCareEpisodesForPatient(
  patientId: string,
  scopeKey = "shared"
): Promise<CareEpisode[]> {
  const { episodes } = await listCareEpisodesForPatientWithMode(patientId, scopeKey);
  return episodes;
}

/** Milestone E1 — scope list with storeMode (Agent Ops stuck-task alerts). */
export async function listCareEpisodesForScopeWithMode(
  scopeKey = "shared",
  limit = 100
): Promise<CareEpisodeListResult> {
  const capped = Math.min(Math.max(limit, 1), 200);
  if (isPostgresConfigured()) {
    const pg = await listPostgresForScope(scopeKey, capped);
    if (pg) {
      return { episodes: pg.slice(0, capped), storeMode: "postgres" };
    }
    const store = await readStore(scopeKey);
    return {
      episodes: [...store.episodes]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, capped),
      storeMode: "file_fallback",
    };
  }
  const store = await readStore(scopeKey);
  return {
    episodes: [...store.episodes]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, capped),
    storeMode: "file",
  };
}

/** A4 — list recent care episodes for a tenant scope (Agent Ops stuck-task alerts). */
export async function listCareEpisodesForScope(
  scopeKey = "shared",
  limit = 100
): Promise<CareEpisode[]> {
  const { episodes } = await listCareEpisodesForScopeWithMode(scopeKey, limit);
  return episodes;
}

export async function listCareEpisodeEvents(
  episodeId: string,
  scopeKey = "shared"
): Promise<CareEpisodeEvent[]> {
  if (isPostgresConfigured()) {
    const pg = await listPostgresEvents(episodeId, scopeKey);
    if (pg) return pg;
  }
  const store = await readStore(scopeKey);
  return store.events
    .filter((e) => e.episodeId === episodeId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export class CareEpisodeTransitionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "CareEpisodeTransitionError";
    this.code = code;
  }
}

/** Prefer file row; hydrate from Neon when shared sandbox has no local mirror. */
async function loadEpisodeIntoStore(
  store: Store,
  episodeId: string,
  scopeKey: string
): Promise<number> {
  const idx = store.episodes.findIndex((e) => e.id === episodeId);
  if (idx >= 0) return idx;
  const pg = await getPostgresEpisode(episodeId, scopeKey);
  if (pg) {
    store.episodes.push(pg);
    return store.episodes.length - 1;
  }
  return -1;
}

export async function transitionCareEpisode(
  input: TransitionCareEpisodeInput
): Promise<{ episode: CareEpisode; event: CareEpisodeEvent }> {
  const scopeKey = input.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = await loadEpisodeIntoStore(store, input.episodeId, scopeKey);
  if (idx < 0) {
    throw new CareEpisodeTransitionError("NOT_FOUND", `Care episode ${input.episodeId} not found`);
  }

  const current = store.episodes[idx]!;

  if (input.idempotencyKey) {
    const prior = store.events.find(
      (e) =>
        e.episodeId === input.episodeId &&
        e.kind === "status_transition" &&
        e.idempotencyKey === input.idempotencyKey
    );
    if (prior && prior.toStatus === input.toStatus) {
      return { episode: current, event: prior };
    }
  }

  if (input.expectedVersion != null && current.version !== input.expectedVersion) {
    throw new CareEpisodeTransitionError(
      "VERSION_CONFLICT",
      `Expected version ${input.expectedVersion}, found ${current.version}`
    );
  }

  const validation = validateCareEpisodeTransition(current.status, input.toStatus);
  if (!validation.ok) {
    throw new CareEpisodeTransitionError(validation.code, validation.message);
  }

  const at = nowIso();
  const next: CareEpisode = {
    ...current,
    status: input.toStatus,
    updatedAt: at,
    version: current.version + 1,
    closedAt: input.toStatus === "closed" || input.toStatus === "cancelled" ? at : current.closedAt,
  };

  const event = makeEvent(current.id, "status_transition", input.actor, {
    fromStatus: current.status,
    toStatus: input.toStatus,
    detail: input.reason ?? `Transition ${current.status} → ${input.toStatus}`,
    idempotencyKey: input.idempotencyKey,
  });

  const outbox = makeEvent(current.id, "outbox_enqueued", input.actor, {
    fromStatus: current.status,
    toStatus: input.toStatus,
    detail: "care_episode.status_transition",
    payload: {
      outboxTopic: "care_episode.transition",
      episodeId: current.id,
      fromStatus: current.status,
      toStatus: input.toStatus,
    },
    idempotencyKey: input.idempotencyKey ? `outbox:${input.idempotencyKey}` : undefined,
  });

  store.episodes[idx] = next;
  store.events.push(event, outbox);
  await writeStore(store, scopeKey);
  await persistPostgresEpisode(next, event);
  await persistPostgresEpisode(next, outbox);
  return { episode: next, event };
}

export async function attachCareEpisodeLink(
  episodeId: string,
  link: Omit<CareEpisodeLink, "linkedAt">,
  actor: string,
  scopeKey = "shared"
): Promise<CareEpisode> {
  const store = await readStore(scopeKey);
  const idx = await loadEpisodeIntoStore(store, episodeId, scopeKey);
  if (idx < 0) {
    throw new CareEpisodeTransitionError("NOT_FOUND", `Care episode ${episodeId} not found`);
  }
  const current = store.episodes[idx]!;
  const full: CareEpisodeLink = { ...link, linkedAt: nowIso() };
  const next: CareEpisode = {
    ...current,
    links: [...current.links.filter((l) => !(l.kind === link.kind && l.id === link.id)), full],
    updatedAt: nowIso(),
    version: current.version + 1,
  };
  const event = makeEvent(episodeId, "link_attached", actor, {
    detail: `Linked ${link.kind}:${link.id}`,
    payload: { link: full },
  });
  store.episodes[idx] = next;
  store.events.push(event);
  await writeStore(store, scopeKey);
  await persistPostgresEpisode(next, event);
  return next;
}

export async function addCareEpisodeTask(
  episodeId: string,
  task: Omit<CareEpisodeTask, "id" | "episodeId" | "createdAt" | "status"> & {
    status?: CareEpisodeTask["status"];
    /** Optional override for ops alert fixtures (A4 stuck-task signals). */
    createdAt?: string;
  },
  actor: string,
  scopeKey = "shared"
): Promise<CareEpisode> {
  const store = await readStore(scopeKey);
  const idx = await loadEpisodeIntoStore(store, episodeId, scopeKey);
  if (idx < 0) {
    throw new CareEpisodeTransitionError("NOT_FOUND", `Care episode ${episodeId} not found`);
  }
  const current = store.episodes[idx]!;
  const full: CareEpisodeTask = {
    id: `cet-${randomUUID()}`,
    episodeId,
    title: task.title,
    ownerRole: task.ownerRole,
    status: task.status ?? "open",
    createdAt: task.createdAt ?? nowIso(),
    dueAt: task.dueAt,
    relatedLink: task.relatedLink,
  };
  const next: CareEpisode = {
    ...current,
    tasks: [...current.tasks, full],
    updatedAt: nowIso(),
    version: current.version + 1,
  };
  const event = makeEvent(episodeId, "task_created", actor, {
    detail: full.title,
    payload: { taskId: full.id, ownerRole: full.ownerRole },
  });
  store.episodes[idx] = next;
  store.events.push(event);
  await writeStore(store, scopeKey);
  await persistPostgresEpisode(next, event);
  return next;
}

export async function resetCareEpisodeStoreForTests(scopeKey = "shared"): Promise<void> {
  await writeStore({ episodes: [], events: [] }, scopeKey);
}
