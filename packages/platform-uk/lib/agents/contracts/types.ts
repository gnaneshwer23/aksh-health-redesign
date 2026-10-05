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

export const PROHIBITED_ACTION_PATTERNS: Array<{ action: string; pattern: RegExp }> = [
  { action: "prescribe", pattern: /\b(prescribe|issue\s+eps|send\s+to\s+pharmacy)\b/i },
  { action: "finalise_diagnosis", pattern: /\b(final\s+diagnosis|diagnosed\s+as)\b/i },
  { action: "modify_source_record", pattern: /\b(write\s+to\s+(emis|ehr)|commit\s+to\s+record)\b/i },
  { action: "autonomous_external_message", pattern: /\b(text\s+the\s+patient|send\s+sms|email\s+the\s+patient\s+now)\b/i },
];
