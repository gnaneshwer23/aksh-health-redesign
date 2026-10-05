import type { ClinicalContextPackage } from "@/lib/context-engine/types";
import { retrieveGraphRag } from "@/lib/graphrag/retrieve";

import { NEXUS_AGENT_CONTRACT, PROHIBITED_ACTION_PATTERNS, type AgentContract, type AgentEscalation } from "./types";

export type ContractedAgentResult = {
  contract: AgentContract;
  liveEmis: false;
  hitlRequired: true;
  findings: string[];
  evidence: string[];
  uncertainties: string[];
  escalation: AgentEscalation;
  tools_used: string[];
  prohibitedDetected: string[];
  dataSource: "neo4j" | "mock";
};

function detectProhibited(text: string): string[] {
  return PROHIBITED_ACTION_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.action);
}

export async function runContractedNexus(input: {
  context: ClinicalContextPackage;
  query?: string;
}): Promise<ContractedAgentResult> {
  const query =
    input.query ??
    `${input.context.conditions.join(" ")} ${input.context.medications.join(" ")} hba1c diabetes`;
  const rag = await retrieveGraphRag({
    patientId: input.context.patient_context.patientId,
    query,
    context: input.context,
  });

  const findings: string[] = [];
  if (input.context.conditions.some((c) => /diabetes/i.test(c))) {
    findings.push("Type 2 diabetes is on the current problem list.");
  }
  const hba1c = input.context.laboratory_results.find((l) => /hba1c/i.test(l.name));
  if (hba1c) findings.push(`Retrieved HbA1c fact: ${hba1c.value} (${hba1c.recordedAt ?? "time unknown"}).`);
  if (input.context.medications.some((m) => /aspirin/i.test(m))) {
    findings.push("Aspirin is recorded alongside other therapies — GUARDIAN combination risk may apply.");
  }

  const evidence = rag.hits.filter((h) => h.kind === "guideline" || h.kind === "fixture_fact").map((h) => h.citation);
  const uncertainties = [...input.context.uncertainties, ...input.context.missing_information.map((m) => `Missing: ${m}`)];

  const draftText = `${findings.join(" ")} ${query}`;
  const prohibitedDetected = detectProhibited(draftText);

  let escalation: AgentEscalation = "REVIEW";
  if (prohibitedDetected.length > 0) escalation = "BLOCK";
  else if (input.context.missing_information.includes("ADHERENCE") || input.context.uncertainties.length > 0) {
    escalation = "REVIEW";
  } else if (findings.length > 0 && input.context.missing_information.length === 0) {
    escalation = "PASS";
  }

  return {
    contract: {
      ...NEXUS_AGENT_CONTRACT,
      output: { findings, evidence, uncertainties, escalation },
    },
    liveEmis: false,
    hitlRequired: true,
    findings,
    evidence,
    uncertainties,
    escalation,
    tools_used: ["graph_retrieval", "evidence_retrieval"],
    prohibitedDetected,
    dataSource: rag.dataSource,
  };
}
