import { buildImagingDicomMetaSample } from "@/lib/precision-health/connectors";
import type { ClinicalContextPackage } from "@/lib/context-engine/types";

import {
  PRISM_AGENT_CONTRACT,
  PROHIBITED_ACTION_PATTERNS,
  type AgentContract,
  type AgentEscalation,
} from "./types";

export type PrismEvalFixture = {
  fixtureId: string;
  patientId: string;
  studyDescription: string;
  bodySite: string;
  dicomModalityCode: string;
  dicomPresent: false;
  pixelStoreClaim: false;
  reportAdjacentSummary: string;
};

export type PrismContractedResult = {
  contract: AgentContract;
  liveEmis: false;
  liveImagingDeployment: false;
  hitlRequired: true;
  ehrWrite: false;
  findings: string[];
  evidence: string[];
  uncertainties: string[];
  escalation: AgentEscalation;
  tools_used: string[];
  prohibitedDetected: string[];
  dataSource: "fixture";
  fixture: PrismEvalFixture;
};

function detectProhibited(text: string): string[] {
  return PROHIBITED_ACTION_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.action);
}

/** Synthetic imaging-meta fixture — never claims DICOM pixel / PACS deployment. */
export function buildPrismEvalFixture(patientId = "SYNTH-PRISM-001"): PrismEvalFixture {
  const sample = buildImagingDicomMetaSample(patientId);
  return {
    fixtureId: `prism-fixture-${patientId}`,
    patientId,
    studyDescription: sample.studyDescription,
    bodySite: sample.bodySite,
    dicomModalityCode: sample.dicomModalityCode,
    dicomPresent: false,
    pixelStoreClaim: false,
    reportAdjacentSummary:
      "Synthetic report-adjacent note: no acute consolidation described on metadata stub; clinician review required before any imaging claim.",
  };
}

export function runContractedPrism(input?: {
  patientId?: string;
  context?: ClinicalContextPackage | null;
  query?: string;
}): PrismContractedResult {
  const fixture = buildPrismEvalFixture(input?.patientId ?? "SYNTH-PRISM-001");
  const findings = [
    `Synthetic ${fixture.dicomModalityCode} study metadata for ${fixture.bodySite}: ${fixture.studyDescription}.`,
    fixture.reportAdjacentSummary,
  ];
  if (input?.context?.conditions.some((c) => /dvt|pe|embolism/i.test(c))) {
    findings.push("Context lists thromboembolism risk language — imaging meta alone cannot confirm or exclude PE/DVT.");
  }

  const evidence = [
    `fixture:${fixture.fixtureId}`,
    "imaging_dicom_meta_stub (dicomPresent:false, pixelStoreClaim:false)",
  ];
  const uncertainties = [
    "No pixel archive; findings are metadata/report-adjacent scaffolding only.",
    ...(input?.context?.uncertainties ?? []),
  ];

  const draftText = `${findings.join(" ")} ${input?.query ?? ""}`;
  const prohibitedDetected = detectProhibited(draftText);

  let escalation: AgentEscalation = "REVIEW";
  if (prohibitedDetected.length > 0) escalation = "BLOCK";

  return {
    contract: {
      ...PRISM_AGENT_CONTRACT,
      output: { findings, evidence, uncertainties, escalation },
    },
    liveEmis: false,
    liveImagingDeployment: false,
    hitlRequired: true,
    ehrWrite: false,
    findings,
    evidence,
    uncertainties,
    escalation,
    tools_used: ["imaging_meta_retrieve"],
    prohibitedDetected,
    dataSource: "fixture",
    fixture,
  };
}
