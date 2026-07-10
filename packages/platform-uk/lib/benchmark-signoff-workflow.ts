import { buildBenchmarkEvidencePayload } from "./benchmark-evidence";
import { readFeedbackState } from "./feedback-repository";
import { buildEvidenceReadinessPayload } from "./readiness-evidence";
import { saveEvidenceReadinessSnapshot } from "./readiness-history-repository";
import { readReviewCases } from "./review-case-repository";
import { saveBenchmarkSignoff } from "./benchmark-signoff-repository";
import type { BenchmarkSignoffDraft, BenchmarkSignoffState } from "./benchmark-signoff-types";

export async function saveBenchmarkSignoffWithReadinessSnapshot(
  draft: Partial<BenchmarkSignoffDraft>,
  scopeKey = "shared",
  userId = "anonymous"
): Promise<BenchmarkSignoffState> {
  const cases = await readReviewCases(scopeKey);
  const evidence = buildBenchmarkEvidencePayload(cases);
  const signoffState = await saveBenchmarkSignoff(draft, evidence, scopeKey, userId);
  const latestSignoff = signoffState.archive[0];

  if (latestSignoff) {
    const feedbackState = await readFeedbackState(scopeKey, userId);
    const readinessPayload = buildEvidenceReadinessPayload(cases, feedbackState.archive, latestSignoff);
    await saveEvidenceReadinessSnapshot(readinessPayload, scopeKey, userId);
  }

  return signoffState;
}