/**
 * Golden-case fixtures for SYNTHESIS / GUARDIAN / ORACLE eval.
 * HITL-safe: scoring never writes to the EHR.
 */

export type GoldenAgentId = "SYNTHESIS" | "GUARDIAN" | "ORACLE";

export type GoldenCase = {
  id: string;
  agent: GoldenAgentId;
  label: string;
  input: {
    transcript?: string;
    patientLabel?: string;
    patientId?: string;
    proposedDrug?: string;
  };
  /** Substrings that must appear somewhere in the draft narrative fields. */
  mustMention: string[];
  /** Substrings that must appear in safetyNotes (joined). */
  safetyMustMention: string[];
  /** Minimum confidence when running deterministic-only (optional). */
  minConfidence?: number;
};

export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "synthesis-dvt-leg-swelling",
    agent: "SYNTHESIS",
    label: "SYNTHESIS SOAP from DVT-suspected consult transcript",
    input: {
      patientLabel: "Mr James Patel",
      transcript:
        "Patient reports left calf swelling for 3 days, worse on walking. Type 2 diabetes on metformin. Discussed possible DVT and apixaban. Safety-net for breathlessness."
    },
    mustMention: ["calf", "DVT"],
    safetyMustMention: ["HITL"],
    minConfidence: 0.3
  },
  {
    id: "guardian-apixaban-aspirin",
    agent: "GUARDIAN",
    label: "GUARDIAN dual antithrombotic brief for Patel",
    input: {
      patientId: "P002",
      proposedDrug: "Apixaban"
    },
    mustMention: ["Apixaban"],
    safetyMustMention: ["HITL"],
    minConfidence: 0.3
  },
  {
    id: "oracle-patel-risk",
    agent: "ORACLE",
    label: "ORACLE risk brief for high-risk Patel case",
    input: {
      patientId: "P002"
    },
    mustMention: ["ORACLE", "risk"],
    safetyMustMention: ["HITL"],
    minConfidence: 0.3
  }
];

export function listGoldenCases(agent?: GoldenAgentId) {
  if (!agent) return GOLDEN_CASES;
  return GOLDEN_CASES.filter((c) => c.agent === agent);
}
