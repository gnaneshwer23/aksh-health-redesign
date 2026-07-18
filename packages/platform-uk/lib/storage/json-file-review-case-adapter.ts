import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { reviewCases as seedCases } from "../mock-data";
import { filterRecordsForPractice, normalizePracticeId } from "../clinical-proof/tenant-isolation";
import { DEFAULT_PRACTICE_ID } from "../repositories/constants";
import type { ReviewCase } from "../types";

import type { ReviewCaseRepositoryAdapter } from "./repository-types";

const dataDir = path.join(process.cwd(), "data");

function resolveDataFile(scopeKey = "shared") {
  if (scopeKey === "shared") {
    return path.join(dataDir, "review-cases.json");
  }

  return path.join(dataDir, `review-cases.${scopeKey}.json`);
}

async function ensureDataFile(scopeKey = "shared") {
  const dataFile = resolveDataFile(scopeKey);
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedCases, null, 2), "utf8");
  }
}

async function readAllCases(scopeKey = "shared") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey);
  const raw = await readFile(dataFile, "utf8");
  const cases = JSON.parse(raw) as ReviewCase[];
  const existingIds = new Set(cases.map((item) => item.id));
  const missingSeedCases = seedCases.filter((item) => !existingIds.has(item.id));

  if (missingSeedCases.length) {
    const next = [...missingSeedCases, ...cases];
    await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8");
    return next;
  }

  return cases;
}

export const jsonFileReviewCaseRepositoryAdapter: ReviewCaseRepositoryAdapter = {
  id: "json_file_repository",

  async readReviewCases(scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    const cases = await readAllCases(scopeKey);
    return filterRecordsForPractice(cases, practiceId, DEFAULT_PRACTICE_ID);
  },

  async readReviewCaseById(
    id: string,
    scopeKey = "shared",
    userId?: string,
    practiceId = DEFAULT_PRACTICE_ID
  ) {
    const cases = await this.readReviewCases(scopeKey, practiceId);
    const reviewCase = cases.find((item) => item.id === id) ?? null;

    if (reviewCase && userId && reviewCase.userId && reviewCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} does not own case ${id}`);
    }

    return reviewCase;
  },

  async writeReviewCases(cases: ReviewCase[], scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    const dataFile = resolveDataFile(scopeKey);
    await ensureDataFile(scopeKey);
    const wanted = normalizePracticeId(practiceId, DEFAULT_PRACTICE_ID);
    const existing = await readAllCases(scopeKey);
    const otherPractice = existing.filter(
      (item) => normalizePracticeId(item.practiceId, DEFAULT_PRACTICE_ID) !== wanted
    );
    const stamped = cases.map((item) => ({
      ...item,
      practiceId: item.practiceId ?? wanted
    }));
    await writeFile(dataFile, JSON.stringify([...stamped, ...otherPractice], null, 2), "utf8");
    return stamped;
  },

  async updateReviewCase(
    updatedCase: ReviewCase,
    scopeKey = "shared",
    userId?: string,
    practiceId = DEFAULT_PRACTICE_ID
  ) {
    if (userId && updatedCase.userId && updatedCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} cannot modify case owned by ${updatedCase.userId}`);
    }

    const wanted = normalizePracticeId(
      updatedCase.practiceId ?? practiceId,
      DEFAULT_PRACTICE_ID
    );
    const payload = { ...updatedCase, practiceId: wanted };
    const existing = await readAllCases(scopeKey);
    const next = existing.map((item) => {
      if (item.id !== payload.id) return item;
      if (normalizePracticeId(item.practiceId, DEFAULT_PRACTICE_ID) !== wanted) return item;
      return payload;
    });
    const dataFile = resolveDataFile(scopeKey);
    await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8");
    return payload;
  },

  async createReviewCase(
    reviewCase: ReviewCase,
    scopeKey = "shared",
    userId?: string,
    practiceId = DEFAULT_PRACTICE_ID
  ) {
    const wanted = normalizePracticeId(reviewCase.practiceId ?? practiceId, DEFAULT_PRACTICE_ID);
    const caseToCreate = {
      ...reviewCase,
      practiceId: wanted,
      userId: userId || reviewCase.userId || "anonymous"
    };

    const current = await this.readReviewCases(scopeKey, wanted);
    const next = [caseToCreate, ...current.filter((item) => item.id !== caseToCreate.id)];
    await this.writeReviewCases(next, scopeKey, wanted);
    return caseToCreate;
  },

  async resetReviewCases(scopeKey = "shared", practiceId = DEFAULT_PRACTICE_ID) {
    const wanted = normalizePracticeId(practiceId, DEFAULT_PRACTICE_ID);
    const seeded = seedCases.map((item) => ({ ...item, practiceId: item.practiceId ?? wanted }));
    await this.writeReviewCases(seeded, scopeKey, wanted);
    return seeded;
  }
};
