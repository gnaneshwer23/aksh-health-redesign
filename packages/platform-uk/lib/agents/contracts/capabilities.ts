/**
 * Canonical map of the 12 required agentic care capabilities onto EXISTING
 * agents and services. Phase 1 foundation — do not invent parallel agents.
 *
 * Classification mirrors product honesty:
 * - operational: sim-clinic path with APIs/tests/HITL
 * - partially_integrated: built but not on every path / dual stacks
 * - simulated_adapter: explicit mock/synthetic boundary
 * - missing: no meaningful implementation
 */

import type { AgentId } from "../register";

export type PlatformCapabilityId =
  | "patient_intake"
  | "clinical_context"
  | "clinical_documentation"
  | "cds"
  | "medication_safety"
  | "laboratory_intelligence"
  | "care_coordination"
  | "appointment_workflow"
  | "patient_engagement"
  | "guardian_safety"
  | "clinical_evidence_retrieval"
  | "evaluation_quality";

export type CapabilityClassification =
  | "operational"
  | "partially_integrated"
  | "simulated_adapter"
  | "missing";

export type CapabilityAccessBoundary = {
  /** Agents/services may draft only — never finalise clinical records. */
  draftsRequireHitl: true;
  /** No autonomous prescribing or dose change. */
  autonomousPrescribe: false;
  /** No unauthorised live EHR write-back. */
  liveEhrWrite: false;
  /** Deterministic rules and auth cannot be bypassed by agents. */
  mayBypassAuthOrRules: false;
  /** Allowed reader roles for this capability's outputs (product-level). */
  readerRoles: string[];
  /** Roles that may accept/edit/reject drafts. */
  approverRoles: string[];
};

export type PlatformCapability = {
  id: PlatformCapabilityId;
  label: string;
  /** Existing agent ids that own or contribute (no new agents). */
  primaryAgents: AgentId[];
  supportingServices: string[];
  classification: CapabilityClassification;
  evidencePaths: string[];
  access: CapabilityAccessBoundary;
  notes: string;
};

const DEFAULT_ACCESS: CapabilityAccessBoundary = {
  draftsRequireHitl: true,
  autonomousPrescribe: false,
  liveEhrWrite: false,
  mayBypassAuthOrRules: false,
  readerRoles: ["gp", "nurse", "pharmacist", "practice-manager"],
  approverRoles: ["gp", "nurse", "pharmacist"],
};

