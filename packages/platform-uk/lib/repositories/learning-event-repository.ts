import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import { LEARNING_EVENTS_SQL } from "../db/schema-sql";
import {
  assertNoAutoRetrain,
  buildLearningEvent,
  buildLinkedOutcomeEvent,
  type LearningEvent,
  type LearningEventInput,
  type LearningOutcomeLinkInput
} from "../clinical-proof/learning-loop";
import { persistShieldAuditEvent } from "./shield-audit-repository";

function buildLearningShieldAuditInput(event: LearningEvent, retry = false) {
  return {
    action: event.decision,
    actor: event.decisionActor,
    label: `LEARNING: ${event.agentLabel} ${event.decision} → ${event.outcomeKind}${retry ? " (retry)" : ""}`,
    detail: [
      `prediction=${event.predictionId}`,
      event.caseId ? `case=${event.caseId}` : null,
      event.outcomeSummary ?? null,
      "autoRetrain=false",
      "modelUpdated=false",
      retry ? "retry=true" : null
    ]
      .filter(Boolean)
      .join(" · "),
    category: "continuous_learning",
    caseId: event.caseId ?? undefined,
    queueItemId: event.queueItemId ?? undefined,
    practiceId: event.practiceId ?? undefined,
    agentLabel: event.agentLabel,
    resourceRef: event.predictionId,
    payload: {
      learningEventId: event.id,
      outcomeKind: event.outcomeKind,
      autoRetrainTriggered: false,
      modelUpdated: false,
      ...(retry ? { retry: true } : {})
    }
  };
}

const dataDir = path.join(process.cwd(), "data");

/** Controlled path only — never write outside packages/platform-uk/data */
function resolveLearningFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "learning-events.json");
  }
  return path.join(dataDir, `learning-events.${safe}.json`);
}

let schemaReady: Promise<void> | null = null;

