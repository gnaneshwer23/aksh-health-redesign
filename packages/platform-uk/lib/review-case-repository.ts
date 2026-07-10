import type { ReviewCase } from "./types";
import { DEFAULT_PRACTICE_ID } from "./repositories/constants";
import { getReviewCaseRepositoryAdapter } from "./storage/get-review-case-repository-adapter";

export { getConfiguredReviewCaseRepositoryAdapterId, getReviewCaseRepositoryAdapter } from "./storage/get-review-case-repository-adapter";
export type { ReviewCaseRepositoryAdapter, ReviewCaseRepositoryAdapterId } from "./storage/repository-types";

function resolvePracticeId(practiceId?: string) {
  return practiceId ?? DEFAULT_PRACTICE_ID;
}

export async function readReviewCases(scopeKey = "shared", practiceId?: string) {
  return getReviewCaseRepositoryAdapter().readReviewCases(scopeKey, resolvePracticeId(practiceId));
}

export async function readReviewCaseById(id: string, scopeKey = "shared", userId?: string, practiceId?: string) {
  return getReviewCaseRepositoryAdapter().readReviewCaseById(id, scopeKey, userId, resolvePracticeId(practiceId));
}

export async function writeReviewCases(cases: ReviewCase[], scopeKey = "shared", practiceId?: string) {
  return getReviewCaseRepositoryAdapter().writeReviewCases(cases, scopeKey, resolvePracticeId(practiceId));
}

export async function updateReviewCase(updatedCase: ReviewCase, scopeKey = "shared", userId?: string, practiceId?: string) {
  return getReviewCaseRepositoryAdapter().updateReviewCase(
    updatedCase,
    scopeKey,
    userId,
    resolvePracticeId(practiceId ?? updatedCase.practiceId)
  );
}

export async function createReviewCase(reviewCase: ReviewCase, scopeKey = "shared", userId?: string, practiceId?: string) {
  return getReviewCaseRepositoryAdapter().createReviewCase(
    reviewCase,
    scopeKey,
    userId,
    resolvePracticeId(practiceId ?? reviewCase.practiceId)
  );
}

export async function resetReviewCases(scopeKey = "shared", practiceId?: string) {
  return getReviewCaseRepositoryAdapter().resetReviewCases(scopeKey, resolvePracticeId(practiceId));
}
