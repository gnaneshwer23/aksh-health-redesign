/**
 * Assemble Phase 5 agent intelligence snapshots, orchestration runs, and HITL.
 * CI 2.0: Context Engine package feeds drafts; Guardian gateway gates enqueue.
 */

import { randomUUID } from "crypto";

import { AGENTS } from "../agents/register";
import { runContractedNexus } from "../agents/contracts/run-nexus";
import { assembleClinicalContext } from "../context-engine/assemble";
import { evaluateGuardianGateway } from "../guardian-gateway";
import { getPatientById } from "../mock-data";
import { mayEnqueueAgentDraft } from "../workflow/review-queue";
import {
  buildSharedPatientContextAsync,
  enrichSharedContextFromClinicalPackage,
  toAgentIntelContextPackageRef,
} from "./agent-intel-context";
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
  AgentIntelGuardianGateSummary,
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
import { fromAgentProvenance, toSpineProvenance } from "./provenance-bridge";

/** Model id Guardian/registry recognise for synthetic diabetes drafting. */
export const AGENT_INTEL_GUARDIAN_MODEL_ID = "aksh-nexus-synthetic-v1";

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
  const sharedContext = await buildSharedPatientContextAsync(patientId, { scopeKey });
  const [drafts, runs, history] = await Promise.all([
    listDrafts(patientId, { scopeKey }),
    listRuns(patientId, { scopeKey }),
    listHistory(patientId, { scopeKey }),
  ]);
  const openHitl = drafts.filter((d) => d.status === "DRAFT" || d.status === "queued").length;
  const evalResults = runAgentIntelEvalSuite();
  const latestRun = runs[0];

  return {
    patientId,
    patientLabel: sharedContext.patientLabel,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    capabilityStatus: "synthetic_demo",
    sharedContext: latestRun?.contextPackage
      ? { ...sharedContext, contextPackage: latestRun.contextPackage }
      : sharedContext,
    versionRegistry: AGENT_INTEL_VERSION_REGISTRY,
    activeVersionPin: ACTIVE_AGENT_INTEL_VERSION,
    drafts,
    orchestrationRuns: runs,
    decisionHistory: history,
    guardianGateway: latestRun?.guardianGateway,
    draftEnqueueAllowed: latestRun?.draftEnqueueAllowed,
    evalSuite: {
      cases: AGENT_INTEL_EVAL_CASES,
      lastResults: evalResults,
    },
    distinctionNote:
      "AI-generated drafts are labelled provenance=ai_generated and verifiedClinical=false until clinician Accept/Edit. After Accept/Edit, provenance becomes clinician_verified for the draft artifact only — never an EHR write.",
    missingData: assessMissing(drafts.length, openHitl),
    note:
      "Phase 5 agent intelligence — Context Engine package feeds drafts; Guardian gateway gates worklist enqueue; deterministic synthetic drafts; model/prompt versions pinned; eval suite offline; ehrWrite=false; no autonomous prescribe/treatment; not production clinical AI.",
  };
}

/**
 * Diabetes domain seed / HITL assemble — **not** clinical-spine CONDUCTOR.
 * Canonical CONDUCTOR lives in `lib/clinical-proof/agent-orchestration.ts`
 * (`runAgentOrchestration`) and `lib/clinical-spine/orchestrate.ts`.
 */
