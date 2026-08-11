import type {
  ClinicalAgentId,
  OracleRiskScore,
  ReviewCase,
  ReviewQueueItem,
  ReviewQueueItemStatus,
  ReviewQueueItemType,
  SafetyFlag
} from "./types";
import { deriveSafetyFlags } from "./workflow/safety";

export type { ClinicalAgentId, OracleRiskScore, ReviewQueueItem, ReviewQueueItemStatus, ReviewQueueItemType } from "./types";

export type AgentStatus = "idle" | "active" | "draft_pending" | "completed" | "alert";

export type AgentCard = {
  id: ClinicalAgentId;
  label: string;
  function: string;
  status: AgentStatus;
  detail: string;
  queueFilter?: ReviewQueueItemType;
};

export const CLINICAL_AGENT_META: Record<
  ClinicalAgentId,
  { label: string; function: string; description: string }
> = {
  VOICE: {
    label: "VOICE",
    function: "Dictation → CANVAS (sub-capability)",
    description:
      "Dictation feeds CANVAS clinical intake and stages a transcript for HITL — not a peer 12-agent directory entry."
  },
  SYNTHESIS: {
    label: "SYNTHESIS",
    function: "SOAP draft generation",
    description: "Encounter narrative → SOAP DocumentReference (draft)."
  },
  DrASSIST: {
    label: "Dr.Assist",
    function: "Coding support (sub-capability)",
    description:
      "SNOMED / ICD-10 coding drafts under SYNTHESIS / HITL — not a peer 12-agent directory entry. John Snow Labs NLP path is not wired (deterministic / AI Gateway drafts only)."
  },
  GUARDIAN: {
    label: "GUARDIAN",
    function: "DDI / safety alerts",
    description: "Drug interaction and allergy flags on MedicationRequest."
  },
  ORACLE: {
    label: "HORIZON",
    function: "CVD / T2D risk score",
    description: "Risk stratification with contributing factors."
  },
  REFERRAL: {
    label: "PATHWAY",
    function: "Care coordination",
    description: "Referral package draft → ServiceRequest after GP Accept."
  },
  EQUITY: {
    label: "COMPASS",
    function: "Population health",
    description: "IMD / ethnicity disparity signals (admin review: Phase B)."
  },
  SHIELD: {
    label: "SHIELD",
    function: "Compliance audit trail",
    description: "Immutable AuditEvent on every reviewer action."
  }
};

/**
 * C3 (docs/PHASED_BUILD_PLAN_C.md, P0-3) — agent-directory classification.
 * Additive-only: classifies whether an AGENT_DIRECTORY entry is agentic
 * coordination or a deterministic tool/service, which frozen-architecture
 * layer(s) it operates in, and whether it is kept. This is a classification
 * pass, not a pruning pass — see docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md §2.1's
 * explicit correction: "zero deletions... only the additive kind
 * classification field."
 */
export type AgentKind =
  | "orchestration"
  | "intelligence_llm"
  | "intervention"
  | "data_interop"
  | "safety_governance";

export type AgentLayer =
  | "patient_state"
  | "intelligence"
  | "decision"
  | "intervention"
  | "learning"
  | "data_interop"
  | "safety_governance";

export type AgentKeepStatus = "keep";

/**
 * Canonical 12-agent directory (Agent Naming Reference, July 2026).
 * ORACLE→HORIZON, EQUITY→COMPASS, REFERRAL→PATHWAY are label renames only —
 * internal ids, env vars, and API routes keep the legacy names as aliases.
 * PRISM and ATLAS are Phase 2 roadmap agents and are not built.
 * VOICE and Dr.Assist are intake/coding sub-capabilities — intentionally not
 * listed here as peer Phase-1 agents (see CLINICAL_AGENT_META).
 *
 * `kind`/`layer`/`keepStatus` populated per
 * docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md §2.1's agent-mapping table (C3).
 * All 12 entries are `keepStatus: "keep"` — no entry is removed, merged, or
 * reclassified as a tool by this directory.
 */
