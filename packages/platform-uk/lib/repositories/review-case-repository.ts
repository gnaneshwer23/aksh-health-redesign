import { reviewCases as seedCases } from "../mock-data";
import type { ReviewCase } from "../types";
import { withPracticeContext } from "../db/client";
import { DEFAULT_PRACTICE_ID } from "./constants";

import type { ReviewCaseRepositoryAdapter } from "../storage/repository-types";

function rowToCase(row: { payload: ReviewCase; practice_id: string; user_id: string }): ReviewCase {
  return {
    ...row.payload,
    practiceId: row.payload.practiceId ?? row.practice_id,
    userId: row.payload.userId || row.user_id
  };
}

async function readAllForScope(scopeKey: string, practiceId: string): Promise<ReviewCase[]> {
  return withPracticeContext(practiceId, async (client) => {
    const result = await client.query<{ payload: ReviewCase; practice_id: string; user_id: string }>(
      `SELECT payload, practice_id, user_id FROM aksh.review_cases WHERE scope_key = $1 AND practice_id = $2 ORDER BY updated_at DESC`,
      [scopeKey, practiceId]
    );

    const cases = result.rows.map(rowToCase);
    const existingIds = new Set(cases.map((item) => item.id));
    const missingSeedCases = seedCases
      .filter((item) => !existingIds.has(item.id))
      .map((item) => ({ ...item, practiceId }));

    if (missingSeedCases.length) {
      for (const seedCase of missingSeedCases) {
        await client.query(
          `INSERT INTO aksh.review_cases (id, scope_key, practice_id, user_id, payload, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
           ON CONFLICT (id, scope_key, practice_id) DO NOTHING`,
          [seedCase.id, scopeKey, practiceId, seedCase.userId || "anonymous", JSON.stringify(seedCase)]
        );
      }
      return [...missingSeedCases, ...cases];
    }

    return cases;
  });
}

async function writeAllForScope(cases: ReviewCase[], scopeKey: string, practiceId: string) {
  return withPracticeContext(practiceId, async (client) => {
    await client.query(`DELETE FROM aksh.review_cases WHERE scope_key = $1 AND practice_id = $2`, [scopeKey, practiceId]);

    for (const reviewCase of cases) {
      const payload = { ...reviewCase, practiceId };
      await client.query(
        `INSERT INTO aksh.review_cases (id, scope_key, practice_id, user_id, payload, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [reviewCase.id, scopeKey, practiceId, reviewCase.userId || "anonymous", JSON.stringify(payload)]
      );
    }

    return cases;
  });
}

export const postgresReviewCaseRepositoryAdapter: ReviewCaseRepositoryAdapter = {
  id: "postgres_repository",

  async readReviewCases(scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    return readAllForScope(scopeKey, practiceId);
  },

  async readReviewCaseById(id: string, scopeKey = "shared", userId?: string, practiceId = DEFAULT_PRACTICE_ID) {
    const cases = await this.readReviewCases(scopeKey, practiceId);
    const reviewCase = cases.find((item) => item.id === id) ?? null;

    if (reviewCase && userId && reviewCase.userId && reviewCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} does not own case ${id}`);
    }

    return reviewCase;
  },

  async writeReviewCases(cases: ReviewCase[], scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    return writeAllForScope(cases, scopeKey, practiceId);
  },

  async updateReviewCase(updatedCase: ReviewCase, scopeKey = "shared", userId?: string, practiceId = DEFAULT_PRACTICE_ID) {
    if (userId && updatedCase.userId && updatedCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} cannot modify case owned by ${updatedCase.userId}`);
    }

    const payload = { ...updatedCase, practiceId: updatedCase.practiceId ?? practiceId };

    await withPracticeContext(practiceId, async (client) => {
      await client.query(
        `INSERT INTO aksh.review_cases (id, scope_key, practice_id, user_id, payload, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
         ON CONFLICT (id, scope_key, practice_id)
         DO UPDATE SET payload = EXCLUDED.payload, user_id = EXCLUDED.user_id, updated_at = NOW()`,
        [payload.id, scopeKey, practiceId, payload.userId || "anonymous", JSON.stringify(payload)]
      );
    });

    return payload;
  },

  async createReviewCase(reviewCase: ReviewCase, scopeKey = "shared", userId?: string, practiceId = DEFAULT_PRACTICE_ID) {
    const caseToCreate = {
      ...reviewCase,
      practiceId: reviewCase.practiceId ?? practiceId,
      userId: userId || reviewCase.userId || "anonymous"
    };

    const current = await this.readReviewCases(scopeKey, practiceId);
    const next = [caseToCreate, ...current.filter((item) => item.id !== caseToCreate.id)];
    await writeAllForScope(next, scopeKey, practiceId);
    return caseToCreate;
  },

  async resetReviewCases(scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    const seeded = seedCases.map((item) => ({ ...item, practiceId }));
    await writeAllForScope(seeded, scopeKey, practiceId);
    return seeded;
  }
};
