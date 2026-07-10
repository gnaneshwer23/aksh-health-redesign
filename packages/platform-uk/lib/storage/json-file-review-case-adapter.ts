import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { reviewCases as seedCases } from "../mock-data";
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

export const jsonFileReviewCaseRepositoryAdapter: ReviewCaseRepositoryAdapter = {
  id: "json_file_repository",

  async readReviewCases(scopeKey = "shared") {
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
  },

  async readReviewCaseById(id: string, scopeKey = "shared", userId?: string) {
    const cases = await this.readReviewCases(scopeKey);
    const reviewCase = cases.find((item) => item.id === id) ?? null;

    if (reviewCase && userId && reviewCase.userId && reviewCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} does not own case ${id}`);
    }

    return reviewCase;
  },

  async writeReviewCases(cases: ReviewCase[], scopeKey = "shared") {
    const dataFile = resolveDataFile(scopeKey);
    await ensureDataFile(scopeKey);
    await writeFile(dataFile, JSON.stringify(cases, null, 2), "utf8");
    return cases;
  },

  async updateReviewCase(updatedCase: ReviewCase, scopeKey = "shared", userId?: string) {
    if (userId && updatedCase.userId && updatedCase.userId !== userId) {
      throw new Error(`Unauthorized: User ${userId} cannot modify case owned by ${updatedCase.userId}`);
    }

    const current = await this.readReviewCases(scopeKey);
    const next = current.map((item) => (item.id === updatedCase.id ? updatedCase : item));
    await this.writeReviewCases(next, scopeKey);
    return updatedCase;
  },

  async createReviewCase(reviewCase: ReviewCase, scopeKey = "shared", userId?: string) {
    const caseToCreate = {
      ...reviewCase,
      userId: userId || reviewCase.userId || "anonymous"
    };

    const current = await this.readReviewCases(scopeKey);
    const next = [caseToCreate, ...current];
    await this.writeReviewCases(next, scopeKey);
    return caseToCreate;
  },

  async resetReviewCases(scopeKey = "shared") {
    await this.writeReviewCases(seedCases, scopeKey);
    return seedCases;
  }
};
