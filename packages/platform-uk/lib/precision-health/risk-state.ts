import type { Patient } from "../mock-data/types";

import { getOracleModelCard, type OracleModelCard } from "./oracle-model-card";

/**
 * Honest risk-state model — NOT a physiological digital twin.
 * Fed by ORACLE-style scores + synthetic/graph signals already on the patient fixture.
 */

export type PatientRiskState = {
  artifactType: "aksh-patient-risk-state";
  patientId: string;
  patientLabel: string;
  modelLabel: "risk_state_model";
  physiologicalTwin: false;
  simulationRanking: false;
  admissionRisk14Days: number;
  oracleScore: number | null;
  oracleRisk: string | null;
  deteriorationSignals: string[];
  recommendedActions: string[];
  dataSources: string[];
  limitations: string[];
  modelCard: OracleModelCard;
  autoRetrain: false;
  hitlRequired: true;
  ehrWrite: false;
  generatedAt: string;
};

export type PopulationRiskState = {
  artifactType: "aksh-population-risk-state";
  scopeLabel: string;
  modelLabel: "risk_state_model";
  physiologicalTwin: false;
  simulationRanking: false;
  highRiskSharePercent: number;
  signals: string[];
  recommendedActions: string[];
  limitations: string[];
  hitlRequired: true;
  ehrWrite: false;
  generatedAt: string;
};

export function buildPatientRiskState(
  patient: Pick<
    Patient,
    "id" | "name" | "oracleScore" | "oracleRisk" | "digitalTwinPrediction"
  >,
  options?: { neo4jLive?: boolean; oracleLive?: boolean }
): PatientRiskState {
  const pred = patient.digitalTwinPrediction;
  const modelCard = getOracleModelCard();
  return {
    artifactType: "aksh-patient-risk-state",
    patientId: patient.id,
    patientLabel: patient.name,
    modelLabel: "risk_state_model",
    physiologicalTwin: false,
    simulationRanking: false,
    admissionRisk14Days: pred.admissionRisk14Days,
    oracleScore: patient.oracleScore ?? null,
    oracleRisk: patient.oracleRisk ?? null,
    deteriorationSignals: pred.deteriorationSignals,
    recommendedActions: pred.recommendedActions,
    dataSources: [
      options?.oracleLive ? "ORACLE draft API" : "ORACLE-style fixture score",
      options?.neo4jLive ? "Neo4j Aura graph signals" : "Neo4j mock / seeded synthetic graph",
      "Synthetic cohort vitals / notes (not continuous wearable stream)"
    ],
    limitations: [
      "This is a risk-state model for clinical review demos — not a physiological digital twin.",
      "No intervention simulation or counterfactual ranking is performed.",
      "Scores are not calibrated against live health system outcomes.",
      "HITL required before any care action; zero autonomous EHR write.",
      `Model ${modelCard.modelId}@${modelCard.version} — no auto-retrain; see ${modelCard.governedReleaseSop}.`
    ],
    modelCard,
    autoRetrain: false,
    hitlRequired: true,
    ehrWrite: false,
    generatedAt: new Date().toISOString()
  };
}

export function buildPopulationRiskState(input: {
  scopeLabel: string;
  highRiskSharePercent: number;
  signals: string[];
  recommendedActions: string[];
}): PopulationRiskState {
  return {
    artifactType: "aksh-population-risk-state",
    scopeLabel: input.scopeLabel,
    modelLabel: "risk_state_model",
    physiologicalTwin: false,
    simulationRanking: false,
    highRiskSharePercent: input.highRiskSharePercent,
    signals: input.signals,
    recommendedActions: input.recommendedActions,
    limitations: [
      "Aggregate population risk-state view — not a regional physiological twin.",
      "Forecasts are synthetic / demo-grade unless a clinical owner model is approved (Phase 2+)."
    ],
    hitlRequired: true,
    ehrWrite: false,
    generatedAt: new Date().toISOString()
  };
}
