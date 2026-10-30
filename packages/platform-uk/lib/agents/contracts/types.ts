export type AgentEscalation = "PASS" | "REVIEW" | "BLOCK";

export type AgentContract = {
  agent: string;
  version: string;
  purpose: string;
  allowed_inputs: string[];
  allowed_tools: string[];
  prohibited_actions: string[];
  output: {
    findings: string[];
    evidence: string[];
    uncertainties: string[];
    escalation: AgentEscalation;
  };
};

export const NEXUS_AGENT_CONTRACT: AgentContract = {
  agent: "NEXUS",
  version: "0.1",
  purpose: "Context-aware clinical decision support",
  allowed_inputs: ["authorised_context_package"],
  allowed_tools: ["graph_retrieval", "evidence_retrieval"],
  prohibited_actions: [
    "prescribe",
    "finalise_diagnosis",
    "modify_source_record",
    "autonomous_external_message",
  ],
  output: {
    findings: [],
    evidence: [],
    uncertainties: [],
    escalation: "REVIEW",
  },
};

/** P4 — imaging intelligence scaffold (synthetic metadata only; no live PACS/DICOM pixels). */
export const PRISM_AGENT_CONTRACT: AgentContract = {
  agent: "PRISM",
  version: "0.1",
  purpose: "Imaging-adjacent clinical signal from synthetic DICOM metadata fixtures",
  allowed_inputs: ["synthetic_imaging_meta_fixture", "authorised_context_package"],
  allowed_tools: ["imaging_meta_retrieve", "guardian_gateway_evaluate", "eval_score_append"],
  prohibited_actions: [
    "prescribe",
    "finalise_diagnosis",
    "modify_source_record",
    "autonomous_external_message",
    "claim_live_imaging_deployment",
    "read_pixel_archive",
  ],
  output: {
    findings: [],
    evidence: [],
    uncertainties: [],
    escalation: "REVIEW",
  },
};

/** P4 — clinical research intelligence scaffold (controlled/synthetic cohorts only). */
export const ATLAS_AGENT_CONTRACT: AgentContract = {
  agent: "ATLAS",
  version: "0.1",
  purpose: "Protocol eligibility matching and trial analytics on controlled synthetic research data",
  allowed_inputs: ["synthetic_protocol_fixture", "synthetic_cohort_aggregate"],
  allowed_tools: ["protocol_retrieve", "cohort_aggregate_retrieve", "guardian_gateway_evaluate", "eval_score_append"],
  prohibited_actions: [
    "prescribe",
    "finalise_diagnosis",
    "modify_source_record",
    "autonomous_external_message",
    "patient_level_research_export",
    "unapproved_clinical_enablement",
  ],
  output: {
    findings: [],
    evidence: [],
    uncertainties: [],
    escalation: "REVIEW",
  },
};

export const PROHIBITED_ACTION_PATTERNS: Array<{ action: string; pattern: RegExp }> = [
  { action: "prescribe", pattern: /\b(prescribe|issue\s+eps|send\s+to\s+pharmacy)\b/i },
  { action: "finalise_diagnosis", pattern: /\b(final\s+diagnosis|diagnosed\s+as)\b/i },
  { action: "modify_source_record", pattern: /\b(write\s+to\s+(emis|ehr)|commit\s+to\s+record)\b/i },
  { action: "autonomous_external_message", pattern: /\b(text\s+the\s+patient|send\s+sms|email\s+the\s+patient\s+now)\b/i },
  { action: "claim_live_imaging_deployment", pattern: /\b(live\s+pacs|live\s+imaging\s+deployment|pixel\s+archive\s+online)\b/i },
  { action: "read_pixel_archive", pattern: /\b(download\s+dicom\s+pixels|open\s+pacs\s+store)\b/i },
  { action: "patient_level_research_export", pattern: /\b(export\s+named\s+patients|patient[\s-]?level\s+export)\b/i },
  { action: "unapproved_clinical_enablement", pattern: /\b(enable\s+live\s+trials?\s+matching|approve\s+clinical\s+recruitment)\b/i },
];
