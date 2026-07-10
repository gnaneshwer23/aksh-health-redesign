import { buildExportResources, buildValidationIssues } from "../export-mapping";
import { deriveSyntheticOutcomeCapture } from "../outcome-capture";
import { formatCaseTimestamp } from "../time-format";
import type { ReviewCase, SourceTraceStep } from "../types";
import { deriveDataCollectionProfile } from "./data-collection";
import {
  deriveAcceptanceBlockers,
  deriveClinicalConcerns,
  deriveFinalizationState,
  deriveSafetyFlags
} from "./safety";
import {
  deriveStreamTransitionChecklist,
  deriveValidationHistory,
  deriveValidationProtocol,
  deriveValidationReadinessFromInputs
} from "./validation";

export function buildEvidencePayload(reviewCase: ReviewCase) {
  const artifact = reviewCase.frozenArtifact;
  const safetyFlags = artifact?.safetyFlags ?? deriveSafetyFlags(reviewCase);
  const blockers = artifact?.acceptanceBlockers ?? deriveAcceptanceBlockers(reviewCase);
  const sourceTrace = artifact?.sourceTrace ?? buildSourceTrace(reviewCase);
  const validationIssues = artifact?.validationIssues ?? buildValidationIssues(reviewCase.draft);
  const finalizationState = artifact?.finalizationState ?? deriveFinalizationState(reviewCase);
  const dataCollectionProfile = artifact?.dataCollectionProfile ?? reviewCase.dataCollectionProfile ?? deriveDataCollectionProfile(reviewCase);
  const clinicalConcerns = artifact
    ? [
        ...artifact.acceptanceBlockers.map((detail, index) => ({
          id: `artifact-blocker-${index}`,
          label: "Finalization blocker",
          detail,
          severity: "high" as const,
          source: "blocker" as const
        })),
        ...artifact.safetyFlags.map((flag) => ({
          id: flag.id,
          label: flag.label,
          detail: flag.detail,
          severity: flag.severity,
          source: "safety" as const
        })),
        ...artifact.validationIssues.map((issue) => ({
          id: issue.id,
          label: issue.label,
          detail: issue.detail,
          severity: issue.severity,
          source: "validation" as const
        }))
      ]
    : deriveClinicalConcerns(reviewCase);
  const draft = artifact?.draft ?? reviewCase.draft;
  const exportedResources =
    artifact?.exportedResources?.summary
      ? artifact.exportedResources
      : buildExportResources(draft, {
          caseId: reviewCase.id,
          timestamp: artifact?.frozenAt ?? reviewCase.updatedAt,
          validationIssues
        });
  const fieldChanges = artifact?.fieldChanges ?? reviewCase.fieldChanges ?? [];
  const generationTrace = artifact?.generationTrace ?? reviewCase.generationTrace ?? [];
  const activityTimeline = artifact?.activityTimeline ?? reviewCase.auditEvents;
  const reviewSummary = artifact?.reviewSummary ?? reviewCase.reviewSummary ?? {};
  const validationReadiness = deriveValidationReadinessFromInputs(
    dataCollectionProfile,
    blockers,
    clinicalConcerns,
    finalizationState
  );
  const transitionChecklist = deriveStreamTransitionChecklist(reviewCase);
  const validationProtocol = deriveValidationProtocol(reviewCase);
  const validationHistory = artifact?.validationHistory ?? reviewCase.validationHistory ?? [];

  return {
    caseId: reviewCase.id,
    syntheticOnly: true,
    integrationMode: "synthetic_evidence" as const,
    patientLabel: reviewCase.patientLabel,
    status: reviewCase.status,
    updatedAt: reviewCase.updatedAt,
    artifactState: artifact ? "frozen" : "live",
    frozenAt: artifact?.frozenAt ?? null,
    frozenBy: artifact?.frozenBy ?? null,
    summary: reviewCase.summary,
    reviewSummary,
    humanGateDecisions: artifact?.humanGateDecisions ?? reviewCase.humanGateDecisions ?? [],
    meetingOutcome: artifact?.meetingOutcome ?? reviewCase.meetingOutcome ?? null,
    input: reviewCase.input,
    dataCollectionProfile,
    validationReadiness,
    validationProtocol,
    validationHistory,
    outcomeCapture: deriveSyntheticOutcomeCapture(reviewCase),
    transitionChecklist,
    finalizationState,
    draft,
    sourceTrace,
    generationTrace,
    exportedResources,
    clinicalConcerns,
    safetyFlags,
    acceptanceBlockers: blockers,
    validationIssues,
    fieldChanges,
    activityTimeline,
    fhirAuditEvents: reviewCase.fhirAuditEvents ?? []
  };
}

