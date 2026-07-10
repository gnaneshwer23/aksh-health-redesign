import type { ReviewCase } from "../types";

export type ReviewCaseRepositoryAdapterId =
  | "json_file_repository"
  | "postgres_repository"
  | "planned_database_repository";

export interface ReviewCaseRepositoryAdapter {
  id: ReviewCaseRepositoryAdapterId;
  readReviewCases(scopeKey?: string, practiceId?: string): Promise<ReviewCase[]>;
  readReviewCaseById(id: string, scopeKey?: string, userId?: string, practiceId?: string): Promise<ReviewCase | null>;
  writeReviewCases(cases: ReviewCase[], scopeKey?: string, practiceId?: string): Promise<ReviewCase[]>;
  updateReviewCase(
    updatedCase: ReviewCase,
    scopeKey?: string,
    userId?: string,
    practiceId?: string
  ): Promise<ReviewCase>;
  createReviewCase(reviewCase: ReviewCase, scopeKey?: string, userId?: string, practiceId?: string): Promise<ReviewCase>;
  resetReviewCases(scopeKey?: string, practiceId?: string): Promise<ReviewCase[]>;
}
