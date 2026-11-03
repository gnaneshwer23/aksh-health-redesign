/**
 * Milestone E P1.2 — loop-outcomes Postgres-preferred list with storeMode honesty.
 *
 * Previously returned an empty unavailable source whenever the review-case
 * adapter was not postgres — hiding file-mode agent-run cases from Agent Ops.
 * Same D1/E1 pattern: postgres | file | file_fallback.
 */
import { isPostgresConfigured, withPracticeContext } from "../db/client";
import { DEFAULT_PRACTICE_ID } from "./constants";
import { jsonFileReviewCaseRepositoryAdapter } from "../storage/json-file-review-case-adapter";
import {
  getConfiguredReviewCaseRepositoryAdapterId,
  getReviewCaseRepositoryAdapter,
} from "../storage/get-review-case-repository-adapter";
import type { ReviewCase } from "../types";

export type LoopOutcomesStoreMode = "postgres" | "file" | "file_fallback";

export type LoopOutcomesListResult = {
  /** @deprecated Prefer storeMode — kept for COMPASS / readiness API compatibility. */
  source: LoopOutcomesStoreMode;
  storeMode: LoopOutcomesStoreMode;
  cases: ReviewCase[];
};

function rowToCase(row: { payload: ReviewCase; practice_id: string; user_id: string }): ReviewCase {
  return {
    ...row.payload,
    practiceId: row.payload.practiceId ?? row.practice_id,
    userId: row.payload.userId || row.user_id,
  };
}

function withAgentRun(cases: ReviewCase[]): ReviewCase[] {
  return cases.filter((c) => Boolean(c.agentRun));
}

async function listPostgresAgentRuns(
  practiceId: string,
  limit: number
): Promise<ReviewCase[] | null> {
  try {
    return await withPracticeContext(practiceId, async (client) =>
      (
        await client.query<{ payload: ReviewCase; practice_id: string; user_id: string }>(
          `SELECT payload, practice_id, user_id FROM aksh.review_cases
           WHERE practice_id = $1 AND payload ? 'agentRun'
           ORDER BY updated_at DESC LIMIT $2`,
          [practiceId, limit]
        )
      ).rows.map(rowToCase)
    );
  } catch (error) {
    console.warn("[loop-outcomes] postgres list failed:", (error as Error).message);
    return null;
  }
}

async function listFileAgentRuns(
  practiceId: string,
  scopeKey: string,
  limit: number
): Promise<ReviewCase[]> {
  const adapter = getReviewCaseRepositoryAdapter();
  // Prefer the configured adapter for hermetic / file sandboxes. When falling
  // back from a postgres failure, force the json file adapter so we do not
  // re-enter the failing postgres path.
  const reader =
    adapter.id === "postgres_repository" ? jsonFileReviewCaseRepositoryAdapter : adapter;
  const cases = await reader.readReviewCases(scopeKey, practiceId);
  return withAgentRun(cases).slice(0, limit);
}

function normalizeArgs(
  practiceIdOrOptions: string | { practiceId: string; scopeKey?: string; limit?: number },
  limitArg = 2000
): { practiceId: string; scopeKey: string; limit: number } {
  if (typeof practiceIdOrOptions === "string") {
    return {
      practiceId: practiceIdOrOptions || DEFAULT_PRACTICE_ID,
      scopeKey: "shared",
      limit: Math.min(Math.max(limitArg, 1), 5000),
    };
  }
  return {
    practiceId: practiceIdOrOptions.practiceId || DEFAULT_PRACTICE_ID,
    scopeKey: practiceIdOrOptions.scopeKey?.trim() || "shared",
    limit: Math.min(Math.max(practiceIdOrOptions.limit ?? 2000, 1), 5000),
  };
}

/**
 * Agent-run review cases for one organisation, newest first, for COMPASS / Agent Ops aggregates.
 *
 * - Postgres adapter + DATABASE_URL → Neon list (`storeMode: postgres`); on failure → file_fallback.
 * - File adapter / hermetic → json file list (`storeMode: file`) — never silently empty.
 */
export async function listAgentRunCases(
  practiceIdOrOptions: string | { practiceId: string; scopeKey?: string; limit?: number },
  limitArg = 2000
): Promise<LoopOutcomesListResult> {
  const { practiceId, scopeKey, limit } = normalizeArgs(practiceIdOrOptions, limitArg);
  const adapterId = getConfiguredReviewCaseRepositoryAdapterId();

  if (isPostgresConfigured() && adapterId === "postgres_repository") {
    const pg = await listPostgresAgentRuns(practiceId, limit);
    if (pg !== null) {
      return { cases: pg, storeMode: "postgres", source: "postgres" };
    }
    const fileCases = await listFileAgentRuns(practiceId, scopeKey, limit);
    return { cases: fileCases, storeMode: "file_fallback", source: "file_fallback" };
  }

  const fileCases = await listFileAgentRuns(practiceId, scopeKey, limit);
  return { cases: fileCases, storeMode: "file", source: "file" };
}
