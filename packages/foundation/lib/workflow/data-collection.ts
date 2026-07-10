import type { DataCollectionProfile, ReviewCase } from "../types";
import { deriveFinalizationState } from "./safety";

export function deriveDataCollectionProfile(reviewCase: ReviewCase): DataCollectionProfile {
  const finalizationState = deriveFinalizationState(reviewCase);
  const hasDecision = Boolean(reviewCase.reviewSummary?.lastDecision);
  const hasBlockingIssues = finalizationState === "blocked";
  const isAccepted = reviewCase.status === "accepted";

  if (isAccepted) {
    return {
      provenance: "rwe_candidate",
      datasetLabel: "Aksh UK synthetic validation cohort",
      ingestionStatus: "rwe_ready",
      validationStream: "rwe_pipeline_candidate",
      safetyGovernance: "safety_case_candidate",
      trainingReadiness: "training_not_needed",
      collectionNotes: [
        "Accepted case is suitable for downstream evidence packaging and RWE pipeline rehearsal.",
        "Reviewer rationale, checklist evidence, and export bundle are preserved for safety-case alignment."
      ]
    };
  }

  if (hasBlockingIssues) {
    return {
      provenance: "synthetic_sandbox",
      datasetLabel: "Aksh UK Synthea-like sandbox cohort",
      ingestionStatus: "draft_only",
      validationStream: "phase_1_remediation",
      safetyGovernance: "hazard_review_required",
      trainingReadiness: "training_required",
      collectionNotes: [
        "Case remains in the synthetic remediation stream until the blocking clinical issues are resolved.",
        "Use for Phase 1 validation remediation and hazard-review preparation before pilot reuse."
      ]
    };
  }

  if (hasDecision || finalizationState === "ready" || finalizationState === "warn") {
    return {
      provenance: "pilot_candidate",
      datasetLabel: "Aksh UK synthetic pilot-prep cohort",
      ingestionStatus: "pilot_ready",
      validationStream: "ics_pilot_preparation",
      safetyGovernance: hasBlockingIssues ? "hazard_review_required" : "hazard_review_in_progress",
      trainingReadiness: "training_ready",
      collectionNotes: [
        "Case is positioned for synthetic pilot rehearsal and clinician training flows.",
        "Use this cohort to support pilot-site walk-throughs before live EMIS/SystmOne integration."
      ]
    };
  }

  return {
    provenance: "synthetic_sandbox",
    datasetLabel: "Aksh UK Synthea-like sandbox cohort",
    ingestionStatus: "draft_only",
    validationStream: hasBlockingIssues ? "phase_1_remediation" : "phase_1_synthetic",
    safetyGovernance: "hazard_review_required",
    trainingReadiness: "training_required",
    collectionNotes: [
      "Case currently belongs to the synthetic validation stream described in the 12-month roadmap.",
      "Use for Phase 1 validation, safety remediation, and data-lake style ingestion rehearsal before pilot use."
    ]
  };
}

export function deriveDataCollectionAnalytics(cases: ReviewCase[]) {
  const streamCounts = new Map<DataCollectionProfile["validationStream"], number>();
  const governanceCounts = new Map<DataCollectionProfile["safetyGovernance"], number>();
  const trainingCounts = new Map<DataCollectionProfile["trainingReadiness"], number>();

  for (const item of cases) {
    const profile = item.dataCollectionProfile ?? deriveDataCollectionProfile(item);
    streamCounts.set(profile.validationStream, (streamCounts.get(profile.validationStream) ?? 0) + 1);
    governanceCounts.set(profile.safetyGovernance, (governanceCounts.get(profile.safetyGovernance) ?? 0) + 1);
    trainingCounts.set(profile.trainingReadiness, (trainingCounts.get(profile.trainingReadiness) ?? 0) + 1);
  }

  return {
    streamCounts: {
      phase_1_synthetic: streamCounts.get("phase_1_synthetic") ?? 0,
      phase_1_remediation: streamCounts.get("phase_1_remediation") ?? 0,
      ics_pilot_preparation: streamCounts.get("ics_pilot_preparation") ?? 0,
      rwe_pipeline_candidate: streamCounts.get("rwe_pipeline_candidate") ?? 0
    },
    governanceCounts: {
      hazard_review_required: governanceCounts.get("hazard_review_required") ?? 0,
      hazard_review_in_progress: governanceCounts.get("hazard_review_in_progress") ?? 0,
      safety_case_candidate: governanceCounts.get("safety_case_candidate") ?? 0
    },
    trainingCounts: {
      training_required: trainingCounts.get("training_required") ?? 0,
      training_ready: trainingCounts.get("training_ready") ?? 0,
      training_not_needed: trainingCounts.get("training_not_needed") ?? 0
    }
  };
}
