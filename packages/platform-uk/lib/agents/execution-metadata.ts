/**
 * Milestone A1 — standardised agent execution metadata.
 *
 * Honest runtime contract for every agent invocation (CONDUCTOR fan-out and
 * spine façade). Extends existing draft `mode` / SHIELD / care-episode fields
 * without introducing a parallel orchestration engine.
 *
 * Retries: clinical draft generation is fail-closed by default (maxRetries=0).
 * Transient infra may be marked retryable in classification; callers must opt in.
 */

import { randomUUID } from "node:crypto";

import { aiProvider } from "../ai/model";
import { llmAgentEnabled, type LlmAgent } from "../ai/llm-gate";
import type { AgentEscalation } from "./contracts/types";
import type { AgentId } from "./register";
import { AGENTS } from "./register";

/** How the agent actually ran — never claim LLM when the deterministic path was used. */
export type AgentExecutionMode =
  | "deterministic"
  | "llm"
  | "rules"
  | "scaffold"
  | "unavailable"
  | "orchestrator";

export type AgentRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "partial"
  | "timed_out"
  | "failed"
  | "blocked"
  | "skipped";

export type AgentReviewStatus = "not_required" | "pending_hitl" | "accepted" | "edited" | "rejected" | "blocked_from_queue";

export type AgentErrorCode =
  | "MISSING_CONTEXT"
  | "INVALID_INPUT"
  | "UNKNOWN_PATIENT"
  | "TIMEOUT"
  | "OVERALL_TIMEOUT"
  | "UPSTREAM"
  | "LLM_UNAVAILABLE"
  | "GATEWAY_BLOCK"
  | "PROHIBITED_ACTION"
  | "CROSS_TENANT"
  | "DUPLICATE_RUN"
  | "EVIDENCE_MISSING"
  | "AGENT_NOT_ALLOWED"
  | "SHIELD_UNAVAILABLE"
  | "INTERNAL";

export type AgentErrorClassification = {
  code: AgentErrorCode;
  message: string;
  /** Infra may retry; clinical draft generation defaults to non-retryable fail-closed. */
  retryable: boolean;
  agentId?: AgentId | string;
};

/** Per-agent version pins — append-only; bump deliberately (not auto). */
export type AgentVersionPin = {
  agentId: AgentId;
  agentVersion: string;
  promptId: string;
  promptVersion: string;
  rulesetId: string;
  rulesetVersion: string;
  /** Default model id when LLM path is enabled; null for rules-only agents. */
  defaultModelId: string | null;
  defaultModelVersion: string | null;
};

export const AGENT_RUNTIME_SCHEMA_VERSION = "agent-execution-metadata-v1";

/**
 * Frozen registry for Milestone A1. Prompt/ruleset versions describe the
 * in-repo system prompts / deterministic rules — not live production releases.
 */