export function buildSourceTrace(reviewCase: ReviewCase): SourceTraceStep[] {
  return [
    {
      step: "Source input captured",
      detail: `${reviewCase.input.sourceType} captured at ${reviewCase.input.capturedAt}.`
    },
    {
      step: "Input summarized",
      detail: reviewCase.input.summary
    },
    {
      step: "Structured draft generated",
      detail: `Encounter, condition, ${reviewCase.draft.medicationRequest ? "medication request, " : ""}and ${reviewCase.draft.observations.length} observations prepared for reviewer validation.`
    },
    {
      step: "Safety evaluation applied",
      detail: `${deriveSafetyFlags(reviewCase).length} safety flags derived from source confidence, medication context, and structured completeness.`
    },
    {
      step: "Reviewer workflow applied",
      detail: reviewCase.reviewSummary?.lastDecision
        ? `Last decision: ${reviewCase.reviewSummary.lastDecision} by ${reviewCase.reviewSummary.lastReviewer ?? "reviewer"}`
        : "No final reviewer decision recorded yet."
    }
  ];
}

export function createFrozenArtifact(reviewCase: ReviewCase, options?: { frozenAt?: string; frozenBy?: string }) {
  const frozenAt = options?.frozenAt ?? formatCaseTimestamp();
  const frozenBy = options?.frozenBy ?? reviewCase.reviewSummary?.lastReviewer ?? "Reviewer";
  const workingCase: ReviewCase = {
    ...reviewCase,
    updatedAt: frozenAt,
    reviewSummary: {
      ...reviewCase.reviewSummary,
      lastReviewer: frozenBy,
      lastDecision: reviewCase.reviewSummary?.lastDecision ?? "accept",
      lastDecisionAt: reviewCase.reviewSummary?.lastDecisionAt ?? frozenAt
    }
  };

  return {
    frozenAt,
    frozenBy,
    draft: workingCase.draft,
    dataCollectionProfile: workingCase.dataCollectionProfile ?? deriveDataCollectionProfile(workingCase),
    reviewSummary: workingCase.reviewSummary ?? {},
    humanGateDecisions: workingCase.humanGateDecisions ?? [],
    meetingOutcome: workingCase.meetingOutcome,
    finalizationState: deriveFinalizationState(workingCase),
    safetyFlags: deriveSafetyFlags(workingCase),
    acceptanceBlockers: deriveAcceptanceBlockers(workingCase),
    fieldChanges: workingCase.fieldChanges ?? [],
    generationTrace: workingCase.generationTrace ?? [],
    activityTimeline: workingCase.auditEvents,
    sourceTrace: buildSourceTrace(workingCase),
    exportedResources: (() => {
      const bundle = buildExportResources(workingCase.draft, {
        caseId: workingCase.id,
        timestamp: frozenAt
      });
      const auditEntries = (workingCase.fhirAuditEvents ?? []).map((event) => ({
        fullUrl: `urn:uuid:AuditEvent-${event.id}`,
        resource: event
      }));
      return {
        ...bundle,
        entry: [...bundle.entry, ...auditEntries],
        summary: {
          ...bundle.summary,
          resourceCount: bundle.summary.resourceCount + auditEntries.length,
          resourceTypes: [...bundle.summary.resourceTypes, ...auditEntries.map(() => "AuditEvent")]
        }
      };
    })(),
    validationIssues: buildValidationIssues(workingCase.draft),
    validationHistory: workingCase.validationHistory ?? [],
    remediationActionResolutions: workingCase.remediationActionResolutions ?? [],
    benchmarkActionResolutions: workingCase.benchmarkActionResolutions ?? []
  };
}

export function normalizeReviewCaseForPersistence(reviewCase: ReviewCase) {
  const reviewCaseWithHistory = {
    ...reviewCase,
    validationHistory: deriveValidationHistory(reviewCase)
  };

  if (reviewCase.status === "accepted") {
    return {
      ...reviewCaseWithHistory,
      frozenArtifact: createFrozenArtifact(reviewCaseWithHistory, {
        frozenAt: reviewCaseWithHistory.reviewSummary?.lastDecisionAt ?? reviewCaseWithHistory.updatedAt,
        frozenBy: reviewCaseWithHistory.reviewSummary?.lastReviewer
      })
    };
  }

  if (!reviewCase.frozenArtifact) {
    return reviewCaseWithHistory;
  }

  return {
    ...reviewCaseWithHistory,
    frozenArtifact: undefined
  };
}
