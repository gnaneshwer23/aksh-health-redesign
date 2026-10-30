/**
 * Multi-agent orchestration for clinical-proof / CONDUCTOR.
 * Same patient context → SYNTHESIS + GUARDIAN + ORACLE + NEXUS (+ optional DrASSIST).
 *
 * Invariants:
 * - Shared context (patientId / label) across agents
 * - No overwrite — each agent stores an independent draft
 * - GUARDIAN priority when urgent (red/amber status or URGENT flag)
 * - NEXUS always draft-only (status: draft) · HITL required · no EHR write
 * - Outputs independently evidenced
 * - Timeouts controlled (Promise.race per agent + overall budget)
 * - Zero autonomous EHR write (ehrWrite always false)
 */

import { REVIEW_ORDER, toOrchestrationAgentId, type AgentId } from "../agents/register";
import { runDrAssistAgent, type DrAssistDraft } from "../agents/llm-dr-assist";
import { runGuardianAgent, type GuardianDraft } from "../agents/llm-guardian";
import { runNexusAgent, type NexusDraft } from "../agents/llm-nexus";
import { runOracleAgent, type OracleDraft } from "../agents/llm-oracle";
import { runSynthesisAgent, type SynthesisDraft } from "../agents/llm-synthesis";
import {
  AgentRuntimeError,
  assertNotDuplicateRun,
  assertRuntimeScope,
  buildAgentExecutionMetadata,
  buildRunBundleMetadata,
  classifyAgentError,
  newCorrelationId,
  type AgentErrorClassification,
  type AgentExecutionMetadata,
  type AgentRunBundleMetadata,
  type AgentRunStatus,
} from "../agents/execution-metadata";
import { getPatientById } from "../mock-data/patients";

export type OrchestrationAgentId = "SYNTHESIS" | "GUARDIAN" | "ORACLE" | "NEXUS" | "DrASSIST";

/** Map orchestration slot ids to register AgentId (HORIZON owns ORACLE slot). */
function toRegisterAgentId(slot: OrchestrationAgentId): AgentId {
  if (slot === "ORACLE") return "HORIZON";
  return slot;
}

export type QueuePriority = "Urgent" | "High" | "Normal";

export type SharedPatientContext = {
  patientId: string;
  patientLabel: string;
  proposedDrug: string | null;
  transcript: string;
  flags: string[];
};

export type AgentEvidence = {
  agent: OrchestrationAgentId;
  evidenced: boolean;
  detail: string;
};

export type OrchestrationOutputs = {
  SYNTHESIS: SynthesisDraft;
  GUARDIAN: GuardianDraft;
  ORACLE: OracleDraft;
  /** Default CONDUCTOR path includes NEXUS (draft correlations). */
  NEXUS?: NexusDraft;
  DrASSIST?: DrAssistDraft;
};

export type OrchestrationResult = {
  artifactType: "aksh-uk-agent-orchestration";
  sharedContext: SharedPatientContext;
  outputs: OrchestrationOutputs;
  /** Independent slots — proves no overwrite of peer drafts */
  outputSlots: OrchestrationAgentId[];
  queuePriority: QueuePriority;
  /** Review order — GUARDIAN first when urgent */
  reviewOrder: OrchestrationAgentId[];
  evidence: AgentEvidence[];
  ehrWrite: false;
  hitlRequired: true;
  timedOut: boolean;
  elapsedMs: number;
  perAgentMs: Partial<Record<OrchestrationAgentId, number>>;
  /** Milestone A1 — standardised execution metadata for the run + per-agent slots. */
  execution: AgentRunBundleMetadata;
  agentMetadata: Partial<Record<OrchestrationAgentId, AgentExecutionMetadata>>;
};