export const AGENT_DIRECTORY = [
  { name: "CANVAS", role: "Clinical Intake Agent", category: "Intake", phase: 1, live: true, previously: "unnamed (intake generation / shared patient context)", kind: "intelligence_llm", layer: ["intelligence", "patient_state"], keepStatus: "keep" },
  { name: "SYNTHESIS", role: "Clinical Documentation Agent", category: "Documentation", phase: 1, live: true, previously: "SYNTHESIS", kind: "intelligence_llm", layer: ["intelligence"], keepStatus: "keep" },
  { name: "BRIDGE", role: "Interoperability Agent", category: "Integration", phase: 1, live: true, previously: "unnamed (Medplum staging / FHIR mapping)", kind: "data_interop", layer: ["data_interop"], keepStatus: "keep" },
  { name: "NEXUS", role: "Clinical Intelligence Agent", category: "Intelligence", phase: 1, live: true, previously: "new capability", kind: "intelligence_llm", layer: ["intelligence"], keepStatus: "keep" },
  { name: "GUARDIAN", role: "Medication Intelligence Agent", category: "Safety", phase: 1, live: true, previously: "GUARDIAN", kind: "safety_governance", layer: ["safety_governance", "intelligence"], keepStatus: "keep" },
  { name: "PRISM", role: "Imaging Intelligence Agent", category: "Imaging", phase: 2, live: false, previously: "new agent (roadmap)", kind: "intelligence_llm", layer: ["intelligence"], keepStatus: "keep" },
  { name: "HORIZON", role: "Predictive Risk Agent", category: "Risk", phase: 1, live: true, previously: "ORACLE", kind: "intelligence_llm", layer: ["intelligence"], keepStatus: "keep" },
  { name: "PATHWAY", role: "Care Coordination Agent", category: "Coordination", phase: 1, live: true, previously: "REFERRAL", kind: "intervention", layer: ["intervention"], keepStatus: "keep" },
  { name: "COMPASS", role: "Population Health Agent", category: "Population", phase: 1, live: true, previously: "EQUITY", kind: "intelligence_llm", layer: ["decision", "intervention"], keepStatus: "keep" },
  { name: "ATLAS", role: "Clinical Research Agent", category: "Research", phase: 2, live: false, previously: "new agent (roadmap)", kind: "intelligence_llm", layer: ["intelligence"], keepStatus: "keep" },
  { name: "SHIELD", role: "Regulatory & Audit Agent", category: "Governance", phase: 1, live: true, previously: "SHIELD", kind: "safety_governance", layer: ["safety_governance"], keepStatus: "keep" },
  { name: "CONDUCTOR", role: "Supervisor Agent", category: "Orchestration", phase: 1, live: true, previously: "unnamed (clinical-spine orchestrate)", kind: "orchestration", layer: ["intelligence", "decision"], keepStatus: "keep" }
] as const satisfies ReadonlyArray<{
  name: string;
  role: string;
  category: string;
  phase: number;
  live: boolean;
  previously: string;
  kind: AgentKind;
  layer: readonly AgentLayer[];
  keepStatus: AgentKeepStatus;
}>;

/** Legacy id → renamed label lookups for copy that carries raw agent strings. */
const AGENT_LABEL_ALIASES: Record<string, string> = {
  ORACLE: "HORIZON",
  EQUITY: "COMPASS",
  REFERRAL: "PATHWAY"
};

/** Resolve a clinical agent id (or alias) to its user-facing label. */
export function resolveClinicalAgentLabel(agent: string): string {
  if (agent in CLINICAL_AGENT_META) {
    return CLINICAL_AGENT_META[agent as ClinicalAgentId].label;
  }
  if (agent in AGENT_LABEL_ALIASES) {
    return AGENT_LABEL_ALIASES[agent];
  }
  return agent;
}

/** Normalize legacy agent prefixes in timeline/audit copy (e.g. "DrASSIST: …" → "Dr.Assist: …"). */
export function formatAgentTimelineLabel(label: string): string {
  const colonIndex = label.indexOf(":");
  if (colonIndex === -1) {
    return resolveClinicalAgentLabel(label);
  }

  const prefix = label.slice(0, colonIndex).trim();
  const suffix = label.slice(colonIndex);
  const resolved = resolveClinicalAgentLabel(prefix);
  return resolved === prefix ? label : `${resolved}${suffix}`;
}

const AGENT_BADGE_CLASS: Record<ClinicalAgentId, string> = {
  VOICE: "agent-badge--voice",
  SYNTHESIS: "agent-badge--synthesis",
  DrASSIST: "agent-badge--drassist",
  GUARDIAN: "agent-badge--guardian",
  ORACLE: "agent-badge--oracle",
  REFERRAL: "agent-badge--referral",
  EQUITY: "agent-badge--equity",
  SHIELD: "agent-badge--shield"
};

export function agentBadgeClass(agentId: ClinicalAgentId) {
  return AGENT_BADGE_CLASS[agentId];
}

export function queueStatusLabel(status: ReviewQueueItemStatus) {
  if (status === "ACCEPTED") return "Accepted";
  if (status === "REJECTED") return "Rejected";
  return "Draft";
}

