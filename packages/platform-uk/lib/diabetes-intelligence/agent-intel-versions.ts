/**
 * Model and prompt version tracking for Phase 5 agent intelligence.
 * Versions change only via explicit governed release — never auto-bumped by drafting.
 */

import type { AgentIntelVersionPin } from "./agent-intel-types";

export const AGENT_INTEL_SCHEMA_VERSION = "agent-intel-draft-v1";

/** Frozen registry — append-only in product; tests assert pins stay stable unless deliberately updated. */
export const AGENT_INTEL_VERSION_REGISTRY: AgentIntelVersionPin[] = [
  {
    modelId: "aksh-diabetes-orchestrator",
    modelVersion: "synth-det-1.0.0",
    promptId: "diabetes-agent-intel-pack",
    promptVersion: "prompt-2026-10-29.1",
    draftingMode: "deterministic_synthetic",
  },
  {
    modelId: "aksh-diabetes-orchestrator",
    modelVersion: "synth-det-0.9.0",
    promptId: "diabetes-agent-intel-pack",
    promptVersion: "prompt-2026-10-01.0",
    draftingMode: "deterministic_synthetic",
  },
];

export const ACTIVE_AGENT_INTEL_VERSION: AgentIntelVersionPin = AGENT_INTEL_VERSION_REGISTRY[0];

export function pinEquals(a: AgentIntelVersionPin, b: AgentIntelVersionPin): boolean {
  return (
    a.modelId === b.modelId &&
    a.modelVersion === b.modelVersion &&
    a.promptId === b.promptId &&
    a.promptVersion === b.promptVersion &&
    a.draftingMode === b.draftingMode
  );
}

export function formatVersionPin(pin: AgentIntelVersionPin): string {
  return `${pin.modelId}@${pin.modelVersion}/${pin.promptId}@${pin.promptVersion}`;
}

/**
 * Live LLM drafting is opt-in via ENABLE_LLM_* + provider; Phase 5 tests stay offline-safe
 * and always use deterministic_synthetic. This helper documents the gate only.
 */
export function resolveDraftingMode(env: Record<string, string | undefined> = process.env): AgentIntelVersionPin["draftingMode"] {
  const gated =
    env.ENABLE_LLM_SYNTHESIS?.trim().toLowerCase() === "true" ||
    env.ENABLE_LLM_DIABETES_AGENT_INTEL?.trim().toLowerCase() === "true";
  // Even when gated flags exist, Phase 5 orchestrator defaults to deterministic for honesty/offline tests.
  // Live LLM path is reserved for future in_validation promotion — not claimed here.
  void gated;
  return "deterministic_synthetic";
}
