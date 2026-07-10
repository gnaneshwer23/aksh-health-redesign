import type { BenchmarkSignoffEntry } from "./benchmark-signoff-types";
import { deriveDataHealthSummary, deriveEvidenceReadinessGate } from "./data-health";
import {
  buildEvidenceArtifactMetadata,
  EVIDENCE_ARTIFACT_VERSIONS
} from "./evidence-artifact-metadata";
import type { FeedbackEntry } from "./feedback-types";
import type { ReviewCase } from "./types";
import { deriveScenarioBenchmark, deriveScenarioBenchmarkActionQueue } from "./workflow";

export function buildEvidenceReadinessPayload(
  cases: ReviewCase[],
  feedbackArchive: FeedbackEntry[],
  latestBenchmarkSignoff?: BenchmarkSignoffEntry,
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const generatedAt = options?.generatedAt ?? new Date().toLocaleString("en-GB");
  const gate = deriveEvidenceReadinessGate(cases, feedbackArchive, latestBenchmarkSignoff);
  const dataHealth = deriveDataHealthSummary(cases, feedbackArchive, latestBenchmarkSignoff);
  const benchmark = deriveScenarioBenchmark(cases);
  const actionQueue = deriveScenarioBenchmarkActionQueue(cases);

  return {
    ...buildEvidenceArtifactMetadata({
      artifactType: "aksh-uk-eu-evidence-readiness",
      artifactVersion: EVIDENCE_ARTIFACT_VERSIONS.evidenceReadiness,
      generatedAt,
      generatedBy: options?.generatedBy
    }),
    gate,
    dataHealth,
    benchmarkSummary: {
      total: benchmark.total,
      passed: benchmark.passed,
      failed: benchmark.failed,
      passRate: gate.checks.benchmarkPassRate
    },
    actionSummary: {
      openBenchmarkActions: actionQueue.total,
      highBenchmarkActions: actionQueue.high,
      mediumBenchmarkActions: actionQueue.medium,
      lowBenchmarkActions: actionQueue.low,
      resolvedBenchmarkActions: actionQueue.resolved
    },
    signoff: latestBenchmarkSignoff ?? null,
    blockers: gate.blockers,
    followUps: gate.followUps
  };
}

export type ReturnTypeOfReadinessEvidence = ReturnType<typeof buildEvidenceReadinessPayload>;