function buildVoiceItem(reviewCase: ReviewCase): ReviewQueueItem {
  return {
    id: `${reviewCase.id}-queue-voice`,
    agentId: "VOICE",
    itemType: "voice_transcript",
    status: "DRAFT",
    title: "Voice intake transcript",
    summary: reviewCase.input.summary,
    content: reviewCase.input.summary,
    metadata: {
      sourceType: reviewCase.input.sourceType,
      confidence: Math.round(reviewCase.input.transcriptConfidence * 100)
    }
  };
}

function buildSynthesisItem(reviewCase: ReviewCase): ReviewQueueItem {
  const soap = [
    `Subjective: ${reviewCase.input.summary}`,
    `Objective: ${reviewCase.draft.observations.map((o) => `${o.codeText}: ${o.valueText}`).join("; ") || "See observations."}`,
    `Assessment: ${reviewCase.draft.condition.codeText}`,
    `Plan: ${reviewCase.draft.medicationRequest?.medicationText ?? "No medication draft."}`
  ].join("\n");

  return {
    id: `${reviewCase.id}-queue-soap`,
    agentId: "SYNTHESIS",
    itemType: "soap_note",
    status: "DRAFT",
    title: "SOAP note draft",
    summary: reviewCase.draft.encounter.clinicianSummary,
    content: soap,
    metadata: {
      encounterReason: reviewCase.draft.encounter.reason,
      condition: reviewCase.draft.condition.codeText
    }
  };
}

function buildDrAssistItem(reviewCase: ReviewCase): ReviewQueueItem {
  const icdCodes = (reviewCase.reviewQueueItems?.find((i) => i.itemType === "diagnosis_codes")?.metadata?.icdCodes as string[]) ?? [];
  const codes =
    icdCodes.length > 0
      ? icdCodes
      : inferIcdCodes(reviewCase.draft.condition.codeText);

  return {
    id: `${reviewCase.id}-queue-codes`,
    agentId: "DrASSIST",
    itemType: "diagnosis_codes",
    status: "DRAFT",
    title: "Diagnosis code suggestions",
    summary: codes.map((c) => c).join(" · "),
    content: codes.join("\n"),
    metadata: {
      icdCodes: codes,
      confidence: reviewCase.draft.medicationRequest?.confidence
        ? Math.round(reviewCase.draft.medicationRequest.confidence * 100)
        : 92
    }
  };
}

function inferIcdCodes(conditionText: string) {
  const lower = conditionText.toLowerCase();
  if (lower.includes("dvt") || lower.includes("deep vein")) return ["I82.4: Acute embolism and thrombosis of deep veins of lower extremity"];
  if (lower.includes("type 2") || lower.includes("t2d") || lower.includes("diabetes")) {
    return ["E11.65 | Type 2 diabetes mellitus with hyperglycaemia"];
  }
  return [`Provisional: ${conditionText}`];
}

function buildGuardianItem(reviewCase: ReviewCase, flags: SafetyFlag[]): ReviewQueueItem | null {
  const highFlags = flags.filter((f) => f.severity === "high" || f.id.endsWith("-ddi"));
  if (!highFlags.length) return null;

  const primary = highFlags[0];
  return {
    id: `${reviewCase.id}-queue-guardian`,
    agentId: "GUARDIAN",
    itemType: "guardian_alert",
    status: "DRAFT",
    title: primary.label,
    summary: primary.detail,
    content: highFlags.map((f) => `${f.label}: ${f.detail}`).join("\n"),
    metadata: {
      severity: primary.severity,
      flagCount: highFlags.length
    }
  };
}

function buildOracleItem(reviewCase: ReviewCase): ReviewQueueItem | null {
  if (!reviewCase.oracleRiskScore) return null;

  const { baseline, current, factors } = reviewCase.oracleRiskScore;
  return {
    id: `${reviewCase.id}-queue-oracle`,
    agentId: "ORACLE",
    itemType: "oracle_update",
    status: "DRAFT",
    title: "Risk score update",
    summary: `CVD/T2D composite risk ${baseline} → ${current} after clinical flags`,
    content: factors.join("\n"),
    metadata: {
      baseline,
      current,
      delta: current - baseline
    }
  };
}

/** Derive HITL queue items from case data when not explicitly seeded. */
export function deriveReviewQueueItems(reviewCase: ReviewCase): ReviewQueueItem[] {
  if (reviewCase.reviewQueueItems?.length) {
    return reviewCase.reviewQueueItems;
  }

  const flags = deriveSafetyFlags(reviewCase);
  const items: ReviewQueueItem[] = [buildVoiceItem(reviewCase), buildSynthesisItem(reviewCase), buildDrAssistItem(reviewCase)];
  const guardian = buildGuardianItem(reviewCase, flags);
  const oracle = buildOracleItem(reviewCase);

  if (guardian) items.push(guardian);
  if (oracle) items.push(oracle);

  return items;
}

