/**
 * Persist a reviewer decision atomically: the case is updated only if its version still matches what the reviewer
 * saw, and the audit record is written in the same transaction, so a decision without its audit row (or two
 * reviewers overwriting each other) cannot happen. Without Postgres (local file storage) the decision is saved with
 * an in-memory version check and the audit is reported as not durable.
 */
import { getConfiguredReviewCaseRepositoryAdapterId, readReviewCases, updateReviewCase } from "../review-case-repository";
import { isPostgresConfigured, withPracticeContext } from "../db/client";
import type { ReviewCase } from "../types";
import { DecisionError } from "../workflow/decide-review-item";

import { ensureShieldAuditSchema, insertShieldAuditEvent, type DurableShieldAuditInput } from "./shield-audit-repository";

export async function persistItemDecision(input: {
  next: ReviewCase;
  expectedVersion: number;
  scopeKey: string;
  practiceId: string;
  userId: string;
  audit: DurableShieldAuditInput;
}): Promise<{ auditId: string | null; auditDurable: boolean }> {
  const payload = { ...input.next, practiceId: input.next.practiceId ?? input.practiceId, userId: input.userId };
  if (isPostgresConfigured() && getConfiguredReviewCaseRepositoryAdapterId() === "postgres_repository") {
    await ensureShieldAuditSchema();
    return withPracticeContext(input.practiceId, async (client) => {
      const r = await client.query(
        `UPDATE aksh.review_cases SET payload = $1::jsonb, user_id = $2, updated_at = NOW()
         WHERE id = $3 AND scope_key = $4 AND practice_id = $5 AND COALESCE((payload->>'version')::int, 0) = $6
         RETURNING id`,
        [JSON.stringify(payload), input.userId, payload.id, input.scopeKey, input.practiceId, input.expectedVersion]
      );
      if (!r.rowCount) throw new DecisionError("STALE_CASE", 409, "the case changed since you opened it; reload to see the latest version");
      // The audit table is written by the service role, inside the same transaction.
      await client.query("RESET ROLE");
      const row = await insertShieldAuditEvent(client as never, { ...input.audit, practiceId: input.practiceId });
      return { auditId: row.id, auditDurable: true };
    });
  }
  const current = (await readReviewCases(input.scopeKey, input.practiceId)).find((c) => c.id === payload.id);
  if ((current?.version ?? 0) !== input.expectedVersion) throw new DecisionError("STALE_CASE", 409, "the case changed since you opened it; reload to see the latest version");
  await updateReviewCase(payload, input.scopeKey, input.userId, input.practiceId);
  return { auditId: null, auditDurable: false };
}
