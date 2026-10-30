/**
 * Chronic kidney disease — future domain scaffold (planned).
 * No clinical intelligence activated; all operations return not_activated.
 */

import { defaultValidationForInactive, notActivated } from "../activation";
import { DOMAIN_SIGNAL_HONESTY, type DiseaseDomainPlugin } from "../types";

const DOMAIN_ID = "chronic_kidney_disease" as const;
const STATUS = "planned" as const;

const GUIDELINE_AREAS = ["EGFR_TREND", "ACR", "CKD_STAGING", "RENAL_MEDICATION_SAFETY"] as const;
const OBSERVATION_KINDS = ["egfr", "uacr", "serum_creatinine", "blood_pressure"] as const;
const PATHWAY_IDS = ["ckd_monitoring_pathway", "nephrology_referral_draft"] as const;

export const chronicKidneyDiseaseDomain: DiseaseDomainPlugin = {
  id: DOMAIN_ID,
  name: "Chronic kidney disease",
  description:
    "Future CKD domain scaffold. Planned only — no activated clinical intelligence or fabricated renal risk outputs.",
  activationStatus: STATUS,
  honesty: DOMAIN_SIGNAL_HONESTY,
  feedTargets: ["none"],
  guidelines: {
    catalogId: "ckd_guidelines_placeholder",
    status: STATUS,
    guidelineAreaIds: GUIDELINE_AREAS,
    notes: "Illustrative areas pending clinical-lead / product spec.",
  },
  observations: {
    status: STATUS,
    observationKindIds: OBSERVATION_KINDS,
    notes: "Catalogue only; no CKD observation builders.",
  },
  riskModels: {
    status: STATUS,
    riskModelIds: ["ckd_progression_placeholder"],
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
