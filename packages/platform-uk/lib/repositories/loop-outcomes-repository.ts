import { isPostgresConfigured, withPracticeContext } from "../db/client";
import { getConfiguredReviewCaseRepositoryAdapterId } from "../storage/get-review-case-repository-adapter";
import type { ReviewCase } from "../types";

function rowToCase(row: { payload: ReviewCase; practice_id: string; user_id: string }): ReviewCase {
  return {
    ...row.payload,
    practiceId: row.payload.practiceId ?? row.practice_id,
    userId: row.payload.userId || row.user_id
  };
}

/**
 * Agent-run review cases for one organisation (all reviewers / scopes), newest first, for COMPASS aggregates.
 * Reads under practice RLS. Requires the postgres review-case adapter so creates and this listing share storage
 * (DATABASE_URL with USE_POSTGRES unset/true, or AKSH_STORAGE_ADAPTER=postgres_repository).
 */
export async function listAgentRunCases(practiceId: string, limit = 2000): Promise<{ source: "postgres" | "unavailable"; cases: ReviewCase[] }> {
  if (!isPostgresConfigured() || getConfiguredReviewCaseRepositoryAdapterId() !== "postgres_repository") {
    return { source: "unavailable", cases: [] };
  }
  const cases = await withPracticeContext(practiceId, async (client) =>
    (await client.query<{ payload: ReviewCase; practice_id: string; user_id: string }>(
      `SELECT payload, practice_id, user_id FROM aksh.review_cases
       WHERE practice_id = $1 AND payload ? 'agentRun'
       ORDER BY updated_at DESC LIMIT $2`,
      [practiceId, limit]
    )).rows.map(rowToCase)
  );
  return { source: "postgres", cases };
}
