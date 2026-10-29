/**
 * Assemble Phase 5 agent intelligence snapshots, orchestration runs, and HITL.
 */

import { randomUUID } from "crypto";

import { AGENTS } from "../agents/register";
import { getPatientById } from "../mock-data";
import { buildSharedPatientContext } from "./agent-intel-context";
import { draftAllKindsForPatient } from "./agent-intel-draft";
import { AGENT_INTEL_EVAL_CASES, runAgentIntelEvalSuite } from "./agent-intel-eval";
import {
  decideAgentIntelDraft,
  listAllOpenDrafts,
  listDrafts,
  listHistory,
  listRuns,
  replacePatientAgentIntelSeed,
} from "./agent-intel-repository";
import type {
  AgentIntelDecisionAction,
  AgentIntelOrchestrationRun,
  AgentIntelSnapshot,
  AgentIntelWorklistItem,
  StructuredDraftPayload,
} from "./agent-intel-types";
import type { MissingDataIndicator } from "./types";
import {
  ACTIVE_AGENT_INTEL_VERSION,
  AGENT_INTEL_VERSION_REGISTRY,
} from "./agent-intel-versions";

function patientLabel(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

function assessMissing(draftCount: number, openHitl: number): MissingDataIndicator[] {
  const missing: MissingDataIndicator[] = [];
  if (draftCount === 0) {
    missing.push({
      code: "agent_intel_none",
      message: "No agent intelligence drafts — run orchestration / seed",
      field: "drafts",
    });
  }
  if (openHitl > 0) {
    missing.push({
      code: "agent_intel_hitl_pending",
      message: `${openHitl} AI draft(s) awaiting clinician Accept/Edit/Reject`,
      field: "drafts",
    });
  }
  return missing;
}

export async function buildAgentIntelligence(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AgentIntelSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const sharedContext = buildSharedPatientContext(patientId);
  const [drafts, runs, history] = await Promise.all([
    listDrafts(patientId, { scopeKey }),
    listRuns(patientId, { scopeKey }),
    listHistory(patientId, { scopeKey }),
  ]);
  const openHitl = drafts.filter((d) => d.status === "DRAFT" || d.status === "queued").length;
  const evalResults = runAgentIntelEvalSuite();

  return {
    patientId,
    patientLabel: sharedContext.patientLabel,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    capabilityStatus: "synthetic_demo",
    sharedContext,
    versionRegistry: AGENT_INTEL_VERSION_REGISTRY,
    activeVersionPin: ACTIVE_AGENT_INTEL_VERSION,
    drafts,
    orchestrationRuns: runs,
    decisionHistory: history,
    evalSuite: {
      cases: AGENT_INTEL_EVAL_CASES,
      lastResults: evalResults,
    },
    distinctionNote:
      "AI-generated drafts are labelled provenance=ai_generated and verifiedClinical=false until clinician Accept/Edit. After Accept/Edit, provenance becomes clinician_verified for the draft artifact only — never an EHR write.",
    missingData: assessMissing(drafts.length, openHitl),
    note:
      "Phase 5 agent intelligence — governed drafting over shared patient context; deterministic synthetic drafts; model/prompt versions pinned; eval suite offline; ehrWrite=false; no autonomous prescribe/treatment; not production clinical AI.",
  };
}

export async function runAgentOrchestration(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; now?: number }
): Promise<AgentIntelSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "agent-orchestrator";
  const nowMs = options?.now ?? Date.now();
  const now = new Date(nowMs).toISOString();
  const label = patientLabel(patientId);

  const { context, drafts } = draftAllKindsForPatient(patientId, { now: nowMs });

  const agentsInvoked = [
    "CONDUCTOR",
    "SYNTHESIS",
    "GUARDIAN",
    "AKSH_DIABETES",
  ].filter((id) => id === "AKSH_DIABETES" || AGENTS.some((a) => a.id === id));

  const run: AgentIntelOrchestrationRun = {
    id: `airun-${patientId}-${nowMs}`,
    patientId,
    patientLabel: label,
    status: "completed",
    agentsInvoked,
    draftIds: drafts.map((d) => d.id),
    sharedContextBuiltAt: context.builtAt,
    versionPin: { ...ACTIVE_AGENT_INTEL_VERSION },
    startedAt: now,
    completedAt: now,
    synthetic: true,
    ehrWrite: false,
    llmUsed: false,
    note: "Hierarchical orchestrator fan-out over shared context; deterministic drafts only; HITL required before any clinical use of text.",
  };

  await replacePatientAgentIntelSeed(patientId, { drafts, run }, { scopeKey, actor });
  return buildAgentIntelligence(patientId, { scopeKey });
}

export async function seedAndBuildAgentIntelligence(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; now?: number }
): Promise<AgentIntelSnapshot> {
  return runAgentOrchestration(patientId, options);
}

export async function decideAgentIntelligenceDraft(
  input: {
    patientId: string;
    draftId: string;
    action: AgentIntelDecisionAction;
    actor: string;
    reason?: string;
    editedPayload?: StructuredDraftPayload;
  },
  options?: { scopeKey?: string }
): Promise<AgentIntelSnapshot> {
  await decideAgentIntelDraft(input, options);
  return buildAgentIntelligence(input.patientId, options);
}

export async function buildAgentIntelligenceWorklist(options?: {
  scopeKey?: string;
}): Promise<AgentIntelWorklistItem[]> {
  const drafts = await listAllOpenDrafts(options);
  return drafts
    .map((d) => ({
      id: d.id,
      patientId: d.patientId,
      patientLabel: d.patientLabel,
      kind: d.kind,
      title: d.payload.title,
      status: d.status,
      ownerRole: d.ownerRole,
      createdAt: d.createdAt,
      confidence: d.confidence,
      provenance: d.provenance,
      verifiedClinical: d.verifiedClinical,
      synthetic: true as const,
      ehrWrite: false as const,
      worklistUrgency:
        d.kind === "missing_information" ? 0 : d.kind === "follow_up_draft" ? 1 : 2,
    }))
    .sort(
      (a, b) => a.worklistUrgency - b.worklistUrgency || a.createdAt.localeCompare(b.createdAt)
    );
}

/** Exported for tests that need a fresh run id without colliding. */
export function newOrchestrationRunId(patientId: string): string {
  return `airun-${patientId}-${randomUUID()}`;
}
