/**
 * Milestone C2 — review-surface honesty strip helpers (server-capable).
 *
 * Surfaces A1 executionMode / evidence honesty + Milestone B Agent Ops copy on
 * GP (and related clinician) review paths. Synthetic / eval only — never implies
 * clinical validation or live EHR write.
 */

import { llmAgentEnabled, type LlmAgent } from "@/lib/ai/llm-gate";
import type {
  AgentExecutionMetadata,
  AgentRunBundleMetadata,
} from "@/lib/agents/execution-metadata";
import {
  ADAPTER_SIM_LABELS,
  REVIEW_HONESTY_DOC,
  REVIEW_HONESTY_LINES,
  buildReviewHonestyStripModel as buildClientModel,
  summarizeExecutionModesFromAgents,
  type LlmSessionMode,
  type ReviewHonestyRunSummary,
  type ReviewHonestyStripModel,
} from "@/lib/review/honesty-strip-client";

export {
  ADAPTER_SIM_LABELS,
  REVIEW_HONESTY_DOC,
  REVIEW_HONESTY_LINES,
  summarizeExecutionModesFromAgents,
  type AdapterSimLabel,
  type AgentExecutionModeLike,
  type LlmSessionMode,
  type ReviewHonestyRunSummary,
  type ReviewHonestySessionSnapshot,
  type ReviewHonestyStripModel,
} from "@/lib/review/honesty-strip-client";

const LLM_AGENTS: LlmAgent[] = ["SYNTHESIS", "GUARDIAN", "ORACLE", "DR_ASSIST", "NEXUS", "EQUITY"];

export type LlmSessionModeSnapshot = {
  mode: LlmSessionMode;
  label: string;
  enabledAgents: LlmAgent[];
  note: string;
  clinicalValidationClaim: false;
  ehrWrite: false;
};

type EnvLike = Record<string, string | undefined>;

export function resolveLlmSessionMode(env: EnvLike = process.env): LlmSessionModeSnapshot {
  const enabledAgents = LLM_AGENTS.filter((a) => llmAgentEnabled(a, env));
  if (enabledAgents.length === 0) {
    return {
      mode: "deterministic_week",
      label: "Deterministic week (ENABLE_LLM_*=false)",
      enabledAgents: [],
      note: "Baseline HCP eval path — drafts use rules / deterministic fallbacks. Opt-in LLM week requires separate facilitator documentation.",
      clinicalValidationClaim: false,
      ehrWrite: false,
    };
  }
  return {
    mode: "opt_in_llm_week",
    label: `Opt-in LLM week (${enabledAgents.join(", ")})`,
    enabledAgents,
    note: "One or more ENABLE_LLM_* flags are on in this simulation workspace. Still not clinical validation; ehrWrite remains false.",
    clinicalValidationClaim: false,
    ehrWrite: false,
  };
}

export function summarizeExecutionModes(
  agents: Array<Pick<AgentExecutionMetadata, "agentId" | "executionMode">> | null | undefined,
  bundle?: Pick<
    AgentRunBundleMetadata,
    "evidenceRefs" | "correlationId" | "guardianOutcome" | "ehrWrite" | "hitlRequired"
  > | null
): ReviewHonestyRunSummary {
  return summarizeExecutionModesFromAgents(
    (agents ?? []).map((a) => ({
      agentId: String(a.agentId),
      executionMode: a.executionMode,
    })),
    {
      evidenceRefCount: bundle?.evidenceRefs?.length ?? 0,
      correlationId: bundle?.correlationId ?? null,
      guardianOutcome: bundle?.guardianOutcome ?? null,
    }
  );
}

export function buildReviewHonestyStripModel(input?: {
  surface?: string;
  env?: EnvLike;
  execution?: AgentRunBundleMetadata | null;
  agents?: Array<Pick<AgentExecutionMetadata, "agentId" | "executionMode">> | null;
}): ReviewHonestyStripModel {
  const session = resolveLlmSessionMode(input?.env ?? process.env);
  const agents = input?.agents ?? input?.execution?.agents ?? null;
  const run =
    agents && agents.length > 0 ? summarizeExecutionModes(agents, input?.execution ?? null) : null;

  return buildClientModel({
    surface: input?.surface,
    sessionMode: session.mode,
    sessionLabel: session.label,
    sessionNote: session.note,
    enabledAgents: session.enabledAgents,
    runSummary: run,
  });
}

/** Payload fragment for GET /api/agents/orchestrate capabilities (thin session-mode hook). */
export function llmSessionModeCapabilities(env: EnvLike = process.env) {
  const session = resolveLlmSessionMode(env);
  return {
    llmSessionMode: session.mode,
    llmSessionLabel: session.label,
    llmEnabledAgents: session.enabledAgents,
    llmSessionNote: session.note,
    clinicalValidationClaim: false as const,
    ehrWrite: false as const,
    hitlRequired: true as const,
    adapters: ADAPTER_SIM_LABELS,
    honestyLines: REVIEW_HONESTY_LINES,
    honestyDoc: REVIEW_HONESTY_DOC,
  };
}
