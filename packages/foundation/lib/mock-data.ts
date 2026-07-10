import reviewCasesJson from "../data/review-cases.synthetic-reference.json";
import type { ReviewCase } from "./types";

/** Synthetic reference cases for workflow regression — no live PHI. */
export const reviewCases = reviewCasesJson as ReviewCase[];

export function getReviewCaseById(id: string): ReviewCase | undefined {
  return reviewCases.find((item) => item.id === id);
}
