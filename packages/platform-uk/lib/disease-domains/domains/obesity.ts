/**
 * Obesity and related metabolic conditions — future domain scaffold (planned).
 * No clinical intelligence activated; all operations return not_activated.
 */

import { defaultValidationForInactive, notActivated } from "../activation";
import { DOMAIN_SIGNAL_HONESTY, type DiseaseDomainPlugin } from "../types";

const DOMAIN_ID = "obesity_metabolic" as const;
const STATUS = "planned" as const;

const GUIDELINE_AREAS = ["BMI_TRAJECTORY", "WAIST_CIRCUMFERENCE", "WEIGHT_MANAGEMENT", "METABOLIC_SYNDROME_FLAGS"] as const;
const OBSERVATION_KINDS = ["bmi", "weight", "waist_circumference"] as const;
const PATHWAY_IDS = ["weight_management_pathway", "metabolic_review_pathway"] as const;

export const obesityMetabolicDomain: DiseaseDomainPlugin = {
  id: DOMAIN_ID,
  name: "Obesity and related metabolic conditions",
  description:
    "Future obesity / metabolic domain scaffold. Planned only — no activated clinical intelligence or fabricated weight-management outputs.",
  activationStatus: STATUS,
  honesty: DOMAIN_SIGNAL_HONESTY,
  feedTargets: ["none"],
  guidelines: {
    catalogId: "obesity_metabolic_guidelines_placeholder",
    status: STATUS,
    guidelineAreaIds: GUIDELINE_AREAS,
    notes: "Illustrative areas pending clinical-lead / product spec.",
  },
  observations: {
    status: STATUS,
    observationKindIds: OBSERVATION_KINDS,
    notes: "Catalogue only; no obesity observation builders beyond existing patient readings elsewhere.",
  },
  riskModels: {
    status: STATUS,
    riskModelIds: ["obesity_metabolic_risk_placeholder"],
    notes: "Placeholder; evaluateRisk returns not_activated.",
  },
  carePathways: {
    status: STATUS,
    pathwayIds: PATHWAY_IDS,
    notes: "Placeholder; listCarePathways returns not_activated.",
  },
  validationRequirements: defaultValidationForInactive(),
  evaluateRisk() {
    return notActivated(DOMAIN_ID, STATUS, "evaluateRisk");
  },
  listObservationKinds() {
    return notActivated(DOMAIN_ID, STATUS, "listObservationKinds");
  },
  listCarePathways() {
    return notActivated(DOMAIN_ID, STATUS, "listCarePathways");
  },
};
