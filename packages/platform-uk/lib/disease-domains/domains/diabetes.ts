/**
 * Diabetes and metabolic health — initial domain plugin.
 *
 * Registers against the existing synthetic diabetes path
 * (`lib/disease-modules/diabetes/*`, `lib/diabetes-intelligence/*`).
 * Does not invent new clinical models; risk evaluation returns a pointer
 * into the established disease-modules composite.
 */

import { DIABETES_MODULE_IDS } from "../../disease-modules/diabetes/types";
import { activatedSuccess, notActivated } from "../activation";
import {
  DOMAIN_SIGNAL_HONESTY,
  EMPTY_VALIDATION_REQUIREMENTS,
  type DiseaseDomainPlugin,
  type DomainRiskEvaluationInput,
} from "../types";

const DOMAIN_ID = "diabetes_metabolic" as const;

const OBSERVATION_KINDS = [
  "glucose_cgm",
  "glucose_smbg",
  "hba1c",
  "insulin_regimen",
  "glp1_side_effects",
] as const;

const PATHWAY_IDS = [
  "diabetes_care_journey",
  "glucose_intelligence_review",
  "medication_personalised_care",
  "continuous_care_operations",
  "agent_intelligence_drafting",
] as const;

const GUIDELINE_AREAS = [...DIABETES_MODULE_IDS] as const;

export const diabetesMetabolicDomain: DiseaseDomainPlugin = {
  id: DOMAIN_ID,
  name: "Diabetes and metabolic health",
  description:
    "Initial chronic-disease domain. Active synthetic path only — registers existing diabetes modules and diabetes-intelligence journey surfaces. Not clinically validated; ehrWrite false.",
  activationStatus: "active_synthetic",
  honesty: DOMAIN_SIGNAL_HONESTY,
  feedTargets: ["HORIZON", "GUARDIAN", "coaching_surface"],
  guidelines: {
    catalogId: "diabetes_metabolic_guidelines_v0",
    status: "active_synthetic",
    guidelineAreaIds: GUIDELINE_AREAS,
    notes: "Maps to DIABETES_MODULE_IDS; rules-first builders under lib/disease-modules/diabetes/.",
  },
  observations: {
    status: "active_synthetic",
    observationKindIds: OBSERVATION_KINDS,
    notes: "Synthetic / fixture / ingest paths already established; no new observation fabricators here.",
  },
  riskModels: {
    status: "active_synthetic",
    riskModelIds: ["diabetes_risk_contribution_v1"],
    notes: "Pointer to buildDiabetesRiskContribution — not a new model.",
  },
  carePathways: {
    status: "active_synthetic",
    pathwayIds: PATHWAY_IDS,
    notes: "Existing synthetic_demo capabilities under lib/diabetes-intelligence/.",
  },
  // Synthetic demo path exists; CLINICAL_RELEASE gates remain unmet for live patients.
  validationRequirements: {
    ...EMPTY_VALIDATION_REQUIREMENTS,
  },
  evaluateRisk(input: DomainRiskEvaluationInput) {
    if (!input.patientId?.trim()) {
      return notActivated(DOMAIN_ID, "active_synthetic", "evaluateRisk", "validation_required");
    }
    return activatedSuccess(DOMAIN_ID, "active_synthetic", {
      sourceModule: "disease-modules/diabetes",
      contributionKind: "risk_contribution_pointer",
      patientId: input.patientId,
      note:
        "Call buildDiabetesRiskContribution from lib/disease-modules/diabetes for the synthetic composite. This domain plugin does not re-implement clinical rules.",
    });
  },
  listObservationKinds() {
    return activatedSuccess(DOMAIN_ID, "active_synthetic", {
      observationKindIds: OBSERVATION_KINDS,
    });
  },
  listCarePathways() {
    return activatedSuccess(DOMAIN_ID, "active_synthetic", {
      pathwayIds: PATHWAY_IDS,
    });
  },
};