export type OrchestrationOptions = {
  patientId: string;
  proposedDrug?: string;
  transcript?: string;
  includeDrAssist?: boolean;
  /** Include NEXUS correlations in default CONDUCTOR path (default true). */
  includeNexus?: boolean;
  /** Per-agent timeout (default 8s — deterministic paths are fast) */
  agentTimeoutMs?: number;
  /** Overall budget (default 30s — four parallel agents + optional DrASSIST) */
  overallTimeoutMs?: number;
  /** Milestone A1 — care-episode / correlation / tenant scope for runtime metadata. */
  careEpisodeId?: string;
  correlationId?: string;
  scopeKey?: string;
  /** When set with expectedScopeKey, CROSS_TENANT is raised on mismatch. */
  expectedScopeKey?: string;
  /** Process-local + durable (A2) idempotency key. */
  idempotencyKey?: string;
  /**
   * Soft-fail optional slots (NEXUS / DrASSIST) instead of aborting the run.
   * Default true (A2). Required slots SYNTHESIS / GUARDIAN / ORACLE still fail closed.
   */
  softFailOptionalAgents?: boolean;
  /**
   * Reliability drill — only honoured when AKSH_ORCH_FAULT_INJECTION=true.
   * Injects failures for named slots without calling the agent.
   */
  faultInject?: Partial<Record<OrchestrationAgentId, "timeout" | "throw">>;
};

class AgentTimeoutError extends Error {
  constructor(agent: OrchestrationAgentId, ms: number) {
    super(`${agent} timed out after ${ms}ms`);
    this.name = "AgentTimeoutError";
  }
}

function faultInjectionEnabled(): boolean {
  return process.env.AKSH_ORCH_FAULT_INJECTION?.trim().toLowerCase() === "true";
}

async function withTimeout<T>(
  agent: OrchestrationAgentId,
  promise: Promise<T>,
  ms: number
): Promise<{ value: T; elapsedMs: number }> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AgentTimeoutError(agent, ms)), ms);
      })
    ]);
    return { value, elapsedMs: Date.now() - started };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildDefaultTranscript(patientLabel: string, patientId: string): string {
  return `Synthetic consultation for ${patientLabel} (${patientId}). Clinician requests multi-agent draft rehearsal. Draft only — HITL required before staging.`;
}

function resolveQueuePriority(
  guardian: GuardianDraft,
  oracle: OracleDraft,
  flags: string[]
): QueuePriority {
  const urgentFlag = flags.some((f) => f.toUpperCase() === "URGENT");
  if (guardian.overallStatus === "red" || urgentFlag) return "Urgent";
  if (
    guardian.overallStatus === "amber" ||
    oracle.oracleRisk === "VeryHigh" ||
    oracle.oracleRisk === "High"
  ) {
    return "High";
  }
  return "Normal";
}

export function resolveReviewOrder(
  priority: QueuePriority,
  includeDrAssist: boolean,
  includeNexus: boolean
): OrchestrationAgentId[] {
  // The order is defined once, in the agent register (Volume I §7.3 step 4): GUARDIAN leads when urgent.
  // P1-ALIAS-01: REVIEW_ORDER uses canonical HORIZON; map to ORACLE output-slot id for callers.
  const order = priority === "Urgent" ? REVIEW_ORDER.urgent : REVIEW_ORDER.normal;
  return order
    .map((id) => toOrchestrationAgentId(id))
    .filter((id) => (id !== "NEXUS" || includeNexus) && (id !== "DrASSIST" || includeDrAssist)) as OrchestrationAgentId[];
}

