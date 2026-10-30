/**
 * Phase 2 / P4 roadmap-agent capability status — honesty source of truth.
 *
 * PRISM and ATLAS ship an L1–L2 scaffold (typed contracts + synthetic eval
 * harness + Guardian/HITL hooks). They remain:
 *   - live: false
 *   - wiredToConductor: false (do not duplicate / join CONDUCTOR loop)
 *   - no live imaging deployment / no unapproved clinical enablement
 *
 * Hard invariant: no code path in this file can flip live, liveImagingDeployment,
 * clinicalEnablementApproved, or ehrWrite to true.
 */

export type Phase2AgentId = "PRISM" | "ATLAS";

export type Phase2Maturity = "L0_planned" | "L1_honesty" | "L2_scaffold";

export type Phase2CapabilityStatus = {
  agentId: Phase2AgentId;
  label: string;
  category: string;
  phase: 2;
  live: false;
  /** True when a runnable synthetic/fixture eval path exists (P4 scaffold). */
  scaffoldBuilt: true;
  /** Legacy alias: production product build — still false until release criteria. */
  built: false;
  /** Never auto-run by CONDUCTOR; on-request eval only. */
  wired: false;
  wiredToConductor: false;
  ehrWrite: false;
  maturity: Phase2Maturity;
  description: string;
  notProductionReason: string;
  roadmapNote: string;
  evidencePaths: string[];
};

const ROADMAP_NOTE =
  "P4 scaffold only — synthetic/controlled evaluation paths. Build production capability only against a concrete, funded use case (docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-1 / AGENT_IMPLEMENTATION_ROADMAP P4).";

export function getPrismCapabilityStatus(): Phase2CapabilityStatus {
  return {
    agentId: "PRISM",
    label: "PRISM",
    category: "Imaging Intelligence Agent",
    phase: 2,
    live: false,
    scaffoldBuilt: true,
    built: false,
    wired: false,
    wiredToConductor: false,
    ehrWrite: false,
    maturity: "L2_scaffold",
    description:
      "L2 scaffold: typed PRISM contract, synthetic DICOM-metadata fixture eval, Guardian + human-review hooks. No live PACS, no pixel archive, no imaging deployment claim.",
    notProductionReason:
      "Scaffold is evaluation-only. liveImagingDeployment remains false; not wired into CONDUCTOR; no EHR write.",
    roadmapNote: ROADMAP_NOTE,
    evidencePaths: [
      "tests/p4-prism-atlas-scaffold.test.ts",
      "lib/agents/contracts/run-prism.ts",
      "lib/agents/prism-eval.ts",
    ],
  };
}

export function getAtlasCapabilityStatus(): Phase2CapabilityStatus {
  return {
    agentId: "ATLAS",
    label: "ATLAS",
    category: "Clinical Research Agent",
    phase: 2,
    live: false,
    scaffoldBuilt: true,
    built: false,
    wired: false,
    wiredToConductor: false,
    ehrWrite: false,
    maturity: "L2_scaffold",
    description:
      "L2 scaffold: typed ATLAS contract, controlled protocol/cohort fixture eval, Guardian + human-review hooks. Distinct from federated-research ethics stub. No unapproved clinical enablement or patient-level export.",
    notProductionReason:
      "Scaffold is evaluation-only. clinicalEnablementApproved remains false; not wired into CONDUCTOR; no EHR write.",
    roadmapNote: ROADMAP_NOTE,
    evidencePaths: [
      "tests/p4-prism-atlas-scaffold.test.ts",
      "lib/agents/contracts/run-atlas.ts",
      "lib/agents/atlas-eval.ts",
    ],
  };
}

export function getPhase2AgentCapabilityStatus() {
  return {
    artifactType: "aksh-phase2-agent-capability-status",
    generatedAt: new Date().toISOString(),
    agents: [getPrismCapabilityStatus(), getAtlasCapabilityStatus()],
    invariants: {
      live: false as const,
      built: false as const,
      wiredToConductor: false as const,
      ehrWrite: false as const,
      liveImagingDeployment: false as const,
      clinicalEnablementApproved: false as const,
    },
    notes: [
      ROADMAP_NOTE,
      "scaffoldBuilt:true means L2 eval harness exists — not production go-live.",
      "Neither PRISM nor ATLAS appears in CONDUCTOR REVIEW_ORDER / LOOP clinician path as an auto actor.",
      "This status is informational only — it does not enable live imaging or research recruitment.",
    ],
  };
}

export type Phase2AgentCapabilityStatusResponse = ReturnType<typeof getPhase2AgentCapabilityStatus>;