export async function ensureLearningEventsSchema() {
  if (!isPostgresConfigured()) return;
  if (!schemaReady) {
    schemaReady = getPgPool()
      .query(LEARNING_EVENTS_SQL)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

async function readFileStore(scopeKey: string): Promise<LearningEvent[]> {
  const file = resolveLearningFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { events?: LearningEvent[] };
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

async function appendFileStore(event: LearningEvent, scopeKey: string) {
  const file = resolveLearningFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  const events = await readFileStore(scopeKey);
  events.push(event);
  await writeFile(file, JSON.stringify({ events }, null, 2), "utf8");
}

async function persistPostgres(event: LearningEvent, scopeKey: string): Promise<boolean> {
  try {
    await ensureLearningEventsSchema();
    await getPgPool().query(
      `INSERT INTO aksh.learning_events (
        id, recorded_at, scope_key, practice_id, case_id, queue_item_id, patient_id,
        agent_label, prediction_id, prediction_summary, model_version,
        decision, decision_actor, decision_notes, outcome_kind, outcome_summary,
        outcome_metric, auto_retrain_triggered, model_updated, ehr_write,
        hitl_required, governance_note, payload
      ) VALUES (
        $1, $2::timestamptz, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17::jsonb, FALSE, FALSE, FALSE,
        TRUE, $18, $19::jsonb
      )`,
      [
        event.id,
        event.recordedAt,
        scopeKey,
        event.practiceId,
        event.caseId,
        event.queueItemId,
        event.patientId,
        event.agentLabel,
        event.predictionId,
        event.predictionSummary ?? null,
        event.modelVersion,
        event.decision,
        event.decisionActor,
        event.decisionNotes ?? null,
        event.outcomeKind,
        event.outcomeSummary ?? null,
        event.outcomeMetric ? JSON.stringify(event.outcomeMetric) : null,
        event.governanceNote,
        JSON.stringify({
          autoRetrainTriggered: false,
          modelUpdated: false,
          ehrWrite: false,
          linksToEventId: event.linksToEventId ?? null
        })
      ]
    );
    return true;
  } catch (error) {
    console.error("[learning-events] postgres persist failed", error);
    return false;
  }
}

async function listPostgres(limit: number, scopeKey: string): Promise<LearningEvent[] | null> {
  try {
    await ensureLearningEventsSchema();
    const result = await getPgPool().query<{
      id: string;
      recorded_at: Date;
      practice_id: string | null;
      case_id: string | null;
      queue_item_id: string | null;
      patient_id: string | null;
      agent_label: string;
      prediction_id: string;
      prediction_summary: string | null;
      model_version: string | null;
      decision: LearningEvent["decision"];
      decision_actor: string;
      decision_notes: string | null;
      outcome_kind: LearningEvent["outcomeKind"];
      outcome_summary: string | null;
      outcome_metric: LearningEvent["outcomeMetric"];
      governance_note: string;
      payload: { linksToEventId?: string | null } | null;
    }>(
      `SELECT id, recorded_at, practice_id, case_id, queue_item_id, patient_id,
              agent_label, prediction_id, prediction_summary, model_version,
              decision, decision_actor, decision_notes, outcome_kind, outcome_summary,
              outcome_metric, governance_note, payload
       FROM aksh.learning_events
       WHERE scope_key = $2
       ORDER BY recorded_at DESC, id DESC
       LIMIT $1`,
      [limit, scopeKey]
    );

    return result.rows.map((row) => ({
      id: row.id,
      recordedAt: row.recorded_at.toISOString(),
      practiceId: row.practice_id,
      caseId: row.case_id,
      queueItemId: row.queue_item_id,
      patientId: row.patient_id,
      agentLabel: row.agent_label,
      predictionId: row.prediction_id,
      predictionSummary: row.prediction_summary ?? undefined,
      modelVersion: row.model_version,
      decision: row.decision,
      decisionActor: row.decision_actor,
      decisionNotes: row.decision_notes ?? undefined,
      outcomeKind: row.outcome_kind,
      outcomeSummary: row.outcome_summary ?? undefined,
      outcomeMetric: row.outcome_metric ?? null,
      linksToEventId: row.payload?.linksToEventId ?? null,
      autoRetrainTriggered: false as const,
      modelUpdated: false as const,
      ehrWrite: false as const,
      hitlRequired: true as const,
      governanceNote: row.governance_note
    }));
  } catch (error) {
    console.error("[learning-events] postgres list failed", error);
    return null;
  }
}

/**
 * Append a learning event. Prefers Postgres; falls back to controlled file under data/.
 * Also dual-writes a SHIELD-adjacent audit row when Postgres is available.
 * Never triggers retrain or model update.
 *
 * SHIELD hard-fail (OQ-HITL-2): a failed dual write is reported back via
 * `shieldAuditWriteFailed` — callers (queue-decision.ts) must propagate this to
 * the API response/UI rather than treating the learning-event write as proof
 * the audit mirror also succeeded. The clinical decision itself is never blocked
 * on this — only the honesty of what's reported back is at stake.
 */
export async function recordLearningEvent(
  input: LearningEventInput,
  options?: { scopeKey?: string; shieldDualWrite?: boolean }
): Promise<{
  event: LearningEvent;
  source: "postgres" | "file";
  shieldAuditWriteFailed: boolean;
  shieldAuditWriteReason?: string;
}> {
  const event = buildLearningEvent(input, () => `learn-${randomUUID()}`);
  assertNoAutoRetrain(event);

  const scopeKey = options?.scopeKey ?? "shared";
  let source: "postgres" | "file" = "file";

  if (isPostgresConfigured()) {
    const ok = await persistPostgres(event, scopeKey);
    if (ok) {
      source = "postgres";
    } else {
      await appendFileStore(event, scopeKey);
    }
  } else {
    await appendFileStore(event, scopeKey);
  }

  let shieldAuditWriteFailed = false;
  let shieldAuditWriteReason: string | undefined;

  if (options?.shieldDualWrite !== false) {
    const shieldResult = await persistShieldAuditEvent(buildLearningShieldAuditInput(event));
    if (!shieldResult.persisted) {
      shieldAuditWriteFailed = true;
      shieldAuditWriteReason = shieldResult.reason;
      console.error(
        "[shield-audit] durable write failed for learning event",
        event.id,
        shieldResult.reason
      );
    }
  }

  return { event, source, shieldAuditWriteFailed, shieldAuditWriteReason };
}

/**
 * Re-attempt the SHIELD dual write for a learning event whose original write
 * failed (fail-visible retry path for OQ-HITL-2). Does not mutate or re-record
 * the underlying learning event — SHIELD is append-only, so a successful retry
 * simply appends a fresh, honestly-labelled "(retry)" audit row.
 */
export async function retryShieldAuditForLearningEvent(
  learningEventId: string,
  options?: { scopeKey?: string }
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const found = await findLearningEventById(learningEventId, { scopeKey: options?.scopeKey });
  if (!found.event) {
    return { ok: false, reason: "learning_event_not_found" };
  }

  const result = await persistShieldAuditEvent(buildLearningShieldAuditInput(found.event, true));
  if (!result.persisted) {
    return { ok: false, reason: result.reason };
  }
  return { ok: true };
}

export async function listLearningEvents(options?: {
  limit?: number;
  scopeKey?: string;
}): Promise<{ source: "postgres" | "file"; events: LearningEvent[] }> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const scopeKey = options?.scopeKey ?? "shared";

  if (isPostgresConfigured()) {
    const rows = await listPostgres(limit, scopeKey);
    if (rows) {
      return { source: "postgres", events: rows };
    }
  }

  const events = await readFileStore(scopeKey);
  return {
    source: "file",
    events: events.slice(-limit).reverse()
  };
}

export async function findLearningEventById(
  id: string,
  options?: { scopeKey?: string }
): Promise<{ source: "postgres" | "file"; event: LearningEvent | null }> {
  const { source, events } = await listLearningEvents({
    limit: 200,
    scopeKey: options?.scopeKey
  });
  return {
    source,
    event: events.find((item) => item.id === id) ?? null
  };
}

/**
 * Append-only eventual outcome link. Never UPDATEs the source row; never auto-retrains.
 */
export async function linkLearningOutcome(
  sourceEventId: string,
  link: LearningOutcomeLinkInput,
  options?: { scopeKey?: string; shieldDualWrite?: boolean }
): Promise<{ event: LearningEvent; source: "postgres" | "file"; sourceEvent: LearningEvent }> {
  const found = await findLearningEventById(sourceEventId, { scopeKey: options?.scopeKey });
  if (!found.event) {
    throw new Error(`Learning event not found: ${sourceEventId}`);
  }

  const linked = buildLinkedOutcomeEvent(found.event, link);
  assertNoAutoRetrain(linked);

  const recorded = await recordLearningEvent(linked, {
    scopeKey: options?.scopeKey,
    shieldDualWrite: options?.shieldDualWrite
  });

  return {
    event: recorded.event,
    source: recorded.source,
    sourceEvent: found.event
  };
}
