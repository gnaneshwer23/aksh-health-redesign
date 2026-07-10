import type { BenchmarkSignoffEntry } from "./benchmark-signoff-types";
import { buildBenchmarkEvidencePayload } from "./benchmark-evidence";
import {
  buildEvidenceArtifactMetadata,
  EVIDENCE_ARTIFACT_VERSIONS
} from "./evidence-artifact-metadata";
import type { FeedbackEntry } from "./feedback-types";
import { deriveEvidenceReadinessTrend } from "./readiness-history-analytics";
import { buildEvidenceReadinessPayload } from "./readiness-evidence";
import type { EvidenceReadinessSnapshot } from "./readiness-history-types";
import { doNotClaimYet } from "./roadmap";
import type { ReviewCase } from "./types";

export function buildBoardPackEvidencePayload(
  cases: ReviewCase[],
  feedbackArchive: FeedbackEntry[],
  latestBenchmarkSignoff?: BenchmarkSignoffEntry,
  readinessArchive: EvidenceReadinessSnapshot[] = [],
  options?: { generatedAt?: string; generatedBy?: string; scopeKey?: string }
) {
  const benchmark = buildBenchmarkEvidencePayload(cases, options);
  const readiness = buildEvidenceReadinessPayload(cases, feedbackArchive, latestBenchmarkSignoff, options);
  const readinessTrend = deriveEvidenceReadinessTrend(readinessArchive);
  const latestReadinessSnapshot = readinessArchive[0] ?? null;

  return {
    ...buildEvidenceArtifactMetadata({
      artifactType: "aksh-uk-eu-board-pack-evidence",
      artifactVersion: EVIDENCE_ARTIFACT_VERSIONS.boardPackEvidence,
      generatedAt: options?.generatedAt,
      generatedBy: options?.generatedBy,
      scopeKey: options?.scopeKey
    }),
    knownLimitations: [...doNotClaimYet],
    limitationsNotice:
      "Combined benchmark and readiness board-pack for internal governance review. Synthetic-only proof artifact; not production readiness evidence.",
    boardPackSummary: {
      benchmarkPassRate: readiness.benchmarkSummary.passRate,
      benchmarkPassedCases: benchmark.summary.passedCases,
      benchmarkFailedCases: benchmark.summary.failedCases,
      openBenchmarkActions: benchmark.summary.openBenchmarkActions,
      readinessGateStatus: readiness.gate.status,
      readinessGateLabel: readiness.gate.label,
      readinessSnapshotCount: readinessTrend.snapshotCount,
      readinessTrendDirection: readinessTrend.direction,
      benchmarkSignoffDecision: latestBenchmarkSignoff?.decision ?? null,
      benchmarkSignedBy: latestBenchmarkSignoff?.reviewerName ?? null,
      latestReadinessSnapshotAt: latestReadinessSnapshot?.savedAt ?? null
    },
    benchmark,
    readiness,
    readinessTrend,
    latestReadinessSnapshot,
    signoff: latestBenchmarkSignoff ?? null
  };
}

export type BoardPackEvidencePayload = ReturnType<typeof buildBoardPackEvidencePayload>;
