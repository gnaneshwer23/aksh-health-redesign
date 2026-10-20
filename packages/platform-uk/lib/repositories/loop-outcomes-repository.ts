import { isPostgresConfigured, withPracticeContext } from "../db/client";
import type { ReviewCase } from "../types";

/** Agent-run review cases for one organisation (all reviewers), newest first, for aggregate outcomes only. */
export async function listAgentRunCases(practiceId: string, limit = 2000): Promise<{ source: "postgres" | "unavailable"; cases: ReviewCase[] }> {
  if (!isPostgresConfigured()) return { source: "unavailable", cases: [] };
  const cases = await withPracticeContext(practiceId, async (client) =>
    (await client.query<{ payload: ReviewCase }>(
      `SELECT payload FROM aksh.review_cases WHERE practice_id = $1 AND payload ? 'agentRun' ORDER BY updated_at DESC LIMIT $2`,
      [practiceId, limit]
    )).rows.map((r) => r.payload)
  );
  return { source: "postgres", cases };
}
