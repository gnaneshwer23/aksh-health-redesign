/**
 * Milestone C2 — client-safe honesty strip view-model (no Node/llm-gate imports).
 * Server helpers that read ENABLE_LLM_* live in honesty-strip.ts.
 */

export const REVIEW_HONESTY_DOC = "docs/milestone-c/REVIEW_HONESTY.md" as const;

export const REVIEW_HONESTY_LINES = [
  "Simulation / synthetic validation — not a clinical device certification.",
  "Acceptance rate is a workflow metric, not a clinical accuracy score.",
  "LLM calls are gated; deterministic fallbacks may be in use.",
  "HITL required · ehrWrite: false · no autonomous Rx / live EHR write.",
  "Lab approve / pharmacy adherence paths remain simulation — not live NHS pathology or EPS.",
  "PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.",
] as const;

export type LlmSessionMode = "deterministic_week" | "opt_in_llm_week";

export type AdapterSimLabel = {
  id: string;
  label: string;
  live: false;
};

export const ADAPTER_SIM_LABELS: AdapterSimLabel[] = [
  { id: "lab", label: "Lab path: simulation", live: false },
  { id: "pharmacy", label: "Pharmacy / adherence: simulation", live: false },
  { id: "ehr", label: "EHR write-back: off (ehrWrite:false)", live: false },
  { id: "eps", label: "EPS: not live", live: false },
];

export type AgentExecutionModeLike = {
  agentId: string;
  executionMode: string;
};

export type ReviewHonestyRunSummary = {
  overallMode: "deterministic" | "llm" | "hybrid" | "orchestrator" | "unknown";
  overallLabel: string;
  agentModes: AgentExecutionModeLike[];
  evidenceRefCount: number;
  hitlRequired: true;
  ehrWrite: false;
  correlationId: string | null;
  guardianOutcome: string | null;
};

export type ReviewHonestySessionSnapshot = {
  mode: LlmSessionMode;
  label: string;
  note: string;
  enabledAgents: string[];
};

export type ReviewHonestyStripModel = {
  surface: string;
  session: ReviewHonestySessionSnapshot;
  adapters: AdapterSimLabel[];
  run: ReviewHonestyRunSummary | null;
  lines: readonly string[];
  clinicalValidationClaim: false;
  ehrWrite: false;
  hitlRequired: true;
  docPath: typeof REVIEW_HONESTY_DOC;
};

const CONTENT_MODES = new Set(["deterministic", "llm", "rules", "scaffold"]);

export function summarizeExecutionModesFromAgents(
  agents: AgentExecutionModeLike[] | null | undefined,
  extras?: {
    evidenceRefCount?: number;
    correlationId?: string | null;
    guardianOutcome?: string | null;
  }
): ReviewHonestyRunSummary {
  const list = agents ?? [];
  const content = list.filter((a) => CONTENT_MODES.has(a.executionMode));
  const modes = new Set(content.map((a) => a.executionMode));
  const hasLlm = modes.has("llm");
  const hasDet = modes.has("deterministic") || modes.has("rules");
  let overallMode: ReviewHonestyRunSummary["overallMode"] = "unknown";
  let overallLabel = "Execution mode unknown";

  if (hasLlm && hasDet) {
    overallMode = "hybrid";
    overallLabel = "Hybrid run (LLM + deterministic agents)";
  } else if (hasLlm) {
    overallMode = "llm";
    overallLabel = "LLM execution (gated)";
  } else if (hasDet || content.length > 0) {
    overallMode = "deterministic";
    overallLabel = "Deterministic / rules execution";
  } else if (list.some((a) => a.executionMode === "orchestrator")) {
    overallMode = "orchestrator";
    overallLabel = "CONDUCTOR orchestrator (see agent slots)";
  }

  return {
    overallMode,
    overallLabel,
    agentModes: list.map((a) => ({ agentId: a.agentId, executionMode: a.executionMode })),
    evidenceRefCount: extras?.evidenceRefCount ?? 0,
    hitlRequired: true,
    ehrWrite: false,
    correlationId: extras?.correlationId ?? null,
    guardianOutcome: extras?.guardianOutcome ?? null,
  };
}

export function buildReviewHonestyStripModel(input?: {
  surface?: string;
  sessionMode?: LlmSessionMode | null;
  sessionLabel?: string | null;
  sessionNote?: string | null;
  enabledAgents?: string[] | null;
  runSummary?: ReviewHonestyRunSummary | null;
  agentModes?: AgentExecutionModeLike[] | null;
}): ReviewHonestyStripModel {
  const mode: LlmSessionMode = input?.sessionMode ?? "deterministic_week";
  const session: ReviewHonestySessionSnapshot = {
    mode,
    label:
      input?.sessionLabel ??
      (mode === "deterministic_week"
        ? "Deterministic week (ENABLE_LLM_*=false)"
        : "Opt-in LLM week"),
    note:
      input?.sessionNote ??
      (mode === "deterministic_week"
        ? "Baseline HCP eval path — drafts use rules / deterministic fallbacks. Opt-in LLM week requires separate facilitator documentation."
        : "One or more ENABLE_LLM_* flags are on in this simulation workspace. Still not clinical validation; ehrWrite remains false."),
    enabledAgents: input?.enabledAgents ?? [],
  };

  const run =
    input?.runSummary ??
    (input?.agentModes && input.agentModes.length > 0
      ? summarizeExecutionModesFromAgents(input.agentModes)
      : null);

  return {
    surface: input?.surface ?? "Clinician review",
    session,
    adapters: ADAPTER_SIM_LABELS,
    run,
    lines: REVIEW_HONESTY_LINES,
    clinicalValidationClaim: false,
    ehrWrite: false,
    hitlRequired: true,
    docPath: REVIEW_HONESTY_DOC,
  };
}
