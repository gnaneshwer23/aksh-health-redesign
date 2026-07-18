import { z } from "zod";

import { getPatientById } from "@/lib/mock-data";

/**
 * Synthetic twin scenario ranking — Phase 3 scaffolding.
 * Rules + ORACLE risk-state inputs only. NOT a physiological digital twin.
 */

export const INTERVENTION_IDS = [
  "intensify_diuretic",
  "add_sglt2",
  "urgent_hf_clinic",
  "home_bp_telemonitor",
  "social_prescribing",
  "continue_current"
] as const;

export type InterventionId = (typeof INTERVENTION_IDS)[number];

export const interventionIdSchema = z.enum(INTERVENTION_IDS);

export const simulateRequestSchema = z.object({
  patientId: z.string().min(1),
  interventions: z.array(interventionIdSchema).min(1).max(6).optional()
});

export type SimulateRequest = z.infer<typeof simulateRequestSchema>;

export type RankedScenarioOption = {
  interventionId: InterventionId;
  label: string;
  benefitScore: number;
  riskScore: number;
  confidence: number;
  estimatedRelativeCost: "low" | "medium" | "high";
  rationale: string;
  rank: number;
};

export type TwinSimulationResult = {
  artifactType: "aksh-synthetic-scenario-ranking";
  patientId: string;
  patientLabel: string;
  physiologicalTwin: false;
  simulationMode: "synthetic_rules";
  oracleScoreUsed: number | null;
  oracleRiskUsed: string | null;
  options: RankedScenarioOption[];
  limitations: string[];
  hitlRequired: true;
  ehrWrite: false;
  planPromotionRequiresHitl: true;
  generatedAt: string;
};

export type TwinSimulationStatus = {
  available: true;
  physiologicalTwin: false;
  simulationMode: "synthetic_rules";
  note: string;
  ehrWrite: false;
  hitlRequired: true;
  planPromotionRequiresHitl: true;
};

const INTERVENTION_CATALOGUE: Record<
  InterventionId,
  {
    label: string;
    baseBenefit: number;
    baseRisk: number;
    cost: "low" | "medium" | "high";
    rationale: string;
  }
> = {
  intensify_diuretic: {
    label: "Intensify loop diuretic (draft)",
    baseBenefit: 0.72,
    baseRisk: 0.45,
    cost: "low",
    rationale: "Rule: higher ORACLE HF risk boosts short-term congestion relief benefit; renal risk elevates."
  },
  add_sglt2: {
    label: "Add SGLT2 inhibitor (draft)",
    baseBenefit: 0.68,
    baseRisk: 0.28,
    cost: "medium",
    rationale: "Rule: guideline-aligned HF benefit with moderate confidence from risk-state only."
  },
  urgent_hf_clinic: {
    label: "Urgent HF clinic review",
    baseBenefit: 0.8,
    baseRisk: 0.12,
    cost: "medium",
    rationale: "Rule: high admission-risk patients rank clinic escalation highly (pathway, not physiology)."
  },
  home_bp_telemonitor: {
    label: "Home BP / weight telemonitoring",
    baseBenefit: 0.55,
    baseRisk: 0.08,
    cost: "medium",
    rationale: "Rule: monitoring benefit scales with deterioration signal count — still synthetic."
  },
  social_prescribing: {
    label: "Social prescribing / housing support",
    baseBenefit: 0.4,
    baseRisk: 0.05,
    cost: "low",
    rationale: "Rule: SDOH-oriented option; low clinical risk, lower confidence without environment live feed."
  },
  continue_current: {
    label: "Continue current plan",
    baseBenefit: 0.25,
    baseRisk: 0.35,
    cost: "low",
    rationale: "Rule: baseline comparator — risk rises with ORACLE score if no change."
  }
};

