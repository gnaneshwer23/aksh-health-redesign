/**
 * Phase C clinical-spine intelligence: orchestrate agents + twin ranking + safety route.
 * Reuses clinical-proof orchestration. Honest: ehrWrite:false · physiologicalTwin:false · autoRetrain:false.
 */

import {
  runAgentOrchestration,
  type OrchestrationOptions,
  type OrchestrationResult
} from "@/lib/clinical-proof/agent-orchestration";
import { buildDiabetesRiskContribution, type DiabetesRiskContribution } from "@/lib/disease-modules/diabetes";
import { loadDiabetesPatientStateOverrides, type CareNetworkDiabetesReadings } from "@/lib/disease-modules/diabetes/ingest";
import { recordDiabetesDecisionSnapshot } from "@/lib/disease-modules/diabetes/decision-history";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data/patients";
import { getOracleModelCard, type OracleModelCard } from "@/lib/precision-health/oracle-model-card";
import { runScenario, type TwinSimulationResult } from "@/lib/precision-health/twin-simulation";
import { assembleClinicalContext } from "@/lib/context-engine/assemble";
import { runContractedNexus } from "@/lib/agents/contracts/run-nexus";
import { evaluateGuardianGateway } from "@/lib/guardian-gateway";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { mayEnqueueAgentDraft } from "@/lib/workflow/review-queue";
import {
  AgentRuntimeError,
  classifyAgentError,
  newCorrelationId,
  type AgentErrorCode,
} from "@/lib/agents/execution-metadata";
import {
  claimOrRecoverDurableAgentRun,
  finalizeDurableAgentRun,
  toDurableRunStatus,
  type DurableAgentRunRecord,
} from "@/lib/agents/execution-run-store";
import { resolveShieldAwareEnqueue } from "@/lib/agents/shield-orchestration-gate";
import { phiSafeResourceRef } from "@/lib/security/phi-safe-ref";

import { resolveDecision, type DecisionEscalation } from "@/lib/decision";
import { llmSessionModeCapabilities } from "@/lib/review/honesty-strip";

import { SAFETY_ROUTE_LABELS, type SafetyRoute } from "./safety-route";

export type ClinicalSpineOrchestrateResult = {
  artifactType: "aksh-clinical-spine-orchestrate";
  orchestration: OrchestrationResult;
  safetyRoute: SafetyRoute;
  safetyRouteLabel: string;
  twin: TwinSimulationResult | null;
  modelCard: OracleModelCard;
  /** B3 — Diabetes v1: null unless ENABLE_DIABETES_MODULE=true AND the patient is diabetes-flagged (clinicalProfiles includes "t2d"). Additive only — see FR-DIAB-018/019/022. */
  diabetesModuleEnabled: boolean;
  diabetes: DiabetesRiskContribution | null;
  /** C6 (P1-3) — Decision.escalation for the diabetes contribution; always "none" when `diabetes` is null (non-diabetes patient or module off) — byte-identical to pre-C6 output. */
  diabetesEscalation: DecisionEscalation;
  contextPackage?: {
    contextId: string;
    schemaVersion: string;
    missing_information: string[];
    uncertainties: string[];
  };
  contractedNexus?: {
    escalation: "PASS" | "REVIEW" | "BLOCK";
    findings: string[];
    evidence: string[];
    tools_used: string[];
  };
  guardianGateway?: {
    output_status: "PASS" | "REVIEW" | "BLOCK";
    reasons: string[];
  };
  /** False when Guardian BLOCK or SHIELD unavailable (durable required) — drafts must not enter HITL. */
  draftEnqueueAllowed: boolean;
  /** Whether the run's SHIELD record was stored (false without a database or when the write failed). */
  runAuditRecorded: boolean;
  /** Milestone A2 — SHIELD blocked enqueue even if Guardian allowed (Postgres required, audit failed). */
  shieldBlockedEnqueue: boolean;
  /** Milestone A2 — durable agent_intel_runs id when idempotencyKey was supplied. */
  durableRunId: string | null;
  /** Milestone A2 — true when this call returned a prior terminal snapshot. */
  durableRecovered: boolean;
  /** Milestone A1 — care episode / correlation echoed for durable A2 persistence. */
  careEpisodeId: string | null;
  correlationId: string;
  ehrWrite: false;
  hitlRequired: true;
  physiologicalTwin: false;
  autoRetrain: false;
  liveEmis: false;
  note: string;
};

