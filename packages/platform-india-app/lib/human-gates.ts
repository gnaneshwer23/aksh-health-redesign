import { deriveHumanGates, summarizeHumanGates } from "@akshhealth/foundation/workflow";
import type { ReviewCase } from "@akshhealth/foundation/types";

export { deriveHumanGates, summarizeHumanGates };

/** India-specific gate labels — Indian Pharmacopoeia / ICMR framing (not NICE/BNF). */
export function deriveIndiaHumanGateLabels(reviewCase: ReviewCase) {
  const summary = summarizeHumanGates(reviewCase);

  return {
    ...summary,
    regulatoryFrame: "Indian Pharmacopoeia + ICMR (India Phase 0)",
    gates: summary.gates.map((gate) => {
      if (gate.id === "medication_decision") {
        return {
          ...gate,
          label: "Indian Pharmacopoeia — दवा निर्णय गेट",
          reviewerAction: gate.reviewerAction.replace(/NHS/gi, "NMC-registered clinician")
        };
      }
      return gate;
    })
  };
}
