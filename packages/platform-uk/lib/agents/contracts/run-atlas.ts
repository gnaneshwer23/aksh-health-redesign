import type { ClinicalContextPackage } from "@/lib/context-engine/types";

import {
  ATLAS_AGENT_CONTRACT,
  PROHIBITED_ACTION_PATTERNS,
  type AgentContract,
  type AgentEscalation,
} from "./types";

export type AtlasProtocolFixture = {
  fixtureId: string;
  protocolId: string;
  title: string;
  inclusion: string[];
  exclusion: string[];
  syntheticCohortOnly: true;
  patientLevelExport: false;
};

export type AtlasEligibilityMatch = {
  criterion: string;
  matched: boolean;
  note: string;
};

export type AtlasContractedResult = {
  contract: AgentContract;
  liveEmis: false;
  clinicalEnablementApproved: false;
  hitlRequired: true;
  ehrWrite: false;
  findings: string[];
  evidence: string[];
  uncertainties: string[];
  escalation: AgentEscalation;
  tools_used: string[];
  prohibitedDetected: string[];
  dataSource: "fixture";
  protocol: AtlasProtocolFixture;
  matches: AtlasEligibilityMatch[];
  aggregate: {
    cohortSizeSynthetic: number;
    matchedSharePercent: number;
    note: string;
  };
};

function detectProhibited(text: string): string[] {
  return PROHIBITED_ACTION_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.action);
}

export function buildAtlasProtocolFixture(): AtlasProtocolFixture {
  return {
    fixtureId: "atlas-protocol-t2d-cv-001",
    protocolId: "SYNTH-PROT-T2D-CV-001",
    title: "Synthetic T2D cardiovascular outcomes eligibility scaffold",
    inclusion: ["Type 2 diabetes on problem list", "Age 40–80 (synthetic band)", "HbA1c recorded in last 12 months"],
    exclusion: ["Active pregnancy", "Known severe CKD stage 5 (synthetic rule)"],
    syntheticCohortOnly: true,
    patientLevelExport: false,
  };
}

export function runContractedAtlas(input?: {
  context?: ClinicalContextPackage | null;
  query?: string;
}): AtlasContractedResult {
  const protocol = buildAtlasProtocolFixture();
  const conditions = input?.context?.conditions ?? ["Type 2 diabetes mellitus (synthetic)"];
  const hasT2d = conditions.some((c) => /diabetes/i.test(c));

  const matches: AtlasEligibilityMatch[] = [
    {
      criterion: protocol.inclusion[0],
      matched: hasT2d,
      note: hasT2d ? "Synthetic problem-list match" : "No diabetes string in controlled context",
    },
    {
      criterion: protocol.inclusion[2],
      matched: Boolean(input?.context?.laboratory_results.some((l) => /hba1c/i.test(l.name))),
      note: "Fixture-only lab presence check — not a live EHR read",
    },
    {
      criterion: protocol.exclusion[0],
      matched: false,
      note: "Synthetic exclusion not triggered on fixture cohort",
    },
  ];

  const matchedCount = matches.filter((m) => m.matched && !/exclusion/i.test(m.criterion)).length;
  const findings = [
    `Protocol ${protocol.protocolId}: ${protocol.title}`,
    `Controlled eligibility draft matched ${matchedCount}/${protocol.inclusion.length} inclusion criteria (synthetic).`,
    "ATLAS evaluation scaffold only — no clinical enablement and no identifiable cohort export.",
  ];
  const evidence = [`fixture:${protocol.fixtureId}`, "synthetic_cohort_aggregate"];
  const uncertainties = [
    "Eligibility is evaluation-only on controlled data — not clinical enablement.",
    ...(input?.context?.uncertainties ?? []),
  ];

  const draftText = `${findings.join(" ")} ${input?.query ?? ""}`;
  const prohibitedDetected = detectProhibited(draftText);

  let escalation: AgentEscalation = "REVIEW";
  if (prohibitedDetected.length > 0) escalation = "BLOCK";

  return {
    contract: {
      ...ATLAS_AGENT_CONTRACT,
      output: { findings, evidence, uncertainties, escalation },
    },
    liveEmis: false,
    clinicalEnablementApproved: false,
    hitlRequired: true,
    ehrWrite: false,
    findings,
    evidence,
    uncertainties,
    escalation,
    tools_used: ["protocol_retrieve", "cohort_aggregate_retrieve"],
    prohibitedDetected,
    dataSource: "fixture",
    protocol,
    matches,
    aggregate: {
      cohortSizeSynthetic: 420,
      matchedSharePercent: hasT2d ? 31 : 0,
      note: "Synthetic aggregate only — federated-research stub is separate; ATLAS remains evaluation scaffold.",
    },
  };
}