function collectEvidence(outputs: OrchestrationOutputs): AgentEvidence[] {
  const synthesisText = [
    outputs.SYNTHESIS.subjective,
    outputs.SYNTHESIS.objective,
    outputs.SYNTHESIS.assessment,
    outputs.SYNTHESIS.plan
  ].join(" ");

  const evidence: AgentEvidence[] = [
    {
      agent: "SYNTHESIS",
      evidenced: Boolean(
        outputs.SYNTHESIS.subjective &&
          outputs.SYNTHESIS.plan &&
          synthesisText.trim().length > 20
      ),
      detail: `SOAP fields present; confidence=${outputs.SYNTHESIS.confidence}`
    },
    {
      agent: "GUARDIAN",
      evidenced:
        typeof outputs.GUARDIAN.overallStatus === "string" &&
        Array.isArray(outputs.GUARDIAN.interactions),
      detail: `status=${outputs.GUARDIAN.overallStatus}; interactions=${outputs.GUARDIAN.interactions.length}`
    },
    {
      agent: "ORACLE",
      evidenced:
        typeof outputs.ORACLE.oracleScore === "number" &&
        typeof outputs.ORACLE.oracleRisk === "string",
      detail: `score=${outputs.ORACLE.oracleScore}; risk=${outputs.ORACLE.oracleRisk}`
    }
  ];

  if (outputs.NEXUS) {
    evidence.push({
      agent: "NEXUS",
      evidenced:
        outputs.NEXUS.status === "draft" &&
        Array.isArray(outputs.NEXUS.correlations) &&
        outputs.NEXUS.correlations.length > 0 &&
        Boolean(outputs.NEXUS.summary),
      detail: `status=${outputs.NEXUS.status}; correlations=${outputs.NEXUS.correlations.length}; mode=${outputs.NEXUS.mode}`
    });
  }

  if (outputs.DrASSIST) {
    evidence.push({
      agent: "DrASSIST",
      evidenced: Array.isArray(outputs.DrASSIST.codes) && outputs.DrASSIST.codes.length > 0,
      detail: `codes=${outputs.DrASSIST.codes.length}; confidence=${outputs.DrASSIST.confidence}`
    });
  }

  return evidence;
}

/**
 * Run SYNTHESIS + GUARDIAN + ORACLE + NEXUS (+ optional DrASSIST) against one patient context.
 * Drafts are independent — never mutate peer slots. NEXUS is draft-only.
 * Milestone A1 attaches standardised execution metadata; clinical retries remain fail-closed (maxRetries=0).
 */
