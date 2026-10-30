/**
 * P4-ATLAS-01 — clinical research intelligence L1–L2 scaffold.
 * Retrieval/eval harness on controlled synthetic protocol + cohort data.
 * No unapproved clinical enablement, no patient-level export, no EHR write.
 */

import type { ClinicalContextPackage } from "@/lib/context-engine/types";
import { evaluateGuardianGateway } from "@/lib/guardian-gateway";
import { mayEnqueueAgentDraft } from "@/lib/workflow/review-queue";

import { runContractedAtlas, type AtlasContractedResult } from "./contracts/run-atlas";

export type AtlasHumanReviewHook = {
  required: true;
  reviewerRole: "researcher" | "gp";
  enqueueAllowed: boolean;
  reason: string;
  draftKind: "clinical_research_eval";
  ehrWrite: false;
  clinicalEnablementApproved: false;
  wiredToConductor: false;
};

export type AtlasEvalRun = {
  agentId: "ATLAS";
  maturityClaim: "L2_scaffold";
  result: AtlasContractedResult;
  guardian: ReturnType<typeof evaluateGuardianGateway>;
  humanReview: AtlasHumanReviewHook;
  honesty: {
    live: false;
    clinicalEnablementApproved: false;
    wiredToConductor: false;
    ehrWrite: false;
    patientLevelExport: false;
    autonomousPrescribe: false;
  };
};

function syntheticResearchContext(patientId: string): ClinicalContextPackage {
  const now = new Date().toISOString();
  return {
    schemaVersion: "aksh-context-1.0",
    contextId: `atlas-eval-${patientId}`,
    assembledAt: now,
    purpose: "clinical_decision_support",
    liveEmis: false,
    patient_context: { patientId, label: `Synthetic research ${patientId}` },
    encounter_context: { lastEncounterDate: null, nextAppointmentDate: null },
    clinical_history: { conditions: ["Type 2 diabetes mellitus (synthetic)"], flags: [] },
    conditions: ["Type 2 diabetes mellitus (synthetic)"],
    medications: ["Metformin 500mg (synthetic)"],
    allergies: [],
    observations: [],
    laboratory_results: [{ name: "HbA1c", value: "58 mmol/mol", recordedAt: now }],
    procedures: [],
    relevant_guidelines: [],
    evidence: [
      {
        id: "atlas-fixture-ev-1",
        title: "Synthetic protocol eligibility fixture",
        kind: "fact",
        citation: "atlas-protocol-t2d-cv-001",
        provenance: "fixture",
      },
    ],
    risk_factors: [],
    missing_information: ["Ethics gate for live recruitment"],
    uncertainties: ["Matching is evaluation-only on controlled data"],
    provenance: [{ field: "conditions", source: "atlas_eval_fixture", timestamp: now }],
    dataSource: "mock",
  };
}

export function runAtlasEval(input?: { patientId?: string; query?: string }): AtlasEvalRun {
  const patientId = input?.patientId ?? "SYNTH-ATLAS-001";
  const context = syntheticResearchContext(patientId);
  const result = runContractedAtlas({ context, query: input?.query });

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
    modelId: "aksh-atlas-synthetic-v1",
    userText: input?.query,
  });

  const enqueueAllowed = mayEnqueueAgentDraft(guardian.output_status);

  return {
    agentId: "ATLAS",
    maturityClaim: "L2_scaffold",
    result,
    guardian,
    humanReview: {
      required: true,
      reviewerRole: "researcher",
      enqueueAllowed,
      reason: enqueueAllowed
        ? "Guardian did not BLOCK — research eval draft may be offered for human review (no clinical enablement)."
        : "Guardian BLOCK — research eval draft must not enter a review queue.",
      draftKind: "clinical_research_eval",
      ehrWrite: false,
      clinicalEnablementApproved: false,
      wiredToConductor: false,
    },
    honesty: {
      live: false,
      clinicalEnablementApproved: false,
      wiredToConductor: false,
      ehrWrite: false,
      patientLevelExport: false,
      autonomousPrescribe: false,
    },
  };
}