/**
 * B3 (docs/PHASED_BUILD_PLAN.md): apply the Diabetes module's HORIZON/GUARDIAN
 * contribution additively — never replacing existing CVD/T2D contributing
 * factors or safety notes (FR-DIAB-018/019). Only called when
 * ENABLE_DIABETES_MODULE=true and the patient is diabetes-flagged; when
 * either is false this function is never invoked and orchestration output is
 * byte-identical to pre-B3 behaviour (FR-DIAB-022).
 */
function applyDiabetesContributionAdditively(
  orchestration: OrchestrationResult,
  diabetes: DiabetesRiskContribution
): OrchestrationResult {
  const diabetesFactors = diabetes.horizonContributingFactors.map((factor) => `[Diabetes] ${factor}`);
  const diabetesSafetyFlags = diabetes.guardianSafetyFlags.map((flag) => `[Diabetes] ${flag}`);

  return {
    ...orchestration,
    outputs: {
      ...orchestration.outputs,
      ORACLE: {
        ...orchestration.outputs.ORACLE,
        contributingFactors: [...orchestration.outputs.ORACLE.contributingFactors, ...diabetesFactors]
      },
      GUARDIAN: {
        ...orchestration.outputs.GUARDIAN,
        safetyNotes: [...orchestration.outputs.GUARDIAN.safetyNotes, ...diabetesSafetyFlags]
      }
    }
  };
}

export type ClinicalSpineOrchestrateInput = OrchestrationOptions & {
  /** Care-network readings for a care-network patient (spine-patient.ts). Simulation and rehearsal only. */
  careNetwork?: CareNetworkDiabetesReadings;
  /** Run synthetic_rules twin ranking after ORACLE (default true). */
  includeTwinRanking?: boolean;
  actor?: string;
  caseId?: string;
};

function isSpineResultSnapshot(value: unknown): value is ClinicalSpineOrchestrateResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as ClinicalSpineOrchestrateResult).artifactType === "aksh-clinical-spine-orchestrate" &&
      (value as ClinicalSpineOrchestrateResult).orchestration
  );
}

function isFailureSnapshot(
  value: unknown
): value is { artifactType: "aksh-clinical-spine-orchestrate-failure"; error: { code: string; message: string } } {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { artifactType?: string }).artifactType === "aksh-clinical-spine-orchestrate-failure"
  );
}

async function finalizeClaimedRun(
  claimed: DurableAgentRunRecord,
  result: ClinicalSpineOrchestrateResult
): Promise<ClinicalSpineOrchestrateResult> {
  const completedAt = new Date().toISOString();
  const status = result.draftEnqueueAllowed
    ? toDurableRunStatus(result.orchestration.execution.status)
    : ("blocked" as const);
  await finalizeDurableAgentRun({
    ...claimed,
    status,
    completedAt,
    correlationId: result.correlationId,
    careEpisodeId: result.careEpisodeId,
    guardianOutcome: result.guardianGateway?.output_status ?? null,
    reviewStatus: result.orchestration.execution.reviewStatus,
    draftEnqueueAllowed: result.draftEnqueueAllowed,
    shieldAuditPersisted: result.runAuditRecorded,
    agentsInvoked: [
      "CONDUCTOR",
      ...result.orchestration.outputSlots.map((s) => (s === "ORACLE" ? "HORIZON" : s)),
    ],
    execution: result.orchestration.execution,
    resultSnapshot: JSON.parse(JSON.stringify(result)) as Record<string, unknown>,
    note: result.durableRecovered
      ? "CONDUCTOR orchestration recovered (A2)"
      : "CONDUCTOR orchestration finalised (A2 durable run)",
  });
  return result;
}