export async function runAgentOrchestration(
  options: OrchestrationOptions
): Promise<OrchestrationResult> {
  const startedAt = new Date().toISOString();
  const correlationId = options.correlationId?.trim() || newCorrelationId("orch");
  const careEpisodeId = options.careEpisodeId?.trim() || null;

  try {
    assertRuntimeScope({
      requestScopeKey: options.scopeKey,
      expectedScopeKey: options.expectedScopeKey,
      patientId: options.patientId,
    });
    assertNotDuplicateRun(options.idempotencyKey);

    const patientId = options.patientId.trim();
    if (!patientId) {
      throw new AgentRuntimeError({
        code: "MISSING_CONTEXT",
        message: "Orchestration requires patientId",
        retryable: false,
        agentId: "CONDUCTOR",
      });
    }

    const patient = getPatientById(patientId);
    if (!patient) {
      throw new AgentRuntimeError({
        code: "UNKNOWN_PATIENT",
        message: `Unknown patient for orchestration: ${patientId}`,
        retryable: false,
        agentId: "CONDUCTOR",
      });
    }

    const agentTimeoutMs = options.agentTimeoutMs ?? 8_000;
    const overallTimeoutMs = options.overallTimeoutMs ?? 30_000;
    const includeDrAssist = options.includeDrAssist ?? true;
    const includeNexus = options.includeNexus !== false;
    const proposedDrug = options.proposedDrug?.trim() || null;
    const transcript =
      options.transcript?.trim() || buildDefaultTranscript(patient.name, patientId);

    const sharedContext: SharedPatientContext = {
      patientId,
      patientLabel: patient.name,
      proposedDrug,
      transcript,
      flags: [...(patient.flags ?? [])],
    };

    const overallStarted = Date.now();
    const perAgentMs: Partial<Record<OrchestrationAgentId, number>> = {};
    const softFailOptional = options.softFailOptionalAgents !== false;
    const failedOptional: Partial<Record<OrchestrationAgentId, AgentErrorClassification>> = {};
    const faultInject = faultInjectionEnabled() ? options.faultInject ?? {} : {};

    async function runSlot<T>(
      slot: OrchestrationAgentId,
      run: () => Promise<T>
    ): Promise<{ value: T; elapsedMs: number }> {
      const inject = faultInject[slot];
      if (inject === "timeout") {
        throw new AgentTimeoutError(slot, agentTimeoutMs);
      }
      if (inject === "throw") {
        throw new Error(`${slot} fault-injected failure`);
      }
      return withTimeout(slot, run(), agentTimeoutMs);
    }

    const runAll = async (): Promise<OrchestrationOutputs> => {
      // Parallel generation — each result lands in its own slot (no shared mutable draft)
      const [synthesisSettled, guardianSettled, oracleSettled, nexusSettled] = await Promise.all([
        runSlot("SYNTHESIS", () =>
          runSynthesisAgent({
            transcript,
            patientLabel: `${patient.name} (${patientId})`,
          })
        ).then(
          (v) => ({ ok: true as const, ...v }),
          (error: unknown) => ({ ok: false as const, error, elapsedMs: agentTimeoutMs })
        ),
        runSlot("GUARDIAN", () =>
          runGuardianAgent({
            patientId,
            proposedDrug: proposedDrug ?? undefined,
          })
        ).then(
          (v) => ({ ok: true as const, ...v }),
          (error: unknown) => ({ ok: false as const, error, elapsedMs: agentTimeoutMs })
        ),
        runSlot("ORACLE", () => runOracleAgent({ patientId })).then(
          (v) => ({ ok: true as const, ...v }),
          (error: unknown) => ({ ok: false as const, error, elapsedMs: agentTimeoutMs })
        ),
        includeNexus
          ? runSlot("NEXUS", () => runNexusAgent({ patientId })).then(
              (v) => ({ ok: true as const, ...v }),
              (error: unknown) => ({ ok: false as const, error, elapsedMs: agentTimeoutMs })
            )
          : Promise.resolve(null),
      ]);

      // Required agents — fail closed (do not soft-fail)
      if (!synthesisSettled.ok) {
        throw synthesisSettled.error instanceof Error
          ? synthesisSettled.error
          : new Error(String(synthesisSettled.error));
      }
      if (!guardianSettled.ok) {
        throw guardianSettled.error instanceof Error
          ? guardianSettled.error
          : new Error(String(guardianSettled.error));
      }
      if (!oracleSettled.ok) {
        throw oracleSettled.error instanceof Error
          ? oracleSettled.error
          : new Error(String(oracleSettled.error));
      }

      perAgentMs.SYNTHESIS = synthesisSettled.elapsedMs;
      perAgentMs.GUARDIAN = guardianSettled.elapsedMs;
      perAgentMs.ORACLE = oracleSettled.elapsedMs;

      if (!oracleSettled.value) {
        throw new Error(`ORACLE returned null for ${patientId}`);
      }

      const outputs: OrchestrationOutputs = {
        SYNTHESIS: synthesisSettled.value,
        GUARDIAN: guardianSettled.value,
        ORACLE: oracleSettled.value,
      };

      if (includeNexus && nexusSettled) {
        if (nexusSettled.ok) {
          perAgentMs.NEXUS = nexusSettled.elapsedMs;
          if (!nexusSettled.value) {
            throw new Error(`NEXUS returned null for ${patientId}`);
          }
          if (nexusSettled.value.status !== "draft") {
            throw new Error("NEXUS must return status: draft — refusing non-draft output");
          }
          outputs.NEXUS = nexusSettled.value;
        } else if (softFailOptional) {
          failedOptional.NEXUS = classifyAgentError(nexusSettled.error, "NEXUS");
          perAgentMs.NEXUS = nexusSettled.elapsedMs;
        } else {
          throw nexusSettled.error instanceof Error
            ? nexusSettled.error
            : new Error(String(nexusSettled.error));
        }
      }

      if (includeDrAssist) {
        try {
          const drAssistTimed = await runSlot("DrASSIST", () => runDrAssistAgent({ patientId }));
          perAgentMs.DrASSIST = drAssistTimed.elapsedMs;
          if (!drAssistTimed.value) {
            throw new Error(`DrASSIST returned null for ${patientId}`);
          }
          outputs.DrASSIST = drAssistTimed.value;
        } catch (error) {
          if (softFailOptional) {
            failedOptional.DrASSIST = classifyAgentError(error, "DrASSIST");
            perAgentMs.DrASSIST = agentTimeoutMs;
          } else {
            throw error;
          }
        }
      }

      return outputs;
    };

    let timedOut = false;
    let outputs: OrchestrationOutputs;
    try {
      let overallTimer: ReturnType<typeof setTimeout> | undefined;
      outputs = await Promise.race([
        runAll(),
        new Promise<never>((_, reject) => {
          overallTimer = setTimeout(() => {
            timedOut = true;
            reject(new Error(`Orchestration overall timeout after ${overallTimeoutMs}ms`));
          }, overallTimeoutMs);
        }),
      ]).finally(() => {
        if (overallTimer) clearTimeout(overallTimer);
      });
    } catch (error) {
      if (error instanceof AgentTimeoutError || timedOut) {
        timedOut = true;
      }
      const classified = classifyAgentError(error, "CONDUCTOR");
      throw error instanceof AgentRuntimeError
        ? error
        : new AgentRuntimeError({
            ...classified,
            code: timedOut && classified.code === "INTERNAL" ? "OVERALL_TIMEOUT" : classified.code,
          });
    }

    // Shared-context assertions (throw = fail the proof)
    assertSharedContext(sharedContext, outputs);

    const queuePriority = resolveQueuePriority(
      outputs.GUARDIAN,
      outputs.ORACLE,
      sharedContext.flags
    );
    const reviewOrder = resolveReviewOrder(queuePriority, includeDrAssist, includeNexus);
    const evidence = collectEvidence(outputs);
    const outputSlots = Object.keys(outputs) as OrchestrationAgentId[];

    // No-overwrite: each slot must remain a distinct object reference
    assertNoOverwrite(outputs);

    if (!evidence.every((e) => e.evidenced)) {
      const weak = evidence.filter((e) => !e.evidenced).map((e) => e.agent);
      throw new AgentRuntimeError({
        code: "EVIDENCE_MISSING",
        message: `Independent evidence missing for: ${weak.join(", ")}`,
        retryable: false,
        agentId: "CONDUCTOR",
      });
    }

    if (queuePriority === "Urgent" && reviewOrder[0] !== "GUARDIAN") {
      throw new Error("Urgent orchestration must prioritise GUARDIAN first");
    }

    const completedAt = new Date().toISOString();
    const agentMetadata: Partial<Record<OrchestrationAgentId, AgentExecutionMetadata>> = {};
    const agentMetaList: AgentExecutionMetadata[] = [];
    const optionalFailures = Object.keys(failedOptional) as OrchestrationAgentId[];
    const bundleStatus: AgentRunStatus = optionalFailures.length > 0 ? "partial" : "completed";

    for (const slot of outputSlots) {
      const draft = outputs[slot];
      const draftMode =
        draft && "mode" in draft ? (draft.mode as "llm" | "deterministic") : "deterministic";
      const slotEvidence = evidence.find((e) => e.agent === slot);
      const meta = buildAgentExecutionMetadata({
        agentId: toRegisterAgentId(slot),
        draftMode,
        status: "completed",
        startedAt,
        completedAt,
        durationMs: perAgentMs[slot] ?? null,
        careEpisodeId,
        correlationId,
        evidenceRefs: slotEvidence ? [`${slot}:${slotEvidence.detail}`] : [],
        reviewStatus: "pending_hitl",
        maxRetries: 0,
      });
      agentMetadata[slot] = meta;
      agentMetaList.push(meta);
    }

    for (const slot of optionalFailures) {
      const err = failedOptional[slot]!;
      const meta = buildAgentExecutionMetadata({
        agentId: toRegisterAgentId(slot),
        status: err.code === "TIMEOUT" || err.code === "OVERALL_TIMEOUT" ? "timed_out" : "failed",
        startedAt,
        completedAt,
        durationMs: perAgentMs[slot] ?? null,
        careEpisodeId,
        correlationId,
        evidenceRefs: [],
        reviewStatus: "not_required",
        error: err,
        maxRetries: 0,
      });
      agentMetadata[slot] = meta;
      agentMetaList.push(meta);
    }

    const conductorMeta = buildAgentExecutionMetadata({
      agentId: "CONDUCTOR",
      executionMode: "orchestrator",
      status: bundleStatus,
      startedAt,
      completedAt,
      durationMs: Date.now() - overallStarted,
      careEpisodeId,
      correlationId,
      evidenceRefs: [
        ...evidence.map((e) => `${e.agent}:${e.evidenced ? "ok" : "weak"}`),
        ...optionalFailures.map((s) => `${s}:soft_failed:${failedOptional[s]?.code ?? "INTERNAL"}`),
      ],
      reviewStatus: "pending_hitl",
      error:
        optionalFailures.length > 0
          ? {
              code: "UPSTREAM",
              message: `Partial orchestration: soft-failed ${optionalFailures.join(", ")}`,
              retryable: false,
              agentId: "CONDUCTOR",
            }
          : null,
      maxRetries: 0,
    });
    agentMetaList.unshift(conductorMeta);

    const execution = buildRunBundleMetadata({
      correlationId,
      careEpisodeId,
      scopeKey: options.scopeKey ?? null,
      startedAt,
      completedAt,
      status: bundleStatus,
      agents: agentMetaList,
      reviewStatus: "pending_hitl",
      evidenceRefs: evidence.map((e) => `${e.agent}:${e.detail}`),
      error:
        optionalFailures.length > 0
          ? {
              code: "UPSTREAM",
              message: `Partial orchestration: soft-failed ${optionalFailures.join(", ")}`,
              retryable: false,
              agentId: "CONDUCTOR",
            }
          : null,
    });

    return {
      artifactType: "aksh-uk-agent-orchestration",
      sharedContext,
      outputs,
      outputSlots,
      queuePriority,
      reviewOrder,
      evidence,
      ehrWrite: false,
      hitlRequired: true,
      timedOut: false,
      elapsedMs: Date.now() - overallStarted,
      perAgentMs,
      execution,
      agentMetadata,
    };
  } catch (error) {
    if (error instanceof AgentRuntimeError) throw error;
    throw new AgentRuntimeError(classifyAgentError(error, "CONDUCTOR"));
  }
}