export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  {
    id: "patient_intake",
    label: "Patient Intake",
    primaryAgents: ["CANVAS", "VOICE"],
    supportingServices: ["lib/intake-generation.ts", "lib/front-desk", "app/api/transcribe"],
    classification: "operational",
    evidencePaths: ["tests/export-mapping.test.ts", "tests/workflow-scenarios.test.ts"],
    access: {
      ...DEFAULT_ACCESS,
      readerRoles: ["gp", "nurse", "practice-manager", "front-desk"],
      approverRoles: ["gp", "nurse"],
    },
    notes: "Deterministic intake + HITL; VOICE/transcribe still partially gated.",
  },
  {
    id: "clinical_context",
    label: "Clinical Context",
    primaryAgents: ["CONDUCTOR", "NEXUS"],
    supportingServices: [
      "lib/context-engine",
      "lib/patient-state",
      "lib/patient-intelligence",
      "app/api/context/package",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/aksh20-intelligence.test.ts", "tests/diabetes-agent-intel-ci20-wiring.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "Signed Context Engine package exists; CONDUCTOR still dual-path with mock patient view.",
  },
  {
    id: "clinical_documentation",
    label: "Clinical Documentation",
    primaryAgents: ["SYNTHESIS", "DrASSIST"],
    supportingServices: ["lib/agents/llm-synthesis.ts", "lib/diabetes-intelligence/agent-intel-draft.ts"],
    classification: "operational",
    evidencePaths: ["tests/clinical-proof-orchestration.test.ts", "tests/review-decision-db.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "SOAP/coding drafts with HITL; ehrWrite:false.",
  },
  {
    id: "cds",
    label: "Clinical Decision Support",
    primaryAgents: ["NEXUS", "CONDUCTOR"],
    supportingServices: [
      "lib/decision",
      "lib/clinical-spine/orchestrate.ts",
      "lib/agents/contracts/run-nexus.ts",
      "lib/disease-modules/diabetes",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/clinical-spine-phase-c.test.ts", "tests/diabetes-agent-intelligence.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "Rules + contracted NEXUS drafts; not a unified live-data CDS product.",
  },
  {
    id: "medication_safety",
    label: "Medication Safety",
    primaryAgents: ["GUARDIAN"],
    supportingServices: [
      "lib/agents/llm-guardian.ts",
      "lib/diabetes-intelligence/medcare-assemble.ts",
      "app/api/patients/[id]/medication-care",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/clinical-proof-orchestration.test.ts"],
    access: {
      ...DEFAULT_ACCESS,
      approverRoles: ["gp", "pharmacist"],
    },
    notes: "DDI/allergy drafts in sim; gateway gates spine/agent-intel enqueue, not every LLM path.",
  },
  {
    id: "laboratory_intelligence",
    label: "Laboratory Intelligence",
    primaryAgents: ["NEXUS", "HORIZON"],
    supportingServices: [
      "lib/labs",
      "lib/disease-modules/diabetes",
      "lib/connector/fhir.ts",
      "lib/e2e/lab-sim.ts",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/lab-agents.test.ts", "tests/lab-results-db.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "Strong rule layer + connector ingest; lab orders remain simulated (lab-sim).",
  },
  {
    id: "care_coordination",
    label: "Care Coordination",
    primaryAgents: ["PATHWAY", "CONDUCTOR"],
    supportingServices: [
      "app/api/agents/pathway",
      "lib/diabetes-intelligence/connected-journey-orchestrate.ts",
      "lib/diabetes-intelligence/continuous-care-assemble.ts",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/connected-diabetes-orchestration.test.ts", "tests/connected-journey-steps.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "Referral drafts + journey/ops worklists; synthetic/HITL only.",
  },
  {
    id: "appointment_workflow",
    label: "Appointment Workflow",
    primaryAgents: ["CONDUCTOR"],
    supportingServices: [
      "lib/access/service.ts",
      "lib/front-desk/calendar.ts",
      "lib/connector/service.ts",
      "db/migrations/026_schedule_connector.sql",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/patient-access-negative-db.test.ts"],
    access: {
      ...DEFAULT_ACCESS,
      readerRoles: ["gp", "nurse", "practice-manager", "front-desk"],
      approverRoles: ["gp", "nurse", "practice-manager"],
    },
    notes: "Slot-fill production path; partner schedule connector read-only; no live write booking.",
  },
  {
    id: "patient_engagement",
    label: "Patient Engagement",
    primaryAgents: ["CANVAS"],
    supportingServices: [
      "lib/patient-access",
      "app/api/chat/patient",
      "app/api/patients/[id]/check-in",
      "app/api/patients/[id]/diabetes-coaching",
    ],
    classification: "simulated_adapter",
    evidencePaths: ["tests/patient-access-diabetes.test.ts", "tests/connected-patient-api-access.test.ts"],
    access: {
      ...DEFAULT_ACCESS,
      readerRoles: ["patient", "gp", "nurse"],
      approverRoles: ["gp", "nurse", "patient"],
    },
    notes: "Synthetic patient-access transport; HITL outreach only.",
  },
  {
    id: "guardian_safety",
    label: "Guardian Safety",
    primaryAgents: ["GUARDIAN", "SHIELD"],
    supportingServices: ["lib/guardian-gateway", "lib/clinical-spine/safety-route.ts", "lib/shield-client.ts"],
    classification: "partially_integrated",
    evidencePaths: [
      "tests/diabetes-agent-intel-ci20-wiring.test.ts",
      "tests/clinical-proof-shield.test.ts",
    ],
    access: DEFAULT_ACCESS,
    notes: "Gateway real on CI 2.0 paths; legacy GUARDIAN draft agent remains separate.",
  },
  {
    id: "clinical_evidence_retrieval",
    label: "Clinical Evidence / Retrieval",
    primaryAgents: ["NEXUS"],
    supportingServices: ["lib/graphrag/retrieve.ts", "lib/neo4j", "lib/context-engine/assemble.ts"],
    classification: "partially_integrated",
    evidencePaths: ["tests/aksh20-intelligence.test.ts"],
    access: DEFAULT_ACCESS,
    notes: "Fixture/mock-heavy when Neo4j Aura paused (dataSource: mock).",
  },
  {
    id: "evaluation_quality",
    label: "Evaluation / Quality",
    primaryAgents: ["SHIELD", "COMPASS"],
    supportingServices: [
      "lib/evaluation-engine",
      "lib/eval",
      "lib/agents/readiness.ts",
      "lib/repositories/governed-evaluation-repository.ts",
    ],
    classification: "partially_integrated",
    evidencePaths: ["tests/aksh20-intelligence.test.ts", "tests/agent-register.test.ts"],
    access: {
      ...DEFAULT_ACCESS,
      readerRoles: ["gp", "practice-manager", "researcher"],
      approverRoles: ["practice-manager"],
    },
    notes: "Offline gates/tests; not production release enforcement on all agents.",
  },
];

export function getCapability(id: PlatformCapabilityId): PlatformCapability {
  const found = PLATFORM_CAPABILITIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown capability: ${id}`);
  return found;
}

export function listCapabilitiesByClassification(
  classification: CapabilityClassification
): PlatformCapability[] {
  return PLATFORM_CAPABILITIES.filter((c) => c.classification === classification);
}

export function capabilitySummaryTable(): Array<{
  id: PlatformCapabilityId;
  label: string;
  classification: CapabilityClassification;
  primaryAgents: AgentId[];
}> {
  return PLATFORM_CAPABILITIES.map((c) => ({
    id: c.id,
    label: c.label,
    classification: c.classification,
    primaryAgents: c.primaryAgents,
  }));
}