async function finalizeFailedClaim(
  claimed: DurableAgentRunRecord,
  error: unknown
): Promise<never> {
  const classified = error instanceof AgentRuntimeError ? error.classification : classifyAgentError(error, "CONDUCTOR");
  const completedAt = new Date().toISOString();
  const status = toDurableRunStatus(
    classified.code === "TIMEOUT" || classified.code === "OVERALL_TIMEOUT" ? "timed_out" : "failed"
  );
  await finalizeDurableAgentRun({
    ...claimed,
    status,
    completedAt,
    guardianOutcome: null,
    reviewStatus: "not_required",
    draftEnqueueAllowed: false,
    shieldAuditPersisted: false,
    agentsInvoked: ["CONDUCTOR"],
    execution: {
      ...claimed.execution,
      status: classified.code === "TIMEOUT" || classified.code === "OVERALL_TIMEOUT" ? "timed_out" : "failed",
      completedAt,
      durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(claimed.startedAt)),
      errorCode: classified.code,
      errorMessage: classified.message,
      reviewStatus: "not_required",
    },
    resultSnapshot: {
      artifactType: "aksh-clinical-spine-orchestrate-failure",
      error: { code: classified.code, message: classified.message, retryable: classified.retryable },
    },
    note: `CONDUCTOR orchestration failed (A2): ${classified.code}`,
  });
  if (error instanceof AgentRuntimeError) throw error;
  throw new AgentRuntimeError(classified);
}

export async function runClinicalSpineOrchestrate(
  input: ClinicalSpineOrchestrateInput
): Promise<ClinicalSpineOrchestrateResult> {
  const scopeKey = input.scopeKey?.trim() || "shared";
  const correlationId = input.correlationId?.trim() || newCorrelationId("spine");
  const careEpisodeId = input.careEpisodeId?.trim() || null;
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const patient = getPatientById(input.patientId.trim());

  let claimed: DurableAgentRunRecord | null = null;
  if (idempotencyKey && patient) {
    const claim = await claimOrRecoverDurableAgentRun({
      scopeKey,
      patientId: patient.id,
      patientLabel: patient.name,
      correlationId,
      careEpisodeId,
      idempotencyKey,
      source: "clinical_spine",
    });
    if (claim.outcome === "recovered") {
      if (isSpineResultSnapshot(claim.record.resultSnapshot)) {
        return {
          ...claim.record.resultSnapshot,
          durableRunId: claim.record.id,
          durableRecovered: true,
          correlationId: claim.record.correlationId || claim.record.resultSnapshot.correlationId,
          careEpisodeId: claim.record.careEpisodeId ?? claim.record.resultSnapshot.careEpisodeId,
        };
      }
      if (isFailureSnapshot(claim.record.resultSnapshot)) {
        throw new AgentRuntimeError({
          code: (claim.record.resultSnapshot.error.code as AgentErrorCode) || "INTERNAL",
          message: claim.record.resultSnapshot.error.message,
          retryable: false,
          agentId: "CONDUCTOR",
        });
      }
      // Terminal without usable snapshot — fall through is unsafe; surface DUPLICATE.
      throw new AgentRuntimeError({
        code: "DUPLICATE_RUN",
        message: `Durable run ${claim.record.id} already terminal for idempotencyKey=${idempotencyKey}`,
        retryable: false,
        agentId: "CONDUCTOR",
      });
    }
    claimed = claim.record;
  }

  try {
    const result = await runClinicalSpineOrchestrateOnce({
      ...input,
      correlationId: claimed?.correlationId || correlationId,
      careEpisodeId: careEpisodeId ?? undefined,
      // Process-local guard still applies inside runAgentOrchestration when key set;
      // durable path already claimed — skip re-entry of process map by omitting key there
      // only when we own a durable claim (multi-instance). Keep key for non-durable A1 path.
      idempotencyKey: claimed ? undefined : idempotencyKey ?? undefined,
      scopeKey,
    });
    const withDurable: ClinicalSpineOrchestrateResult = {
      ...result,
      durableRunId: claimed?.id ?? null,
      durableRecovered: false,
    };
    if (claimed) {
      return await finalizeClaimedRun(claimed, withDurable);
    }
    return withDurable;
  } catch (error) {
    if (claimed) {
      await finalizeFailedClaim(claimed, error);
    }
    throw error;
  }
}