function assertSharedContext(ctx: SharedPatientContext, outputs: OrchestrationOutputs) {
  if (outputs.GUARDIAN.patientId !== ctx.patientId) {
    throw new Error(
      `GUARDIAN patientId mismatch: ${outputs.GUARDIAN.patientId} !== ${ctx.patientId}`
    );
  }
  if (outputs.ORACLE.patientId !== ctx.patientId) {
    throw new Error(`ORACLE patientId mismatch: ${outputs.ORACLE.patientId} !== ${ctx.patientId}`);
  }
  if (outputs.NEXUS && outputs.NEXUS.patientId !== ctx.patientId) {
    throw new Error(`NEXUS patientId mismatch: ${outputs.NEXUS.patientId} !== ${ctx.patientId}`);
  }
  if (outputs.DrASSIST && outputs.DrASSIST.patientId !== ctx.patientId) {
    throw new Error(
      `DrASSIST patientId mismatch: ${outputs.DrASSIST.patientId} !== ${ctx.patientId}`
    );
  }
  // SYNTHESIS uses label; must mention patient name or id
  const label = outputs.SYNTHESIS.patientLabel.toLowerCase();
  const nameOk =
    label.includes(ctx.patientLabel.toLowerCase().split(" ")[0] ?? "") ||
    label.includes(ctx.patientId.toLowerCase());
  if (!nameOk) {
    throw new Error(
      `SYNTHESIS patientLabel "${outputs.SYNTHESIS.patientLabel}" does not match shared context ${ctx.patientId}`
    );
  }
}

function assertNoOverwrite(outputs: OrchestrationOutputs) {
  const refs = [
    outputs.SYNTHESIS,
    outputs.GUARDIAN,
    outputs.ORACLE,
    outputs.NEXUS,
    outputs.DrASSIST
  ].filter(Boolean);
  const unique = new Set(refs);
  if (unique.size !== refs.length) {
    throw new Error("Agent outputs share object references — overwrite risk");
  }
}
