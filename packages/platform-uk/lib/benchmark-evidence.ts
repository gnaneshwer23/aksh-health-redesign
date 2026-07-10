import {
  benchmarkFailureTriage,
  benchmarkReadinessCriteria,
  benchmarkRunbookSteps
} from "./benchmark-runbook";
import {
  buildEvidenceArtifactMetadata,
  EVIDENCE_ARTIFACT_VERSIONS
} from "./evidence-artifact-metadata";
import type { ReviewCase } from "./types";
import {
  deriveClinicalRuleCoverageMatrix,
  deriveScenarioBenchmark,
  deriveScenarioBenchmarkActionQueue,
  formatCaseTimestamp
} from "./workflow";

export function buildBenchmarkEvidencePayload(
  cases: ReviewCase[],
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const generatedAt = options?.generatedAt ?? formatCaseTimestamp();
  const benchmark = deriveScenarioBenchmark(cases);
  const coverage = deriveClinicalRuleCoverageMatrix(cases);
  const actionQueue = deriveScenarioBenchmarkActionQueue(cases);
  const failedChecks = benchmark.cases.flatMap((item) =>
    item.checks
      .filter((check) => !check.passed)
      .map((check) => ({
        caseId: item.caseId,
        patientLabel: item.patientLabel,
        scenarioClass: item.scenarioClass,
        label: check.label,
        expected: check.expected,
        actual: check.actual
      }))
  );

  return {
    ...buildEvidenceArtifactMetadata({
      artifactType: "aksh-uk-eu-clinical-benchmark-evidence",
      artifactVersion: EVIDENCE_ARTIFACT_VERSIONS.clinicalBenchmarkEvidence,
      generatedAt,
      generatedBy: options?.generatedBy
    }),
    summary: {
      benchmarkedCases: benchmark.total,
      passedCases: benchmark.passed,
      failedCases: benchmark.failed,
      coverageTargets: coverage.totalTargets,
      coveredTargets: coverage.coveredTargets,
      missingCoverageTargets: coverage.missingTargets,
      openBenchmarkActions: actionQueue.total,
      resolvedBenchmarkActions: actionQueue.resolved
    },
    runbook: {
      steps: [...benchmarkRunbookSteps],
      readinessCriteria: [...benchmarkReadinessCriteria],
      failureTriage: benchmarkFailureTriage.map((item) => ({ ...item }))
    },
    benchmark,
    coverage,
    actionQueue,
    failedChecks
  };
}

export type ReturnTypeOfBenchmarkEvidence = ReturnType<typeof buildBenchmarkEvidencePayload>;
