/**
 * Multi-agent orchestration for clinical-proof.
 * Same patient context → SYNTHESIS + GUARDIAN + ORACLE (+ optional DrASSIST).
 *
 * Invariants:
 * - Shared context (patientId / label) across agents
 * - No overwrite — each agent stores an independent draft
 * - GUARDIAN priority when urgent (red/amber status or URGENT flag)
 * - Outputs independently evidenced
 * - Timeouts controlled (Promise.race per agent + overall budget)
 * - Zero autonomous EHR write (ehrWrite always false)
 */

import { runDrAssistAgent, type DrAssistDraft } from "../agents/llm-dr-assist";
import { runGuardianAgent, type GuardianDraft } from "../agents/llm-guardian";
import { runOracleAgent, type OracleDraft } from "../agents/llm-oracle";
import { runSynthesisAgent, type SynthesisDraft } from "../agents/llm-synthesis";
import { getPatientById } from "../mock-data/patients";

export type OrchestrationAgentId = "SYNTHESIS" | "GUARDIAN" | "ORACLE" | "DrASSIST";

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
};

export type OrchestrationOptions = {
  patientId: string;
  proposedDrug?: string;
  transcript?: string;
  includeDrAssist?: boolean;
  /** Per-agent timeout (default 8s — deterministic paths are fast) */
  agentTimeoutMs?: number;
  /** Overall budget (default 25s) */
  overallTimeoutMs?: number;
};

class AgentTimeoutError extends Error {
  constructor(agent: OrchestrationAgentId, ms: number) {
    super(`${agent} timed out after ${ms}ms`);
    this.name = "AgentTimeoutError";
  }
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

function resolveReviewOrder(
  priority: QueuePriority,
  includeDrAssist: boolean
): OrchestrationAgentId[] {
  const rest: OrchestrationAgentId[] = includeDrAssist
    ? ["ORACLE", "SYNTHESIS", "DrASSIST"]
    : ["ORACLE", "SYNTHESIS"];
  if (priority === "Urgent") {
    return ["GUARDIAN", ...rest];
  }
  // Non-urgent: documentation first, then safety + risk
  const base: OrchestrationAgentId[] = includeDrAssist
    ? ["SYNTHESIS", "GUARDIAN", "ORACLE", "DrASSIST"]
    : ["SYNTHESIS", "GUARDIAN", "ORACLE"];
  return base;
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
 * Run SYNTHESIS + GUARDIAN + ORACLE (+ optional DrASSIST) against one patient context.
 * Drafts are independent — never mutate peer slots.
 */
export async function runAgentOrchestration(
  options: OrchestrationOptions
): Promise<OrchestrationResult> {
  const patientId = options.patientId.trim();
  const patient = getPatientById(patientId);
  if (!patient) {
    throw new Error(`Unknown patient for orchestration: ${patientId}`);
  }

  const agentTimeoutMs = options.agentTimeoutMs ?? 8_000;
  const overallTimeoutMs = options.overallTimeoutMs ?? 25_000;
  const includeDrAssist = options.includeDrAssist ?? true;
  const proposedDrug = options.proposedDrug?.trim() || null;
  const transcript =
    options.transcript?.trim() || buildDefaultTranscript(patient.name, patientId);

  const sharedContext: SharedPatientContext = {
    patientId,
    patientLabel: patient.name,
    proposedDrug,
    transcript,
    flags: [...(patient.flags ?? [])]
  };

  const overallStarted = Date.now();
  const perAgentMs: Partial<Record<OrchestrationAgentId, number>> = {};

  const runAll = async (): Promise<OrchestrationOutputs> => {
    // Parallel generation — each result lands in its own slot (no shared mutable draft)
    const [synthesisTimed, guardianTimed, oracleTimed] = await Promise.all([
      withTimeout(
        "SYNTHESIS",
        runSynthesisAgent({
          transcript,
          patientLabel: `${patient.name} (${patientId})`
        }),
        agentTimeoutMs
      ),
      withTimeout(
        "GUARDIAN",
        runGuardianAgent({
          patientId,
          proposedDrug: proposedDrug ?? undefined
        }),
        agentTimeoutMs
      ),
      withTimeout("ORACLE", runOracleAgent({ patientId }), agentTimeoutMs)
    ]);

    perAgentMs.SYNTHESIS = synthesisTimed.elapsedMs;
    perAgentMs.GUARDIAN = guardianTimed.elapsedMs;
    perAgentMs.ORACLE = oracleTimed.elapsedMs;

    if (!oracleTimed.value) {
      throw new Error(`ORACLE returned null for ${patientId}`);
    }

    const outputs: OrchestrationOutputs = {
      SYNTHESIS: synthesisTimed.value,
      GUARDIAN: guardianTimed.value,
      ORACLE: oracleTimed.value
    };

    if (includeDrAssist) {
      const drAssistTimed = await withTimeout(
        "DrASSIST",
        runDrAssistAgent({ patientId }),
        agentTimeoutMs
      );
      perAgentMs.DrASSIST = drAssistTimed.elapsedMs;
      if (!drAssistTimed.value) {
        throw new Error(`DrASSIST returned null for ${patientId}`);
      }
      outputs.DrASSIST = drAssistTimed.value;
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
      })
    ]).finally(() => {
      if (overallTimer) clearTimeout(overallTimer);
    });
  } catch (error) {
    if (error instanceof AgentTimeoutError || timedOut) {
      timedOut = true;
    }
    throw error;
  }

  // Shared-context assertions (throw = fail the proof)
  assertSharedContext(sharedContext, outputs);

  const queuePriority = resolveQueuePriority(
    outputs.GUARDIAN,
    outputs.ORACLE,
    sharedContext.flags
  );
  const reviewOrder = resolveReviewOrder(queuePriority, includeDrAssist);
  const evidence = collectEvidence(outputs);
  const outputSlots = Object.keys(outputs) as OrchestrationAgentId[];

  // No-overwrite: each slot must remain a distinct object reference
  assertNoOverwrite(outputs);

  if (!evidence.every((e) => e.evidenced)) {
    const weak = evidence.filter((e) => !e.evidenced).map((e) => e.agent);
    throw new Error(`Independent evidence missing for: ${weak.join(", ")}`);
  }

  if (queuePriority === "Urgent" && reviewOrder[0] !== "GUARDIAN") {
    throw new Error("Urgent orchestration must prioritise GUARDIAN first");
  }

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
    perAgentMs
  };
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
    outputs.DrASSIST
  ].filter(Boolean);
  const unique = new Set(refs);
  if (unique.size !== refs.length) {
    throw new Error("Agent outputs share object references — overwrite risk");
  }
}
