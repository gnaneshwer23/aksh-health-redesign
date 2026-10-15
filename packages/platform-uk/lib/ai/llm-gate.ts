/**
 * Whether a clinical-proof agent may call a language model. Opt-in: an agent calls a model only when its own
 * ENABLE_LLM_<AGENT>=true is set and a provider is configured. Never in the real workspace (production), whatever the
 * flags say: no patient data goes to a model there. Without the flag the agent uses its rules-based path.
 */
import { isRealWorkspace } from "../env/workspace";

import { aiConfigured } from "./model";

export type LlmAgent = "SYNTHESIS" | "GUARDIAN" | "ORACLE" | "DR_ASSIST" | "NEXUS" | "EQUITY";

type EnvLike = Record<string, string | undefined>;

export function llmAgentEnabled(agent: LlmAgent, env: EnvLike = process.env): boolean {
  if (isRealWorkspace(env)) return false;
  if (env[`ENABLE_LLM_${agent}`]?.trim().toLowerCase() !== "true") return false;
  return env === process.env ? aiConfigured() : true;
}
