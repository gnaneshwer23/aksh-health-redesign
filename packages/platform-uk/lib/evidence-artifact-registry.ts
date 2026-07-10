import {
  buildEvidenceArtifactMetadata,
  EVIDENCE_ARTIFACT_VERSIONS
} from "./evidence-artifact-metadata";
import type { ReviewCase } from "./types";
import {
  buildEvidencePayload,
  deriveClinicalRuleResults,
  deriveFinalizationState,
  formatCaseTimestamp
} from "./workflow";

export function buildCaseEvidenceArtifact(reviewCase: ReviewCase, options?: { generatedAt?: string }) {
  const evidence = buildEvidencePayload(reviewCase);
  const clinicalRules = deriveClinicalRuleResults(reviewCase);
  const finalizationState = evidence.finalizationState ?? deriveFinalizationState(reviewCase);

  return {
    artifactId: `case-evidence-${reviewCase.id}`,
    artifactType: "case_review_evidence" as const,
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    generatedAt: options?.generatedAt ?? formatCaseTimestamp(),
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    status: reviewCase.status,
    finalizationState,
    artifactState: evidence.artifactState,
    reviewSummary: evidence.reviewSummary,
    safetyFlagCount: evidence.safetyFlags.length,
    blockerCount: evidence.acceptanceBlockers.length,
    validationIssueCount: evidence.validationIssues.length,
    clinicalRuleSummary: {
      total: clinicalRules.length,
      cannotFinalize: clinicalRules.filter((rule) => rule.finalizationImpact === "cannot_finalize").length,
      warnings: clinicalRules.filter((rule) => rule.finalizationImpact === "warning").length,
      medicationRisk: clinicalRules.filter((rule) => rule.category === "medication_risk").length,
      missingData: clinicalRules.filter((rule) => rule.category === "missing_data").length,
      sourceQuality: clinicalRules.filter((rule) => rule.category === "source_quality").length,
      escalation: clinicalRules.filter((rule) => rule.category === "escalation").length
    },
    evidence
  };
}

export function buildEvidenceArtifactRegistry(cases: ReviewCase[], options?: { generatedAt?: string; generatedBy?: string }) {
  const generatedAt = options?.generatedAt ?? formatCaseTimestamp();
  const artifacts = cases.map((reviewCase) => buildCaseEvidenceArtifact(reviewCase, { generatedAt }));
  const frozenArtifacts = artifacts.filter((artifact) => artifact.artifactState === "frozen");
  const blockedArtifacts = artifacts.filter((artifact) => artifact.finalizationState === "blocked");
  const warningArtifacts = artifacts.filter((artifact) => artifact.finalizationState === "warn");

  return {
    ...buildEvidenceArtifactMetadata({
      artifactType: "aksh-uk-eu-evidence-artifact-registry",
      artifactVersion: EVIDENCE_ARTIFACT_VERSIONS.evidenceArtifactRegistry,
      generatedAt,
      generatedBy: options?.generatedBy
    }),
    summary: {
      totalArtifacts: artifacts.length,
      frozenArtifacts: frozenArtifacts.length,
      liveDraftArtifacts: artifacts.length - frozenArtifacts.length,
      blockedArtifacts: blockedArtifacts.length,
      warningArtifacts: warningArtifacts.length,
      readyArtifacts: artifacts.filter((artifact) => artifact.finalizationState === "ready").length,
      cannotFinalizeRules: artifacts.reduce((total, artifact) => total + artifact.clinicalRuleSummary.cannotFinalize, 0),
      warningRules: artifacts.reduce((total, artifact) => total + artifact.clinicalRuleSummary.warnings, 0)
    },
    registryPolicy: {
      sourceOfTruth: "Current persisted synthetic review-case JSON state.",
      frozenArtifactRule: "Accepted cases should use the frozen artifact snapshot for evidence and export payloads.",
      liveDraftRule: "Pending, deferred, and rejected cases are review evidence only and should not be described as production clinical records.",
      integrationBoundary: "Registry artifacts are synthetic proof artifacts unless integration flags are explicitly enabled."
    },
    artifacts
  };
}

export type EvidenceArtifactRegistry = ReturnType<typeof buildEvidenceArtifactRegistry>;