export async function runDiabetesAgentIntelAssemble(
  patientId: string,
  options?: {
    scopeKey?: string;
    actor?: string;
    now?: number;
    /** Optional injection/probe text for Guardian evaluation (tests / chat). */
    userText?: string;
    /** Optional care-episode correlation (P0-EPISODE-01). */
    careEpisodeId?: string;
    /**
     * When true (default), Guardian PASS/REVIEW drafts are also mapped into the
     * primary GP review-case worklist via spine enqueue adapter (P0-UX-01).
     */
    enqueueToSpineReview?: boolean;
  }
): Promise<AgentIntelSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "agent-orchestrator";
  const nowMs = options?.now ?? Date.now();
  const now = new Date(nowMs).toISOString();
  const label = patientLabel(patientId);

  const assembled = await assembleClinicalContext({
    patientId,
    purpose: "clinical_decision_support",
    actorRole: "clinical_reviewer",
  });

  let sharedContext = await buildSharedPatientContextAsync(patientId, {
    scopeKey,
    now: nowMs,
  });
  if (assembled.ok) {
    sharedContext = enrichSharedContextFromClinicalPackage(sharedContext, assembled.package);
  }

  const { context, drafts: candidateDrafts } = draftAllKindsForPatient(patientId, {
    now: nowMs,
    context: sharedContext,
  });

  const contractedNexus = assembled.ok
    ? await runContractedNexus({ context: assembled.package })
    : undefined;

  const guardianRaw = assembled.ok
    ? evaluateGuardianGateway({
        context: assembled.package,
        agentOutput: contractedNexus,
        modelId: AGENT_INTEL_GUARDIAN_MODEL_ID,
        environment: "synthetic",
        userText: options?.userText,
      })
    : undefined;

  const guardianGateway: AgentIntelGuardianGateSummary | undefined = guardianRaw
    ? {
        output_status: guardianRaw.output_status,
        reasons: guardianRaw.reasons,
        independentOfAgentModel: true,
      }
    : undefined;

  // Assembly failure or missing gate → do not enqueue (fail closed).
  const draftEnqueueAllowed = guardianGateway
    ? mayEnqueueAgentDraft(guardianGateway.output_status)
    : false;

  const drafts = draftEnqueueAllowed ? candidateDrafts : [];

  // Honest capability labels — this path does not invoke CONDUCTOR/SYNTHESIS LLM agents.
  const agentsInvoked = [
    "DIABETES_AGENT_INTEL",
    "CONTEXT_ENGINE",
    "GUARDIAN_GATEWAY",
    "AKSH_DIABETES",
  ].filter((id) => id === "DIABETES_AGENT_INTEL" || id === "CONTEXT_ENGINE" || id === "GUARDIAN_GATEWAY" || AGENTS.some((a) => a.id === id));

  const contextPackage = assembled.ok
    ? toAgentIntelContextPackageRef(assembled.package)
    : context.contextPackage;

  const run: AgentIntelOrchestrationRun = {
    id: `airun-${patientId}-${nowMs}`,
    patientId,
    patientLabel: label,
    status: draftEnqueueAllowed ? "completed" : "blocked",
    agentsInvoked,
    draftIds: drafts.map((d) => d.id),
    sharedContextBuiltAt: context.builtAt,
    versionPin: { ...ACTIVE_AGENT_INTEL_VERSION },
    startedAt: now,
    completedAt: now,
    contextPackage,
    guardianGateway,
    draftEnqueueAllowed,
    synthetic: true,
    ehrWrite: false,
    llmUsed: false,
    note: draftEnqueueAllowed
      ? "Diabetes agent-intel assemble (not CONDUCTOR): Context Engine package → deterministic synthetic drafts; Guardian PASS/REVIEW; HITL required. Canonical CONDUCTOR is lib/clinical-proof/agent-orchestration.ts."
      : `Guardian gateway blocked enqueue (status=${guardianGateway?.output_status ?? "unavailable"}). No drafts entered the HITL worklist.`,
  };

  await replacePatientAgentIntelSeed(patientId, { drafts, run }, { scopeKey, actor });

  if (draftEnqueueAllowed && options?.enqueueToSpineReview !== false && drafts.length > 0) {
    const { enqueueDiabetesDraftsToSpineReview } = await import(
      "../clinical-spine/diabetes-draft-enqueue"
    );
    await enqueueDiabetesDraftsToSpineReview({
      patientId,
      patientLabel: label,
      drafts,
      guardianOutputStatus: guardianGateway?.output_status,
      runId: run.id,
      userId: actor,
      scopeKey,
      careEpisodeId: options?.careEpisodeId,
      nowMs,
    });
  }

  return buildAgentIntelligence(patientId, { scopeKey });
}

export async function seedAndBuildAgentIntelligence(
  patientId: string,
  options?: {
    scopeKey?: string;
    actor?: string;
    now?: number;
    userText?: string;
    careEpisodeId?: string;
    enqueueToSpineReview?: boolean;
  }
): Promise<AgentIntelSnapshot> {
  return runDiabetesAgentIntelAssemble(patientId, options);
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
): Promise<AgentIntelSnapshot & { shieldAuditWriteFailed?: boolean; shieldAuditWriteReason?: string | null }> {
  const { withRequiredDiabetesDomainShield } = await import("./shield-decision-audit");
  return withRequiredDiabetesDomainShield(
    {
      source: "agent_intel",
      action: input.action,
      actor: input.actor,
      patientId: input.patientId,
      subjectId: input.draftId,
      reason: input.reason,
    },
    async () => {
      await decideAgentIntelDraft(input, options);
      return buildAgentIntelligence(input.patientId, options);
    }
  );
}

export async function buildAgentIntelligenceWorklist(options?: {
  scopeKey?: string;
}): Promise<AgentIntelWorklistItem[]> {
  const drafts = await listAllOpenDrafts(options);
  return drafts
    .map((d) => {
      // INT-13: project agent enum → spine-compatible provenance for shared consumers.
      const connected = fromAgentProvenance(d.provenance, d.createdAt, {
        confidence: d.confidence,
        sourceReference: d.id,
      });
      const spine = toSpineProvenance(connected);
      return {
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
      /** Spine-shaped projection (sourceSystem / confidence / recordedAt). */
      provenanceSpine: spine,
      verifiedClinical: d.verifiedClinical,
      synthetic: true as const,
      ehrWrite: false as const,
      worklistUrgency:
        d.kind === "missing_information" ? 0 : d.kind === "follow_up_draft" ? 1 : 2,
    };
    })
    .sort(
      (a, b) => a.worklistUrgency - b.worklistUrgency || a.createdAt.localeCompare(b.createdAt)
    );
}

/** Exported for tests that need a fresh run id without colliding. */
export function newOrchestrationRunId(patientId: string): string {
  return `airun-${patientId}-${randomUUID()}`;
}
