import { z } from "zod";

import { getPatientById } from "@/lib/mock-data";

import { getOracleModelCard } from "./oracle-model-card";

/**
 * Causal AI stub — Phase 3 scaffolding.
 * Returns hypothesized drivers only. NOT causal proof. HITL + SHIELD; no EHR write.
 */

export const causalRequestSchema = z.object({
  patientId: z.string().min(1),
  question: z.string().max(500).optional()
});

export type CausalHypothesizedDriver = {
  id: string;
  label: string;
  hypothesizedEffect: "increases_risk" | "decreases_risk" | "unclear";
  confidence: number;
  evidenceBasis: string;
};

export type CausalAiResult = {
  artifactType: "aksh-causal-hypothesis-stub";
  patientId: string;
  patientLabel: string;
  mode: "hypothesis_only";
  disclaimer: "hypothesis only, not causal proof";
  question: string;
  hypothesizedDrivers: CausalHypothesizedDriver[];
  modelCard: {
    modelId: string;
    version: string;
    clinicalOwner: string;
    physiologicalCausalModel: false;
  };
  limitations: string[];
  hitlRequired: true;
  ehrWrite: false;
  shieldRecommended: true;
  generatedAt: string;
};

const CAUSAL_MODEL_CARD = {
  modelId: "aksh-causal-hypothesis-stub",
  version: "0.1.0-phase3-scaffold",
  clinicalOwner: "UNASSIGNED — CSO must name clinical owner before any causal claim in care",
  physiologicalCausalModel: false as const
};

export function getCausalAiStatus() {
  return {
    available: true,
    mode: "hypothesis_only" as const,
    disclaimer: "hypothesis only, not causal proof" as const,
    physiologicalCausalModel: false as const,
    clinicalOwner: CAUSAL_MODEL_CARD.clinicalOwner,
    modelCardRef: "lib/precision-health/causal-ai.ts · docs/PHASE3_REGULATORY_PATH.md",
    ehrWrite: false as const,
    hitlRequired: true as const,
    note: "Stub returns hypothesized drivers from rules + ORACLE risk-state. Not causal identification, RCTs, or DAG-validated inference."
  };
}

export function buildCausalHypothesis(input: {
  patientId: string;
  question?: string;
}): CausalAiResult {
  const patient = getPatientById(input.patientId);
  const oracle = getOracleModelCard();
  const score = patient?.oracleScore ?? 50;
  const signals = patient?.digitalTwinPrediction?.deteriorationSignals ?? [];

  const drivers: CausalHypothesizedDriver[] = [
    {
      id: "driver-congestion",
      label: "Fluid congestion / rising weight or oedema signal",
      hypothesizedEffect: "increases_risk",
      confidence: clamp01(0.45 + score / 250),
      evidenceBasis: "Rule stub from risk-state deterioration signals — not causal ID."
    },
    {
      id: "driver-med-adherence",
      label: "Diuretic / HF therapy adherence gap (hypothesized)",
      hypothesizedEffect: "increases_risk",
      confidence: 0.38,
      evidenceBasis: "Heuristic from high ORACLE tier — no adherence telemetry ingested."
    },
    {
      id: "driver-sdoh",
      label: "Housing / air-quality environment stressor (hypothesized)",
      hypothesizedEffect: "increases_risk",
      confidence: 0.28,
      evidenceBasis: "Environment modality contract exists; live OpenWeather not required for stub."
    },
    {
      id: "driver-clinic-access",
      label: "Timely HF clinic access (protective if present)",
      hypothesizedEffect: "decreases_risk",
      confidence: 0.42,
      evidenceBasis: "Pathway heuristic — not a structural causal model."
    }
  ];

  if (signals.length === 0) {
    drivers.push({
      id: "driver-sparse-signal",
      label: "Sparse deterioration signals — hypothesis underpowered",
      hypothesizedEffect: "unclear",
      confidence: 0.2,
      evidenceBasis: "No fixture deterioration signals for this patient."
    });
  }

  return {
    artifactType: "aksh-causal-hypothesis-stub",
    patientId: input.patientId,
    patientLabel: patient?.name ?? input.patientId,
    mode: "hypothesis_only",
    disclaimer: "hypothesis only, not causal proof",
    question:
      input.question?.trim() ||
      "What factors may be driving near-term deterioration risk? (hypothesis only)",
    hypothesizedDrivers: drivers,
    modelCard: {
      ...CAUSAL_MODEL_CARD,
      clinicalOwner: CAUSAL_MODEL_CARD.clinicalOwner.includes("UNASSIGNED")
        ? CAUSAL_MODEL_CARD.clinicalOwner
        : oracle.clinicalOwner
    },
    limitations: [
      "Hypothesis only — not causal proof, not counterfactual identification.",
      "No DAG estimation, no do-calculus, no RCT / instrumental-variable analysis.",
      `Linked model card clinical owner: ${CAUSAL_MODEL_CARD.clinicalOwner}`,
      "HITL required before any care action; ehrWrite: false."
    ],
    hitlRequired: true,
    ehrWrite: false,
    shieldRecommended: true,
    generatedAt: new Date().toISOString()
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}