export const AGENT_VERSION_REGISTRY: Record<AgentId, AgentVersionPin> = {
  CONDUCTOR: {
    agentId: "CONDUCTOR",
    agentVersion: "conductor-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "conductor-review-order",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  VOICE: {
    agentId: "VOICE",
    agentVersion: "voice-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "voice-intake",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  CANVAS: {
    agentId: "CANVAS",
    agentVersion: "canvas-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "intake-generation",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  SYNTHESIS: {
    agentId: "SYNTHESIS",
    agentVersion: "synthesis-1.0.0",
    promptId: "synthesis-soap",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "synthesis-deterministic-fallback",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  DrASSIST: {
    agentId: "DrASSIST",
    agentVersion: "drassist-1.0.0",
    promptId: "drassist-coding",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "drassist-lexicon",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  GUARDIAN: {
    agentId: "GUARDIAN",
    agentVersion: "guardian-1.0.0",
    promptId: "guardian-safety-brief",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "guardian-ddi-rules",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  HORIZON: {
    agentId: "HORIZON",
    agentVersion: "horizon-1.0.0",
    promptId: "horizon-risk-brief",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "horizon-composite-risk",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  NEXUS: {
    agentId: "NEXUS",
    agentVersion: "nexus-1.0.0",
    promptId: "nexus-correlations",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "nexus-deterministic-correlations",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  PATHWAY: {
    agentId: "PATHWAY",
    agentVersion: "pathway-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "referral-packaging",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  BRIDGE: {
    agentId: "BRIDGE",
    agentVersion: "bridge-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "fhir-r4-staging",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  SHIELD: {
    agentId: "SHIELD",
    agentVersion: "shield-1.0.0",
    promptId: "none",
    promptVersion: "n/a",
    rulesetId: "shield-append-only",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  COMPASS: {
    agentId: "COMPASS",
    agentVersion: "compass-1.0.0",
    promptId: "compass-population-brief",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "compass-aggregate",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: "openai/gpt-5.4-mini",
    defaultModelVersion: "gated",
  },
  PRISM: {
    agentId: "PRISM",
    agentVersion: "prism-scaffold-0.1.0",
    promptId: "prism-synthetic-eval",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "prism-dicom-meta-fixture",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
  ATLAS: {
    agentId: "ATLAS",
    agentVersion: "atlas-scaffold-0.1.0",
    promptId: "atlas-synthetic-eval",
    promptVersion: "prompt-2026-10-30.1",
    rulesetId: "atlas-protocol-fixture",
    rulesetVersion: "2026-10-30.1",
    defaultModelId: null,
    defaultModelVersion: null,
  },
};

export type AgentExecutionMetadata = {
  schemaVersion: typeof AGENT_RUNTIME_SCHEMA_VERSION;
  agentId: AgentId | string;
  executionMode: AgentExecutionMode;
  modelProvider: "openai" | "gateway" | "none";
  modelId: string | null;
  modelVersion: string | null;
  agentVersion: string;
  promptId: string;
  promptVersion: string;
  rulesetId: string;
  rulesetVersion: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  careEpisodeId: string | null;
  correlationId: string;
  evidenceRefs: string[];
  guardianOutcome: AgentEscalation | null;
  reviewStatus: AgentReviewStatus;
  errorCode: AgentErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  /** Attempts used (1 = first try). Clinical path keeps this at 1 unless opt-in retry. */
  attempt: number;
  maxRetries: number;
  ehrWrite: false;
  hitlRequired: true;
};

export type AgentRunBundleMetadata = {
  schemaVersion: typeof AGENT_RUNTIME_SCHEMA_VERSION;
  correlationId: string;
  careEpisodeId: string | null;
  scopeKey: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  status: AgentRunStatus;
  guardianOutcome: AgentEscalation | null;
  reviewStatus: AgentReviewStatus;
  agents: AgentExecutionMetadata[];
  evidenceRefs: string[];
  errorCode: AgentErrorCode | null;
  errorMessage: string | null;
  ehrWrite: false;
  hitlRequired: true;
};

const LLM_FLAG_BY_CANONICAL: Partial<Record<AgentId, LlmAgent>> = {
  SYNTHESIS: "SYNTHESIS",
  GUARDIAN: "GUARDIAN",
  HORIZON: "ORACLE",
  NEXUS: "NEXUS",
  DrASSIST: "DR_ASSIST",
  COMPASS: "EQUITY",
};

export function resolveHonestExecutionMode(
  agentId: AgentId,
  draftMode?: "llm" | "deterministic" | null
): AgentExecutionMode {
  const contract = AGENTS.find((a) => a.id === agentId);
  if (!contract) return "unavailable";
  if (agentId === "CONDUCTOR") return "orchestrator";
  if (agentId === "PRISM" || agentId === "ATLAS") return "scaffold";
  if (draftMode === "llm") return "llm";
  if (draftMode === "deterministic") return "deterministic";
  if (!contract.modelFlag) return "rules";
  const flag = LLM_FLAG_BY_CANONICAL[agentId];
  if (flag && llmAgentEnabled(flag)) return "llm";
  return "deterministic";
}

export function resolveModelProvider(executionMode: AgentExecutionMode): "openai" | "gateway" | "none" {
  if (executionMode !== "llm") return "none";
  return aiProvider() ?? "none";
}

export function newCorrelationId(prefix = "aksh-run"): string {
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

export function buildAgentExecutionMetadata(input: {
  agentId: AgentId;
  executionMode?: AgentExecutionMode;
  draftMode?: "llm" | "deterministic" | null;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  careEpisodeId?: string | null;
  correlationId: string;
  evidenceRefs?: string[];
  guardianOutcome?: AgentEscalation | null;
  reviewStatus?: AgentReviewStatus;
  error?: AgentErrorClassification | null;
  attempt?: number;
  maxRetries?: number;
}): AgentExecutionMetadata {
  const pin = AGENT_VERSION_REGISTRY[input.agentId];
  const executionMode =
    input.executionMode ?? resolveHonestExecutionMode(input.agentId, input.draftMode ?? null);
  const usedLlm = executionMode === "llm";
  const completedAt = input.completedAt ?? (input.status === "running" || input.status === "pending" ? null : new Date().toISOString());
  const durationMs =
    input.durationMs ??
    (completedAt ? Math.max(0, Date.parse(completedAt) - Date.parse(input.startedAt)) : null);

  return {
    schemaVersion: AGENT_RUNTIME_SCHEMA_VERSION,
    agentId: input.agentId,
    executionMode,
    modelProvider: resolveModelProvider(executionMode),
    modelId: usedLlm ? pin.defaultModelId : null,
    modelVersion: usedLlm ? pin.defaultModelVersion : null,
    agentVersion: pin.agentVersion,
    promptId: pin.promptId,
    promptVersion: pin.promptVersion,
    rulesetId: pin.rulesetId,
    rulesetVersion: pin.rulesetVersion,
    status: input.status,
    startedAt: input.startedAt,
    completedAt,
    durationMs,
    careEpisodeId: input.careEpisodeId ?? null,
    correlationId: input.correlationId,
    evidenceRefs: input.evidenceRefs ?? [],
    guardianOutcome: input.guardianOutcome ?? null,
    reviewStatus: input.reviewStatus ?? (input.status === "blocked" ? "blocked_from_queue" : "pending_hitl"),
    errorCode: input.error?.code ?? null,
    errorMessage: input.error?.message ?? null,
    retryable: input.error?.retryable ?? false,
    attempt: input.attempt ?? 1,
    maxRetries: input.maxRetries ?? 0,
    ehrWrite: false,
    hitlRequired: true,
  };
}

export function buildRunBundleMetadata(input: {
  correlationId: string;
  careEpisodeId?: string | null;
  scopeKey?: string | null;
  startedAt: string;
  completedAt?: string | null;
  status: AgentRunStatus;
  agents: AgentExecutionMetadata[];
  guardianOutcome?: AgentEscalation | null;
  reviewStatus?: AgentReviewStatus;
  evidenceRefs?: string[];
  error?: AgentErrorClassification | null;
}): AgentRunBundleMetadata {
  const completedAt = input.completedAt ?? new Date().toISOString();
  return {
    schemaVersion: AGENT_RUNTIME_SCHEMA_VERSION,
    correlationId: input.correlationId,
    careEpisodeId: input.careEpisodeId ?? null,
    scopeKey: input.scopeKey ?? null,
    startedAt: input.startedAt,
    completedAt,
    durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(input.startedAt)),
    status: input.status,
    guardianOutcome: input.guardianOutcome ?? null,
    reviewStatus: input.reviewStatus ?? "pending_hitl",
    agents: input.agents,
    evidenceRefs: input.evidenceRefs ?? input.agents.flatMap((a) => a.evidenceRefs),
    errorCode: input.error?.code ?? null,
    errorMessage: input.error?.message ?? null,
    ehrWrite: false,
    hitlRequired: true,
  };
}

export class AgentRuntimeError extends Error {
  readonly classification: AgentErrorClassification;

  constructor(classification: AgentErrorClassification) {
    super(classification.message);
    this.name = "AgentRuntimeError";
    this.classification = classification;
  }
}

export function classifyAgentError(error: unknown, agentId?: AgentId | string): AgentErrorClassification {
  if (error instanceof AgentRuntimeError) {
    return error.classification;
  }

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";

  if (name === "AgentTimeoutError" || /timed out after \d+ms/i.test(message)) {
    return { code: "TIMEOUT", message, retryable: false, agentId };
  }
  if (/overall timeout/i.test(message)) {
    return { code: "OVERALL_TIMEOUT", message, retryable: false, agentId };
  }
  if (/unknown patient/i.test(message)) {
    return { code: "UNKNOWN_PATIENT", message, retryable: false, agentId };
  }
  if (/missing (context|patient|transcript|scope)/i.test(message) || /no transcript/i.test(message)) {
    return { code: "MISSING_CONTEXT", message, retryable: false, agentId };
  }
  if (/cross[- ]tenant|scopeKey mismatch|wrong organisation/i.test(message)) {
    return { code: "CROSS_TENANT", message, retryable: false, agentId };
  }
  if (/duplicate|idempotency/i.test(message)) {
    return { code: "DUPLICATE_RUN", message, retryable: false, agentId };
  }
  if (/evidence missing|independent evidence/i.test(message)) {
    return { code: "EVIDENCE_MISSING", message, retryable: false, agentId };
  }
  if (/gateway.?block|blocked by guardian/i.test(message)) {
    return { code: "GATEWAY_BLOCK", message, retryable: false, agentId };
  }
  if (/prohibited|ehr write|prescribe/i.test(message)) {
    return { code: "PROHIBITED_ACTION", message, retryable: false, agentId };
  }
  if (/ECONNRESET|ETIMEDOUT|fetch failed|429|503|rate limit/i.test(message)) {
    return { code: "UPSTREAM", message, retryable: true, agentId };
  }
  if (/llm|model|AI Gateway|openai/i.test(message)) {
    return { code: "LLM_UNAVAILABLE", message, retryable: true, agentId };
  }

  return { code: "INTERNAL", message, retryable: false, agentId };
}

/**
 * Validate runtime scope for tenant isolation. Throws classified CROSS_TENANT
 * when an explicit expected scope disagrees with the request scope.
 */
export function assertRuntimeScope(input: {
  requestScopeKey: string | null | undefined;
  expectedScopeKey: string | null | undefined;
  patientId?: string;
}): void {
  const request = input.requestScopeKey?.trim() || null;
  const expected = input.expectedScopeKey?.trim() || null;
  if (!request || !expected) return;
  if (request !== expected) {
    throw new AgentRuntimeError({
      code: "CROSS_TENANT",
      message: `scopeKey mismatch: request=${request} expected=${expected}${
        input.patientId ? ` patientId=${input.patientId}` : ""
      }`,
      retryable: false,
    });
  }
}

/** In-memory idempotency guard for a single process (A1). Durable dedupe is A2. */
const recentRunKeys = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 60_000;

export function assertNotDuplicateRun(idempotencyKey: string | null | undefined, now = Date.now()): void {
  if (!idempotencyKey?.trim()) return;
  const key = idempotencyKey.trim();
  for (const [k, at] of recentRunKeys) {
    if (now - at > IDEMPOTENCY_TTL_MS) recentRunKeys.delete(k);
  }
  if (recentRunKeys.has(key)) {
    throw new AgentRuntimeError({
      code: "DUPLICATE_RUN",
      message: `Duplicate agent run for idempotencyKey=${key}`,
      retryable: false,
    });
  }
  recentRunKeys.set(key, now);
}

/** Test helper — clears the process-local idempotency map. */
export function resetRuntimeIdempotencyForTests(): void {
  recentRunKeys.clear();
}

/**
 * Timeout + optional retry wrapper. Clinical agents should keep maxRetries=0
 * (fail-closed). Transient UPSTREAM-only retries must be explicit.
 */
export async function runWithAgentReliability<T>(input: {
  agentId: AgentId | string;
  timeoutMs: number;
  maxRetries?: number;
  retryOn?: AgentErrorCode[];
  run: (attempt: number) => Promise<T>;
}): Promise<{ value: T; elapsedMs: number; attempt: number }> {
  const maxRetries = input.maxRetries ?? 0;
  const retryOn = new Set(input.retryOn ?? ["UPSTREAM"]);
  const started = Date.now();
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    attempt += 1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const value = await Promise.race([
        input.run(attempt),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            const err = new Error(`${input.agentId} timed out after ${input.timeoutMs}ms`);
            err.name = "AgentTimeoutError";
            reject(err);
          }, input.timeoutMs);
        }),
      ]);
      return { value, elapsedMs: Date.now() - started, attempt };
    } catch (error) {
      lastError = error;
      const classified = classifyAgentError(error, input.agentId);
      if (attempt <= maxRetries && classified.retryable && retryOn.has(classified.code)) {
        continue;
      }
      throw error instanceof AgentRuntimeError
        ? error
        : new AgentRuntimeError(classified);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function requiredMetadataFields(): (keyof AgentExecutionMetadata)[] {
  return [
    "schemaVersion",
    "agentId",
    "executionMode",
    "modelProvider",
    "modelId",
    "modelVersion",
    "agentVersion",
    "promptId",
    "promptVersion",
    "rulesetId",
    "rulesetVersion",
    "status",
    "startedAt",
    "completedAt",
    "durationMs",
    "careEpisodeId",
    "correlationId",
    "evidenceRefs",
    "guardianOutcome",
    "reviewStatus",
    "errorCode",
    "errorMessage",
    "retryable",
    "attempt",
    "maxRetries",
    "ehrWrite",
    "hitlRequired",
  ];
}

export function assertMetadataComplete(meta: AgentExecutionMetadata): void {
  for (const field of requiredMetadataFields()) {
    if (!(field in meta)) {
      throw new AgentRuntimeError({
        code: "INTERNAL",
        message: `Agent execution metadata missing field: ${field}`,
        retryable: false,
        agentId: String(meta.agentId),
      });
    }
  }
  if (meta.ehrWrite !== false) {
    throw new AgentRuntimeError({
      code: "PROHIBITED_ACTION",
      message: "Agent execution metadata must declare ehrWrite:false",
      retryable: false,
      agentId: String(meta.agentId),
    });
  }
  if (meta.hitlRequired !== true) {
    throw new AgentRuntimeError({
      code: "PROHIBITED_ACTION",
      message: "Agent execution metadata must declare hitlRequired:true",
      retryable: false,
      agentId: String(meta.agentId),
    });
  }
  if (meta.executionMode === "llm" && !meta.modelId) {
    throw new AgentRuntimeError({
      code: "INTERNAL",
      message: "LLM executionMode requires modelId",
      retryable: false,
      agentId: String(meta.agentId),
    });
  }
  if (meta.executionMode !== "llm" && meta.modelProvider !== "none") {
    throw new AgentRuntimeError({
      code: "INTERNAL",
      message: `Non-LLM mode ${meta.executionMode} must not claim modelProvider=${meta.modelProvider}`,
      retryable: false,
      agentId: String(meta.agentId),
    });
  }
}
