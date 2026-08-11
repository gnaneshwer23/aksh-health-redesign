/**
 * Phase 2 roadmap-agent capability status — E1 (docs/PHASED_BUILD_PLAN_E.md).
 *
 * PRISM (Imaging Intelligence) and ATLAS (Clinical Research) are listed in
 * `AGENT_DIRECTORY` (lib/agents.ts) with `phase: 2, live: false` — they are
 * roadmap entries, not built capabilities. Unlike EMIS (lib/emis-staging.ts)
 * and federated research (lib/precision-health/federated-research.ts), which
 * each have a single authoritative "here is exactly what this is and is not"
 * status object, PRISM/ATLAS honesty previously lived only as scattered copy
 * strings across marketing/onboarding/researcher-dashboard surfaces. This
 * module is that missing single source of truth — read-only, no side
 * effects, no env-driven behaviour (there is no sandbox/flag to flip here;
 * these two agents are simply not built).
 *
 * Per docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-1: "Build only against a
 * concrete, funded use case — not speculatively." This module does not
 * change that; it only makes the current "not built" state machine-readable.
 *
 * Hard invariant: every status this module returns has `live: false`,
 * `built: false`, `wired: false`. No code path in this file can make either
 * agent appear live, built, or wired — there is no parameter, env var, or
 * flag that flips any of these three fields.
 */

export type Phase2AgentId = "PRISM" | "ATLAS";

export type Phase2CapabilityStatus = {
  agentId: Phase2AgentId;
  label: string;
  category: string;
  phase: 2;
  live: false;
  built: false;
  wired: false;
  description: string;
  notBuiltReason: string;
  roadmapNote: string;
};

const ROADMAP_NOTE =
  "Phase 2 roadmap only — build only against a concrete, funded use case, not speculatively (docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-1).";

export function getPrismCapabilityStatus(): Phase2CapabilityStatus {
  return {
    agentId: "PRISM",
    label: "PRISM",
    category: "Imaging Intelligence Agent",
    phase: 2,
    live: false,
    built: false,
    wired: false,
    description:
      "Roadmap agent for imaging-derived clinical signal (e.g. radiology/report-adjacent intelligence). No imaging ingestion, no DICOM handling, and no image-analysis logic exist in this codebase today.",
    notBuiltReason:
      "No concrete, funded imaging use case has been commissioned. Listed in AGENT_DIRECTORY as phase:2, live:false so it is never confused with a Phase-1 (live) agent.",
    roadmapNote: ROADMAP_NOTE
  };
}

export function getAtlasCapabilityStatus(): Phase2CapabilityStatus {
  return {
    agentId: "ATLAS",
    label: "ATLAS",
    category: "Clinical Research Agent",
    phase: 2,
    live: false,
    built: false,
    wired: false,
    description:
      "Roadmap agent for clinical-research coordination. Not the same surface as the federated-research ethics-gated stub (lib/precision-health/federated-research.ts), which already exists and is honestly labelled as synthetic-aggregate-only — ATLAS itself (an LLM-backed research agent) has no implementation.",
    notBuiltReason:
      "No concrete, funded clinical-research-agent use case has been commissioned. Listed in AGENT_DIRECTORY as phase:2, live:false so it is never confused with a Phase-1 (live) agent.",
    roadmapNote: ROADMAP_NOTE
  };
}

export function getPhase2AgentCapabilityStatus() {
  return {
    artifactType: "aksh-phase2-agent-capability-status",
    generatedAt: new Date().toISOString(),
    agents: [getPrismCapabilityStatus(), getAtlasCapabilityStatus()],
    notes: [
      ROADMAP_NOTE,
      "Neither PRISM nor ATLAS is wired into lib/clinical-spine/orchestrate.ts, AGENT_DIRECTORY's live field stays false for both, and neither performs any AI Gateway call.",
      "This status is informational only — it does not change AGENT_DIRECTORY, does not enable any code path, and carries no flag that can flip live/built/wired to true."
    ]
  };
}

export type Phase2AgentCapabilityStatusResponse = ReturnType<typeof getPhase2AgentCapabilityStatus>;
