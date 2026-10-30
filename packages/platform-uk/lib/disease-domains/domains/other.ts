/**
 * Other chronic diseases — placeholder registry (research / subject to evidence).
 *
 * Entries are named candidates only. No clinical intelligence, guidelines,
 * risk models or care pathways are activated. Subject to evidence and
 * clinical priorities before any plugin promotion.
 */

import { defaultValidationForInactive, notActivated } from "../activation";
import { DOMAIN_SIGNAL_HONESTY, type DiseaseDomainPlugin } from "../types";

const DOMAIN_ID = "other_chronic" as const;
const STATUS = "research" as const;

/** Named candidates — not commitments to build. */
export const OTHER_CHRONIC_CANDIDATES = [
  {
    candidateId: "asthma_copd",
    label: "Asthma / COPD",
    evidenceStatus: "insufficient" as const,
    notes: "Placeholder — requires clinical priority and evidence review.",
  },
  {
    candidateId: "heart_failure_dedicated",
    label: "Heart failure (dedicated module)",
    evidenceStatus: "insufficient" as const,
    notes: "May overlap cardiovascular scaffold; OQ-ARC-4 unresolved.",
  },
  {
    candidateId: "frailty_multimorbidity",
    label: "Frailty / multimorbidity",
    evidenceStatus: "insufficient" as const,
    notes: "Cross-cutting; not a disease module until product decides ownership.",
  },
] as const;

export type OtherChronicCandidate = (typeof OTHER_CHRONIC_CANDIDATES)[number];

export const otherChronicDomain: DiseaseDomainPlugin = {
  id: DOMAIN_ID,
  name: "Other chronic diseases",
  description:
    "Placeholder registry for additional chronic disease domains. Research / subject to evidence only — no activated clinical intelligence.",
  activationStatus: STATUS,
  honesty: DOMAIN_SIGNAL_HONESTY,
  feedTargets: ["none"],
  guidelines: {
    catalogId: "other_chronic_guidelines_placeholder",
    status: STATUS,
    guidelineAreaIds: OTHER_CHRONIC_CANDIDATES.map((c) => c.candidateId),
    notes: "Candidate ids only; see OTHER_CHRONIC_CANDIDATES.",
  },
  observations: {
    status: STATUS,
    observationKindIds: [],
    notes: "No observation kinds until a candidate is promoted with evidence.",
  },
  riskModels: {
    status: STATUS,
    riskModelIds: [],
    notes: "Empty — evaluateRisk returns not_activated.",
  },
  carePathways: {
    status: STATUS,
    pathwayIds: [],
    notes: "Empty — listCarePathways returns not_activated.",
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

export function listOtherChronicCandidates(): readonly OtherChronicCandidate[] {
  return OTHER_CHRONIC_CANDIDATES;
}
