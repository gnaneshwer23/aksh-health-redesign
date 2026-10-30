/**
 * Cardiovascular health — future domain scaffold (planned).
 *
 * Illustrative signal areas align with lib/disease-modules/heart/types.ts
 * (E5 stub). This plugin does NOT wire heart into CONDUCTOR / APIs / routes.
 * All clinical operations return not_activated.
 */

import { HEART_MODULE_IDS } from "../../disease-modules/heart/types";
import { defaultValidationForInactive, notActivated } from "../activation";
import { DOMAIN_SIGNAL_HONESTY, type DiseaseDomainPlugin } from "../types";

const DOMAIN_ID = "cardiovascular" as const;
const STATUS = "planned" as const;

const OBSERVATION_KINDS = [
  "blood_pressure",
  "lipids",
  "ecg_rhythm_flag",
  "heart_failure_signs",
] as const;

const PATHWAY_IDS = ["cvd_risk_review", "lipid_management_pathway"] as const;

export const cardiovascularDomain: DiseaseDomainPlugin = {
  id: DOMAIN_ID,
  name: "Cardiovascular health",
  description:
    "Future chronic-disease domain scaffold. Planned only — no activated clinical intelligence, no synthetic risk scores, no care-pathway drafts.",
  activationStatus: STATUS,
  honesty: DOMAIN_SIGNAL_HONESTY,
  feedTargets: ["none"],
  guidelines: {
    catalogId: "cardiovascular_guidelines_placeholder",
    status: STATUS,
    guidelineAreaIds: [...HEART_MODULE_IDS],
    notes: "Illustrative areas from heart typed-stub; clinical-lead spec required before activation.",
  },
  observations: {
    status: STATUS,
    observationKindIds: OBSERVATION_KINDS,
    notes: "Catalogue only — no observation builders or ingest paths.",
  },
  riskModels: {
    status: STATUS,
    riskModelIds: ["cvd_risk_placeholder"],
    notes: "Placeholder id only; evaluateRisk returns not_activated.",
  },
  carePathways: {
    status: STATUS,
    pathwayIds: PATHWAY_IDS,
    notes: "Placeholder pathway ids; listCarePathways returns not_activated.",
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
