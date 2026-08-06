import { createHash, randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { SHIELD_AUDIT_EVENTS_SQL } from "../db/schema-sql";
import type { ShieldAction } from "../shield-audit";

export type DurableShieldAuditInput = {
  action: ShieldAction | string;
  actor: string;
  label: string;
  detail?: string;
  category?: string;
  practiceId?: string | null;
  caseId?: string | null;
  queueItemId?: string | null;
  agentLabel?: string | null;
  resourceRef?: string | null;
  payload?: Record<string, unknown>;
};

export type DurableShieldAuditRow = {
  id: string;
  recordedAt: string;
  practiceId: string | null;
  caseId: string | null;
  queueItemId: string | null;
  action: string;
  actor: string;
  agentLabel: string | null;
  category: string;
  label: string;
  detail: string | null;
  resourceRef: string | null;
  payload: Record<string, unknown>;
  prevEventId: string | null;
  contentHash: string;
};

/**
 * Discriminated write result. Never throws into clinical UI paths, but callers
 * MUST inspect `persisted` and propagate a failure signal instead of treating
 * a `null`/void return as an implicit success (OQ-HITL-2 / Volume I Ch.5 §5.4:
 * an audit write failure must be visible, not silently swallowed).
 */
export type ShieldAuditWriteResult =
  | { persisted: true; row: DurableShieldAuditRow }
  | { persisted: false; row: null; reason: string };

let schemaReady: Promise<void> | null = null;

export async function ensureShieldAuditSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(SHIELD_AUDIT_EVENTS_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

function hashEvent(parts: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

/**
 * Durable audit write. Never throws into clinical UI paths — but unlike the
 * old best-effort contract, a failed/unavailable write is never indistinguishable
 * from a successful one. Callers (queue-decision.ts, outcomes-loop.ts, the
 * governed-evaluation path) must check `result.persisted` and surface a
 * failure signal to the caller/UI rather than swallowing it silently.
 */
export async function persistShieldAuditEvent(
  input: DurableShieldAuditInput
): Promise<ShieldAuditWriteResult> {
  if (!isPostgresConfigured()) {
    return { persisted: false, row: null, reason: "postgres_not_configured" };
  }

  try {
    await ensureShieldAuditSchema();
    const pool = getPgPool();
    const prev = await pool.query<{ id: string }>(
      `SELECT id FROM aksh.shield_audit_events ORDER BY recorded_at DESC, id DESC LIMIT 1`
    );
    const prevEventId = prev.rows[0]?.id ?? null;
    const id = `shield-${randomUUID()}`;
    const recordedAt = new Date().toISOString();
    const payload = input.payload ?? {};
    const contentHash = hashEvent({
      id,
      recordedAt,
      prevEventId,
      action: input.action,
      actor: input.actor,
      label: input.label,
      detail: input.detail ?? null,
      caseId: input.caseId ?? null,
      queueItemId: input.queueItemId ?? null,
      practiceId: input.practiceId ?? null,
      agentLabel: input.agentLabel ?? null,
      resourceRef: input.resourceRef ?? null,
      payload
    });

    await pool.query(
      `INSERT INTO aksh.shield_audit_events (
        id, recorded_at, practice_id, case_id, queue_item_id, action, actor, agent_label,
        category, label, detail, resource_ref, payload, prev_event_id, content_hash
      ) VALUES (
        $1, $2::timestamptz, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13::jsonb, $14, $15
      )`,
      [
        id,
        recordedAt,
        input.practiceId ?? null,
        input.caseId ?? null,
        input.queueItemId ?? null,
        input.action,
        input.actor,
        input.agentLabel ?? null,
        input.category ?? "reviewer_decision",
        input.label,
        input.detail ?? null,
        input.resourceRef ?? null,
        JSON.stringify(payload),
        prevEventId,
        contentHash
      ]
    );

    return {
      persisted: true,
      row: {
        id,
        recordedAt,
        practiceId: input.practiceId ?? null,
        caseId: input.caseId ?? null,
        queueItemId: input.queueItemId ?? null,
        action: input.action,
        actor: input.actor,
        agentLabel: input.agentLabel ?? null,
        category: input.category ?? "reviewer_decision",
        label: input.label,
        detail: input.detail ?? null,
        resourceRef: input.resourceRef ?? null,
        payload,
        prevEventId,
        contentHash
      }
    };
  } catch (error) {
    console.error("[shield-audit] persist failed", error);
    return {
      persisted: false,
      row: null,
      reason: error instanceof Error ? error.message : "unknown_shield_audit_write_error"
    };
  }
}

export async function listShieldAuditEvents(options?: {
  limit?: number;
  practiceId?: string;
  agentLabel?: string;
  labelContains?: string;
}): Promise<{ source: "postgres" | "unavailable"; events: DurableShieldAuditRow[] }> {
  if (!isPostgresConfigured()) {
    return { source: "unavailable", events: [] };
  }

  try {
    await ensureShieldAuditSchema();
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
    const params: unknown[] = [];
    const clauses: string[] = [];

    if (options?.practiceId) {
      params.push(options.practiceId);
      clauses.push(`practice_id = $${params.length}`);
    }
    if (options?.agentLabel) {
      params.push(options.agentLabel);
      clauses.push(`agent_label = $${params.length}`);
    }
    if (options?.labelContains) {
      params.push(`%${options.labelContains}%`);
      clauses.push(`label ILIKE $${params.length}`);
    }

    params.push(limit);
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const result = await getPgPool().query<{
      id: string;
      recorded_at: Date;
      practice_id: string | null;
      case_id: string | null;
      queue_item_id: string | null;
      action: string;
      actor: string;
      agent_label: string | null;
      category: string;
      label: string;
      detail: string | null;
      resource_ref: string | null;
      payload: Record<string, unknown> | null;
      prev_event_id: string | null;
      content_hash: string;
    }>(
      `SELECT id, recorded_at, practice_id, case_id, queue_item_id, action, actor, agent_label,
              category, label, detail, resource_ref, payload, prev_event_id, content_hash
       FROM aksh.shield_audit_events
       ${where}
       ORDER BY recorded_at DESC, id DESC
       LIMIT $${params.length}`,
      params
    );

    return {
      source: "postgres",
      events: result.rows.map((row) => ({
        id: row.id,
        recordedAt: row.recorded_at.toISOString(),
        practiceId: row.practice_id,
        caseId: row.case_id,
        queueItemId: row.queue_item_id,
        action: row.action,
        actor: row.actor,
        agentLabel: row.agent_label,
        category: row.category,
        label: row.label,
        detail: row.detail,
        resourceRef: row.resource_ref,
        payload: row.payload ?? {},
        prevEventId: row.prev_event_id,
        contentHash: row.content_hash
      }))
    };
  } catch (error) {
    console.error("[shield-audit] list failed", error);
    return { source: "unavailable", events: [] };
  }
}
