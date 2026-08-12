import { readFile } from "node:fs/promises";
import path from "node:path";

import type { APIRequestContext } from "@playwright/test";

import { GOLDEN_SCENARIOS } from "../../lib/e2e/golden-scenarios";
import { generateE2EDataset } from "../../lib/e2e/generator";
import type { E2ECohortId } from "../../lib/e2e/types";

export const GOLDEN_JOURNEY_SCENARIO = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0002")!;
export const GOLDEN_SCENARIO_C = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0003")!;
export const GOLDEN_SCENARIO_D = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0004")!;
export const GOLDEN_SCENARIO_F = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0006")!;
export const GOLDEN_SCENARIO_G_AGENTS_0007 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0007")!;
export const GOLDEN_SCENARIO_G_AGENTS_0011 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0011")!;
export const GOLDEN_SCENARIO_B_AGENTS_0019 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0019")!;
export const GOLDEN_SCENARIO_DECISION_0001 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0001")!;
export const GOLDEN_SCENARIO_DECISION_0009 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0009")!;
export const GOLDEN_SCENARIO_DECISION_0012 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0012")!;
export const GOLDEN_SCENARIO_HITL_0005 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0005")!;
export const GOLDEN_SCENARIO_HITL_0010 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0010")!;
export const GOLDEN_SCENARIO_HITL_0015 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0015")!;
export const GOLDEN_SCENARIO_HITL_0021 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0021")!;
export const GOLDEN_SCENARIO_SIM_0013 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0013")!;
export const GOLDEN_SCENARIO_SIM_0014 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0014")!;
export const GOLDEN_SCENARIO_LEARN_0008 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0008")!;
export const GOLDEN_SCENARIO_LEARN_0018 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0018")!;
export const GOLDEN_SCENARIO_LEARN_0020 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0020")!;
export const GOLDEN_SCENARIO_PERF_0016 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0016")!;
export const GOLDEN_SCENARIO_PERF_0017 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0017")!;
export const GOLDEN_SCENARIO_PERF_0019 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0019")!;

/** Demo proxies for Stage 11 perf / security / failure golden scenarios. */
export const PERF_DEMO_PATIENTS = {
  isolation: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0016" },
  reminder: { id: "P007", label: "Mrs Priya Sharma", goldenId: "AKSH-E2E-0017" },
  llmFailure: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0019" },
} as const;

/** Demo patient stand-in for cohort B deterioration (UI + agents use mock cohort P001–P100). */
export const COHORT_B_DEMO_PATIENT_ID = "P002";
export const COHORT_B_DEMO_PATIENT_LABEL = "Mr James Patel";

/** Demo proxies for golden journeys C / D / F (mock cohort P001–P026). */
export const COHORT_DEMO_PATIENTS: Record<
  "C" | "D" | "F",
  { id: string; label: string; goldenId: string }
> = {
  C: { id: "P018", label: "Mr Samuel Okonkwo", goldenId: "AKSH-E2E-0003" },
  D: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0004" },
  F: { id: "P015", label: "Mr George Mitchell", goldenId: "AKSH-E2E-0006" },
};

/** Demo proxies for Stage 6 agent / orchestration golden scenarios. */
export const AGENT_DEMO_PATIENTS = {
  multimorbidity: { id: "P008", label: "Mr Thomas Green", goldenId: "AKSH-E2E-0007" },
  allergy: { id: "P001", label: "Mrs Sarah Johnson", goldenId: "AKSH-E2E-0011" },
  llmFailure: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0019" },
} as const;

/** Demo proxies for Stage 7 decision + safety golden scenarios. */
export const DECISION_DEMO_PATIENTS = {
  stable: { id: "P007", label: "Mrs Priya Sharma", goldenId: "AKSH-E2E-0001" },
  escalation: { id: "P018", label: "Mr Samuel Okonkwo", goldenId: "AKSH-E2E-0009" },
  missingRenal: { id: "P015", label: "Mr George Mitchell", goldenId: "AKSH-E2E-0012" },
} as const;

/** Demo proxies for Stage 8 HITL / intervention golden scenarios. */
export const HITL_DEMO_PATIENTS = {
  adherence: { id: "P007", label: "Mrs Priya Sharma", goldenId: "AKSH-E2E-0005" },
  reject: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0010" },
  acceptOutcome: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0015" },
  modify: { id: "P002", label: "Mr James Patel", goldenId: "AKSH-E2E-0021" },
} as const;

export function getCohortGeneratorPatient(cohortId: E2ECohortId) {
  const dataset = generateE2EDataset({ seed: 20260812 });
  return dataset.patients.find((p) => p.cohortId === cohortId) ?? dataset.patients[0]!;
}

export function getCohortBGeneratorPatient() {
  return getCohortGeneratorPatient("B");
}

export async function loadE2EBatchManifest() {
  try {
    const latest = JSON.parse(
      await readFile(path.join(process.cwd(), "data", "e2e", "latest-batch.json"), "utf8")
    ) as { batchId: string };
    return JSON.parse(
      await readFile(path.join(process.cwd(), "data", "e2e", latest.batchId, "manifest.json"), "utf8")
    );
  } catch {
    return generateE2EDataset({ seed: 20260812 }).manifest;
  }
}

/** Ingest deteriorating HbA1c series when diabetes module is enabled. */
export async function ingestDeterioratingHbA1cSeries(
  request: APIRequestContext,
  patientId: string
) {
  const series = [
    { recordedAt: "2025-02-01T09:00:00.000Z", valuePercent: 6.8 },
    { recordedAt: "2025-05-01T09:00:00.000Z", valuePercent: 7.1 },
    { recordedAt: "2025-09-01T09:00:00.000Z", valuePercent: 7.6 },
    { recordedAt: "2026-01-01T09:00:00.000Z", valuePercent: 8.0 },
    { recordedAt: "2026-05-01T09:00:00.000Z", valuePercent: 8.2 },
    { recordedAt: "2026-08-01T09:00:00.000Z", valuePercent: 8.4 },
  ];

  const results = [];
  for (const point of series) {
    const response = await request.post(`/api/patients/${patientId}/diabetes/hba1c`, {
      data: point,
    });
    results.push(response.status());
  }
  return results;
}