async function runClinicalSpineOrchestrateOnce(
  input: ClinicalSpineOrchestrateInput
): Promise<ClinicalSpineOrchestrateResult> {
  const includeTwinRanking = input.includeTwinRanking !== false;
  const baseOrchestration = await runAgentOrchestration({
    patientId: input.patientId,
    proposedDrug: input.proposedDrug,
    transcript: input.transcript,
    includeDrAssist: input.includeDrAssist ?? false,
    includeNexus: input.includeNexus !== false,
    agentTimeoutMs: input.agentTimeoutMs,
    overallTimeoutMs: input.overallTimeoutMs,
    careEpisodeId: input.careEpisodeId,
    correlationId: input.correlationId,
    scopeKey: input.scopeKey,
    expectedScopeKey: input.expectedScopeKey,
    idempotencyKey: input.idempotencyKey,
    softFailOptionalAgents: input.softFailOptionalAgents,
    faultInject: input.faultInject,
  });

  // --- B3 Diabetes v1 (docs/PHASED_BUILD_PLAN.md) ---
  // Same position existing Knowledge Graph signals occupy: an additional
  // data-gathering step feeding HORIZON/GUARDIAN inputs, BEFORE the
  // deterministic safety-route step below (FR-DIAB-015). Flag-gated; the
  // patient must also be diabetes-flagged (clinicalProfiles includes "t2d")
  // — a non-diabetes patient's orchestration output is byte-identical to
  // pre-B3 behaviour even with the flag on (FR-DIAB-022).
  const diabetesModuleEnabled = isDiabetesModuleEnabled();
  const diabetesFlagged = Boolean(getPatientById(input.patientId)?.clinicalProfiles?.includes("t2d"));
  // C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): look up any real glucose/HbA1c
  // readings ingested into Patient State for this patient before building
  // the composite. When nothing has been ingested yet (the common case
  // today), loadDiabetesPatientStateOverrides returns an empty `input` and
  // buildDiabetesRiskContribution falls back to the fixture bundle exactly
  // as it did pre-C6 — byte-identical, per P1-2's own regression requirement.
  const diabetesOverrides =
    diabetesModuleEnabled && diabetesFlagged
      ? await loadDiabetesPatientStateOverrides(baseOrchestration.sharedContext.patientId, { careNetwork: input.careNetwork })
      : null;
  const diabetes =
    diabetesModuleEnabled && diabetesFlagged
      ? buildDiabetesRiskContribution(
          {
            patientId: baseOrchestration.sharedContext.patientId,
            patientLabel: baseOrchestration.sharedContext.patientLabel
          },
          diabetesOverrides?.input,
          {
            glucose: diabetesOverrides?.glucoseReadingsSource,
            hba1c: diabetesOverrides?.hba1cReadingsSource
          }
        )
      : null;
  const orchestration = diabetes
    ? applyDiabetesContributionAdditively(baseOrchestration, diabetes)
    : baseOrchestration;

  // C2 (docs/PHASED_BUILD_PLAN_C.md, P0-2) — Decision domain entry point.
  // resolveDecision delegates to the same resolveSafetyRouteFromOrchestration
  // this call site used pre-C2; the route value is byte-identical. C6/P1-3
  // additionally passes the diabetes contribution through for the
  // `escalation` field only — `diabetes` is null for every non-diabetes-
  // flagged patient and for every patient when the module is off, so
  // `escalation` resolves to "none" in both cases, matching pre-C6 output.
  const decision = resolveDecision({ orchestration, diabetes });
  const safetyRoute = decision.route;

  // D4 (docs/PHASED_BUILD_PLAN_D.md): write this run's diabetes Decision
  // outcome back onto Patient State as a durable, queryable fact — only for
  // diabetes-flagged patients with the module enabled (i.e. `diabetes` is
  // non-null); non-diabetes patients and flag-off runs produce zero new
  // facts, byte-identical to pre-D4 behaviour. Fire-and-forget, fail-open:
  // recordDiabetesDecisionSnapshot never throws, and this call is never
  // awaited, so it can never delay or alter the clinician-facing response.
  if (diabetes) {
    void recordDiabetesDecisionSnapshot({
      patientId: baseOrchestration.sharedContext.patientId,
      snapshot: {
        escalation: decision.escalation,
        horizonContributingFactorCount: diabetes.horizonContributingFactors.length,
        guardianSafetyFlagCount: diabetes.guardianSafetyFlags.length,
        areaFailures: diabetes.areaFailures,
        orchestratedAt: new Date().toISOString()
      }
    });
  }

  const twin = includeTwinRanking ? runScenario(input.patientId) : null;
  const modelCard = getOracleModelCard();

  if (twin && (twin.physiologicalTwin !== false || twin.simulationMode !== "synthetic_rules")) {
    throw new Error("Twin honesty check failed — refuse to return physiological twin claim");
  }

  const actor = input.actor ?? "clinical-spine-orchestrate";

  const assembled = await assembleClinicalContext({
    patientId: input.patientId,
    purpose: "clinical_decision_support",
    actorRole: "clinical_reviewer",
  });
  const contextPackage = assembled.ok ? assembled.package : undefined;
  const contractedNexus = contextPackage ? await runContractedNexus({ context: contextPackage }) : undefined;
  const guardianGateway = contextPackage
    ? evaluateGuardianGateway({
        context: contextPackage,
        agentOutput: contractedNexus,
        modelId: "aksh-nexus-synthetic-v1",
        environment: "synthetic",
        userText: input.transcript,
      })
    : undefined;

  const guardianAllowsEnqueue = mayEnqueueAgentDraft(guardianGateway?.output_status);
  const guardianOutcome = guardianGateway?.output_status ?? null;

  // Enrich A1 execution metadata with Guardian gateway outcome (post fan-out) before SHIELD.
  // Final enqueue decision is applied after audit persistence (A2 audit-before-finalisation).
  let orchestrationWithGuardian: OrchestrationResult = {
    ...orchestration,
    execution: {
      ...orchestration.execution,
      guardianOutcome,
      reviewStatus: guardianAllowsEnqueue ? "pending_hitl" : "blocked_from_queue",
      status: guardianAllowsEnqueue ? orchestration.execution.status : "blocked",
      agents: orchestration.execution.agents.map((a) => ({
        ...a,
        guardianOutcome,
        reviewStatus: guardianAllowsEnqueue ? a.reviewStatus : "blocked_from_queue",
      })),
    },
  };

  // FR-DIAB-016: every diabetes-module output reaching a clinician is
  // SHIELD-audited exactly like existing agent outputs — reuses this same
  // orchestrate audit event (no new audit table/event schema); the payload
  // below simply names the diabetes contribution when one was applied.
  // FR-AGT-011: one SHIELD record per run, awaited so its outcome is reported (not fire-and-forget).
  // A2: audit before enqueue finalisation (parity with #92 diabetes decide).
  const runAudit = await persistShieldAuditEvent({
    action: "defer",
    actor,
    label: `SHIELD: clinical spine orchestrate (${orchestrationWithGuardian.queuePriority} → ${safetyRoute})`,
    detail: `reviewOrder=${orchestrationWithGuardian.reviewOrder.join("→")}; twin=${twin ? "synthetic_rules" : "off"}; HITL required${
      diabetes
        ? `; diabetes module contributed ${diabetes.horizonContributingFactors.length} HORIZON factor(s), ${diabetes.guardianSafetyFlags.length} GUARDIAN flag(s)`
        : ""
    }; correlationId=${orchestrationWithGuardian.execution.correlationId}`,
    category: "system",
    caseId: input.caseId,
    agentLabel: "CONDUCTOR",
    resourceRef: phiSafeResourceRef(orchestrationWithGuardian.sharedContext.patientId, {
      caseId: input.caseId,
      agentLabel: "CONDUCTOR",
    }),
    payload: {
      queuePriority: orchestrationWithGuardian.queuePriority,
      reviewOrder: orchestrationWithGuardian.reviewOrder,
      safetyRoute,
      ehrWrite: false,
      hitlRequired: true,
      physiologicalTwin: false,
      autoRetrain: false,
      liveEmis: false,
      twinMode: twin?.simulationMode ?? null,
      modelCardId: modelCard.modelId,
      clinicalOwner: modelCard.clinicalOwner,
      diabetesModuleEnabled,
      diabetesFlagged,
      diabetesContributingFactorCount: diabetes?.horizonContributingFactors.length ?? 0,
      diabetesSafetyFlagCount: diabetes?.guardianSafetyFlags.length ?? 0,
      diabetesAreaFailures: diabetes?.areaFailures ?? [],
      diabetesEscalation: decision.escalation,
      contextId: contextPackage?.contextId ?? null,
      context_version: contextPackage?.schemaVersion ?? null,
      model_version: "aksh-nexus-synthetic-v1",
      tools_used: contractedNexus?.tools_used ?? [],
      output_status: guardianOutcome,
      careEpisodeId: orchestrationWithGuardian.execution.careEpisodeId,
      correlationId: orchestrationWithGuardian.execution.correlationId,
      executionSchemaVersion: orchestrationWithGuardian.execution.schemaVersion,
      guardianAllowsEnqueue,
    }
  });

  const enqueueGate = resolveShieldAwareEnqueue({
    guardianAllowsEnqueue,
    shieldPersisted: runAudit.persisted,
  });
  const draftEnqueueAllowed = enqueueGate.draftEnqueueAllowed;
  const reviewStatus = draftEnqueueAllowed ? ("pending_hitl" as const) : ("blocked_from_queue" as const);

  orchestrationWithGuardian = {
    ...orchestrationWithGuardian,
    execution: {
      ...orchestrationWithGuardian.execution,
      reviewStatus,
      status: draftEnqueueAllowed
        ? orchestrationWithGuardian.execution.status === "blocked"
          ? orchestration.execution.status
          : orchestrationWithGuardian.execution.status
        : "blocked",
    },
  };

  return {
    artifactType: "aksh-clinical-spine-orchestrate",
    runAuditRecorded: runAudit.persisted,
    shieldBlockedEnqueue: enqueueGate.shieldBlockedEnqueue,
    durableRunId: null,
    durableRecovered: false,
    orchestration: orchestrationWithGuardian,
    safetyRoute,
    safetyRouteLabel: SAFETY_ROUTE_LABELS[safetyRoute].title,
    twin,
    modelCard,
    diabetesModuleEnabled,
    diabetes,
    diabetesEscalation: decision.escalation,
    contextPackage: contextPackage
      ? {
          contextId: contextPackage.contextId,
          schemaVersion: contextPackage.schemaVersion,
          missing_information: contextPackage.missing_information,
          uncertainties: contextPackage.uncertainties,
        }
      : undefined,
    contractedNexus: contractedNexus
      ? {
          escalation: contractedNexus.escalation,
          findings: contractedNexus.findings,
          evidence: contractedNexus.evidence,
          tools_used: contractedNexus.tools_used,
        }
      : undefined,
    guardianGateway: guardianGateway
      ? { output_status: guardianGateway.output_status, reasons: guardianGateway.reasons }
      : undefined,
    draftEnqueueAllowed,
    careEpisodeId: orchestrationWithGuardian.execution.careEpisodeId,
    correlationId: orchestrationWithGuardian.execution.correlationId,
    ehrWrite: false,
    hitlRequired: true,
    physiologicalTwin: false,
    autoRetrain: false,
    liveEmis: false,
    note:
      "Clinical spine Phase C — drafts only. SYNTHESIS→GUARDIAN→HORIZON→NEXUS. GUARDIAN first when urgent. Twin ranking is synthetic_rules. Model card clinical owner may be UNASSIGNED. Zero autonomous EHR write." +
      (diabetesModuleEnabled
        ? " Diabetes module (B3) enabled — additive HORIZON/GUARDIAN contribution only for diabetes-flagged patients; Glucose Intelligence stays insufficient_data pending OQ-DIAB-1."
        : "") +
      (enqueueGate.shieldBlockedEnqueue
        ? " SHIELD audit required but unavailable — draft enqueue blocked (A2)."
        : "")
  };
}

export function getClinicalSpineOrchestrateCapabilities() {
  const modelCard = getOracleModelCard();
  // Milestone C2 — thin LLM-week / session-mode visibility for review honesty strip (not a policy admin UI).
  const llmSession = llmSessionModeCapabilities();
  return {
    available: true,
    agents: ["SYNTHESIS", "GUARDIAN", "ORACLE", "NEXUS"] as const,
    twinRanking: true,
    simulationMode: "synthetic_rules" as const,
    physiologicalTwin: false as const,
    autoRetrain: false as const,
    liveEmis: false as const,
    modelCard,
    diabetesModule: {
      enabled: isDiabetesModuleEnabled(),
      flag: "ENABLE_DIABETES_MODULE",
      defaultEnabled: false as const,
      glucoseIntelligence: "insufficient_data_pending_OQ-DIAB-1" as const
    },
    ...llmSession,
    // Keep honesty invariants last so session payload cannot loosen them.
    ehrWrite: false as const,
    hitlRequired: true as const,
    note: "One-click SYNTHESIS→GUARDIAN→HORIZON→NEXUS (api ids ORACLE/NEXUS) on clinical spine. Urgent prioritises GUARDIAN. All drafts require HITL."
  };
}
