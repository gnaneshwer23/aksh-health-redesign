/** Agent model calls are opt-in per agent and never happen in the real workspace (audit P0-3). Pure. */
import assert from "node:assert/strict";

import { llmAgentEnabled } from "../lib/ai/llm-gate";

assert.equal(llmAgentEnabled("SYNTHESIS", { AKSH_ENVIRONMENT: "simulation" }), false, "off by default");
assert.equal(llmAgentEnabled("SYNTHESIS", { AKSH_ENVIRONMENT: "simulation", ENABLE_LLM_SYNTHESIS: "true" }), true);
assert.equal(llmAgentEnabled("GUARDIAN", { AKSH_ENVIRONMENT: "simulation", ENABLE_LLM_SYNTHESIS: "true" }), false, "each agent needs its own flag");
assert.equal(llmAgentEnabled("SYNTHESIS", { AKSH_ENVIRONMENT: "production", ENABLE_LLM_SYNTHESIS: "true" }), false, "never in production");
assert.equal(llmAgentEnabled("SYNTHESIS", { AKSH_ENVIRONMENT: "simulation", AKSH_REAL_WORKSPACE: "true", ENABLE_LLM_SYNTHESIS: "true" }), false, "never in the real workspace");
assert.equal(llmAgentEnabled("NEXUS", { AKSH_ENVIRONMENT: "simulation", ENABLE_LLM_NEXUS: "false" }), false);
console.log("llm-gate: opt-in per agent, never in the real workspace — PASS");
