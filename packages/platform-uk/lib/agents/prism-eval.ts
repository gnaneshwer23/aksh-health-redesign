/**
 * P4-PRISM-01 — imaging intelligence L1–L2 scaffold.
 * Runnable synthetic/fixture eval path with Guardian + human-review hooks.
 * Never claims live imaging deployment, pixel archive, or EHR write.
 */

import type { ClinicalContextPackage } from "@/lib/context-engine/types";
import { evaluateGuardianGateway } from "@/lib/guardian-gateway";
import { mayEnqueueAgentDraft } from "@/lib/workflow/review-queue";

import { runContractedPrism, type PrismContractedResult } from "./contracts/run-prism";

export type PrismHumanReviewHook = {
  required: true;
  reviewerRole: "gp" | "radiologist_proxy_gp";
  enqueueAllowed: boolean;
  reason: string;
  draftKind: "imaging_intelligence_eval";
  ehrWrite: false;
  wiredToConductor: false;
};

export type PrismEvalRun = {
  agentId: "PRISM";
  maturityClaim: "L2_scaffold";
  result: PrismContractedResult;
  guardian: ReturnType<typeof evaluateGuardianGateway>;
  humanReview: PrismHumanReviewHook;
  honesty: {
    live: false;
    liveImagingDeployment: false;
    wiredToConductor: false;
    ehrWrite: false;
    autonomousPrescribe: false;
  };
};

function syntheticContext(patientId: string): ClinicalContextPackage {
  const now = new Date().toISOString();
  return {
    schemaVersion: "aksh-context-1.0",
    contextId: `prism-eval-${patientId}`,
    assembledAt: now,
    purpose: "clinical_decision_support",
    liveEmis: false,
    patient_context: { patientId, label: `Synthetic ${patientId}` },
    encounter_context: { lastEncounterDate: null, nextAppointmentDate: null },
    clinical_history: { conditions: ["Suspected DVT (synthetic)"], flags: [] },
    conditions: ["Suspected DVT (synthetic)"],
    medications: [],
    allergies: [],
    observations: [],
    laboratory_results: [],
    procedures: [],
    relevant_guidelines: [],
    evidence: [
      {
        id: "prism-fixture-ev-1",
        title: "Imaging meta stub",
        kind: "fact",
        citation: "imaging_dicom_meta_stub",
        provenance: "fixture",
      },
    ],
    risk_factors: [],
    missing_information: ["Confirmed imaging report text"],
    uncertainties: ["Metadata-only path cannot replace clinician imaging review"],
    provenance: [{ field: "conditions", source: "prism_eval_fixture", timestamp: now }],
    dataSource: "mock",
  };
}

export function runPrismEval(input?: { patientId?: string; query?: string }): PrismEvalRun {
  const patientId = input?.patientId ?? "SYNTH-PRISM-001";
  const context = syntheticContext(patientId);
  const result = runContractedPrism({ patientId, context, query: input?.query });

  const guardian = evaluateGuardianGateway({
    context,
    agentOutput: {
      findings: result.findings,
      evidence: result.evidence,
      uncertainties: result.uncertainties,
      escalation: result.escalation,
      prohibitedDetected: result.prohibitedDetected,
    },
    environment: "synthetic",
    modelId: "aksh-prism-synthetic-v1",
    userText: input?.query,
  });

  const enqueueAllowed = mayEnqueueAgentDraft(guardian.output_status);

  return {
    agentId: "PRISM",
    maturityClaim: "L2_scaffold",
    result,
    guardian,
    humanReview: {
      required: true,
      reviewerRole: "gp",
      enqueueAllowed,
      reason: enqueueAllowed
        ? "Guardian did not BLOCK — draft may be offered for human review (not auto-accepted; not CONDUCTOR-wired)."
        : "Guardian BLOCK — imaging eval draft must not enter a review queue.",
      draftKind: "imaging_intelligence_eval",
      ehrWrite: false,
      wiredToConductor: false,
    },
    honesty: {
      live: false,
      liveImagingDeployment: false,
      wiredToConductor: false,
      ehrWrite: false,
      autonomousPrescribe: false,
    },
  };
}
