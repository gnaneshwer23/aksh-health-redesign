import { formatCaseTimestamp } from "./workflow";

export const EVIDENCE_ARTIFACT_SCHEMA_VERSION = "2026.05.1";

export const EVIDENCE_ARTIFACT_VERSIONS = {
  caseValidationDossier: "1.0.0",
  boardPackEvidence: "1.0.0",
  caseReviewEvidence: "1.0.0",
  clinicalBenchmarkEvidence: "1.1.0",
  evidenceReadiness: "1.1.0",
  evidenceArtifactRegistry: "1.1.0"
} as const;

export type EvidenceArtifactBoundaries = {
  syntheticOnly: true;
  productionClinicalSoftware: false;
  liveNhsIntegration: false;
  realPatientData: false;
};

export function buildEvidenceArtifactBoundaries(): EvidenceArtifactBoundaries {
  return {
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    realPatientData: false
  };
}

export function buildEvidenceArtifactMetadata(input: {
  artifactType: string;
  artifactVersion: string;
  generatedAt?: string;
  generatedBy?: string;
  scopeKey?: string;
  subjectCaseId?: string;
}) {
  return {
    artifactSchemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    artifactType: input.artifactType,
    artifactVersion: input.artifactVersion,
    generatedAt: input.generatedAt ?? formatCaseTimestamp(),
    generatedBy: input.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    scopeKey: input.scopeKey,
    subjectCaseId: input.subjectCaseId,
    ...buildEvidenceArtifactBoundaries()
  };
}