export function deriveActiveAgents(reviewCase: ReviewCase): ClinicalAgentId[] {
  const items = deriveReviewQueueItems(reviewCase);
  const agents = new Set<ClinicalAgentId>(items.map((i) => i.agentId));
  if (reviewCase.auditEvents.some((e) => e.label.toLowerCase().includes("shield"))) {
    agents.add("SHIELD");
  }
  return Array.from(agents);
}

export function deriveAgentCards(reviewCase: ReviewCase): AgentCard[] {
  const items = deriveReviewQueueItems(reviewCase);
  const draftCount = items.filter((i) => i.status === "DRAFT").length;
  const hasGuardianAlert = items.some((i) => i.agentId === "GUARDIAN" && i.status === "DRAFT");
  const oracle = reviewCase.oracleRiskScore;

  const cards: AgentCard[] = [
    {
      id: "VOICE",
      label: CLINICAL_AGENT_META.VOICE.label,
      function: CLINICAL_AGENT_META.VOICE.function,
      status: items.find((i) => i.agentId === "VOICE")?.status === "ACCEPTED" ? "completed" : "active",
      detail: `${reviewCase.input.sourceType} intake · ${Math.round(reviewCase.input.transcriptConfidence * 100)}% confidence`,
      queueFilter: "voice_transcript"
    },
    {
      id: "SYNTHESIS",
      label: CLINICAL_AGENT_META.SYNTHESIS.label,
      function: CLINICAL_AGENT_META.SYNTHESIS.function,
      status: items.find((i) => i.itemType === "soap_note")?.status === "DRAFT" ? "draft_pending" : "completed",
      detail: reviewCase.draft.encounter.reason,
      queueFilter: "soap_note"
    },
    {
      id: "DrASSIST",
      label: CLINICAL_AGENT_META.DrASSIST.label,
      function: CLINICAL_AGENT_META.DrASSIST.function,
      status: items.find((i) => i.itemType === "diagnosis_codes")?.status === "DRAFT" ? "draft_pending" : "completed",
      detail: reviewCase.draft.condition.codeText,
      queueFilter: "diagnosis_codes"
    },
    {
      id: "GUARDIAN",
      label: CLINICAL_AGENT_META.GUARDIAN.label,
      function: CLINICAL_AGENT_META.GUARDIAN.function,
      status: hasGuardianAlert ? "alert" : draftCount ? "idle" : "completed",
      detail: hasGuardianAlert ? "HIGH alert pending GP review" : "No active safety alerts",
      queueFilter: "guardian_alert"
    },
    {
      id: "ORACLE",
      label: CLINICAL_AGENT_META.ORACLE.label,
      function: CLINICAL_AGENT_META.ORACLE.function,
      status: oracle ? (items.find((i) => i.itemType === "oracle_update")?.status === "DRAFT" ? "draft_pending" : "completed") : "idle",
      detail: oracle ? `Risk ${oracle.baseline} → ${oracle.current}` : "Risk score not computed for this case",
      queueFilter: "oracle_update"
    },
    {
      id: "REFERRAL",
      label: CLINICAL_AGENT_META.REFERRAL.label,
      function: CLINICAL_AGENT_META.REFERRAL.function,
      status: items.find((i) => i.itemType === "referral_package")
        ? items.find((i) => i.itemType === "referral_package")?.status === "DRAFT"
          ? "draft_pending"
          : "completed"
        : "idle",
      detail: items.find((i) => i.itemType === "referral_package")
        ? "DVT urgent referral package staged"
        : "Activates after SOAP + codes accepted",
      queueFilter: "referral_package"
    },
    {
      id: "SHIELD",
      label: CLINICAL_AGENT_META.SHIELD.label,
      function: CLINICAL_AGENT_META.SHIELD.function,
      status: reviewCase.auditEvents.some((e) => e.actor === "SHIELD") ? "active" : "idle",
      detail: "Audit trail on Accept / Edit / Reject"
    }
  ];

  return cards;
}

export const GOLDEN_SCENARIO_PATEL_DEMO_ID = "case-patel-demo";
export const GOLDEN_SCENARIO_V_UK1_ID = "case-v-uk1";
export const GOLDEN_SCENARIO_ID = GOLDEN_SCENARIO_PATEL_DEMO_ID;