export function getTwinSimulationStatus(): TwinSimulationStatus {
  return {
    available: true,
    physiologicalTwin: false,
    simulationMode: "synthetic_rules",
    note:
      "Scenario ranking from deterministic rules + ORACLE risk-state fixtures. Not a living physiological digital twin. HITL required before any plan promotion. ehrWrite: false.",
    ehrWrite: false,
    hitlRequired: true,
    planPromotionRequiresHitl: true
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}

/**
 * Rank intervention options using synthetic rules over ORACLE / risk-state signals.
 * Does not simulate physiology, PK/PD, or imaging/omics dynamics.
 */
export function runScenario(
  patientId: string,
  interventions?: InterventionId[]
): TwinSimulationResult {
  const patient = getPatientById(patientId);
  const oracleScore = patient?.oracleScore ?? 50;
  const oracleRisk = patient?.oracleRisk ?? "moderate";
  const signalCount = patient?.digitalTwinPrediction?.deteriorationSignals?.length ?? 2;
  const admissionRisk = patient?.digitalTwinPrediction?.admissionRisk14Days ?? 0.3;

  const selected =
    interventions && interventions.length > 0
      ? interventions
      : (["urgent_hf_clinic", "add_sglt2", "home_bp_telemonitor", "continue_current"] as InterventionId[]);

  const riskFactor = oracleScore / 100;
  const scored = selected.map((id) => {
    const cat = INTERVENTION_CATALOGUE[id];
    let benefit = cat.baseBenefit + riskFactor * 0.15 + admissionRisk * 0.1;
    let risk = cat.baseRisk;
    let confidence = 0.55 + Math.min(0.25, signalCount * 0.04);

    if (id === "intensify_diuretic") {
      benefit += admissionRisk * 0.12;
      risk += riskFactor * 0.2;
      confidence -= 0.05;
    }
    if (id === "urgent_hf_clinic") {
      benefit += riskFactor * 0.18;
      risk = Math.max(0.05, risk - 0.05);
    }
    if (id === "continue_current") {
      benefit = 0.2 + (1 - riskFactor) * 0.15;
      risk = 0.2 + riskFactor * 0.45;
      confidence = 0.7;
    }
    if (id === "social_prescribing") {
      confidence = 0.4;
    }

    // Composite for ranking: benefit − risk penalty, confidence-weighted
    const composite = benefit * confidence - risk * 0.6;

    return {
      interventionId: id,
      label: cat.label,
      benefitScore: clamp01(benefit),
      riskScore: clamp01(risk),
      confidence: clamp01(confidence),
      estimatedRelativeCost: cat.cost,
      rationale: cat.rationale,
      composite
    };
  });

  scored.sort((a, b) => b.composite - a.composite);

  const options: RankedScenarioOption[] = scored.map((row, index) => ({
    interventionId: row.interventionId,
    label: row.label,
    benefitScore: row.benefitScore,
    riskScore: row.riskScore,
    confidence: row.confidence,
    estimatedRelativeCost: row.estimatedRelativeCost,
    rationale: row.rationale,
    rank: index + 1
  }));

  return {
    artifactType: "aksh-synthetic-scenario-ranking",
    patientId,
    patientLabel: patient?.name ?? patientId,
    physiologicalTwin: false,
    simulationMode: "synthetic_rules",
    oracleScoreUsed: patient?.oracleScore ?? null,
    oracleRiskUsed: patient?.oracleRisk ?? null,
    options,
    limitations: [
      "Synthetic rules engine — not a validated physiological digital twin.",
      "Ranking uses ORACLE risk-state / fixture signals only; no imaging, omics, or PK/PD simulation.",
      "Benefit/risk/confidence are rehearsal scores — not calibrated NHS outcome estimates.",
      "HITL required before promoting any ranked option into a care plan draft.",
      "ehrWrite: false — zero autonomous EHR / prescribe / e-Referral write."
    ],
    hitlRequired: true,
    ehrWrite: false,
    planPromotionRequiresHitl: true,
    generatedAt: new Date().toISOString()
  };
}
