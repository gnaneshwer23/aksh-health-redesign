import type { DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";
import type { GlucoseSignal } from "./glucose";
import type { HbA1cSignal } from "./hba1c";
import type { ComplicationSignal } from "./complications";

/**
 * Prevention Intelligence (diabetes spec area #9).
 *
 * Composite summary over Glucose, HbA1c, and Complications signals, plus
 * optional population risk-state context
 * (lib/precision-health/risk-state.ts buildPopulationRiskState). This is the
 * area closest to a "Diabetes Twin," but v1 stays a rules-based composite
 * summary — NOT a simulation. `physiologicalTwin: false` is enforced the
 * same way lib/precision-health/twin-simulation.ts enforces it: as a literal
 * type field, not a comment.
 *
 * A real Diabetes Twin (Layer 5 in docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md)
 * is out of scope here and should be its own follow-on spec once v1 signals
 * are live and trusted (see docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md v2 notes).
 *
 * v1 (B3): real rules-based composite over the HbA1c trend and Complications
 * flag levels already derived by this module (glucose stays advisory-only
 * input since Glucose Intelligence itself is stub-honest pending OQ-DIAB-1).
 * No trajectory scoring beyond a simple worsening/stable/improving rule; no
 * simulation, no counterfactual ranking.
 */

export type PreventionRiskTrajectory = "insufficient_data" | "stable" | "worsening" | "improving";

export type PreventionSignal = {
  moduleId: "PREVENTION";
  feedsInto: "HORIZON";
  patientId: string;
  patientLabel: string;
  riskTrajectoryLabel: PreventionRiskTrajectory;
  personalisedPriorities: string[];
  populationContext: string | null;
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildPreventionSignal(
  context: DiabetesPatientContext,
  inputs?: {
    glucose?: GlucoseSignal;
    hba1c?: HbA1cSignal;
    complications?: ComplicationSignal[];
    populationContext?: string;
  }
): PreventionSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const hba1c = inputs?.hba1c;
  const complications = inputs?.complications ?? [];
  const glucose = inputs?.glucose;

  const referralIndicated = complications.filter((c) => c.flagLevel === "referral_indicated");
  const watch = complications.filter((c) => c.flagLevel === "watch");

  let riskTrajectoryLabel: PreventionRiskTrajectory = "insufficient_data";
  if (hba1c?.trend === "worsening" || referralIndicated.length > 0) {
    riskTrajectoryLabel = "worsening";
  } else if (hba1c?.trend === "improving" && watch.length === 0 && referralIndicated.length === 0) {
    riskTrajectoryLabel = "improving";
  } else if (hba1c?.trend === "stable") {
    riskTrajectoryLabel = "stable";
  }

  const personalisedPriorities: string[] = [];
  if (referralIndicated.length > 0) {
    personalisedPriorities.push(
      `Complication review priority: ${referralIndicated.map((c) => c.domain).join(", ")} (referral_indicated — route via referral_pathway)`
    );
  }
  if (hba1c?.trend === "worsening") {
    personalisedPriorities.push("HbA1c trending upward — review medication/lifestyle plan with clinician");
  }
  if (watch.length > 0 && referralIndicated.length === 0) {
    personalisedPriorities.push(`Monitor: ${watch.map((c) => c.domain).join(", ")} (watch level — no referral yet)`);
  }
  if (glucose?.dataCompleteness === "none") {
    personalisedPriorities.push("No glucose monitoring data on file — encourage capture once modality schema (OQ-DIAB-1) is confirmed");
  }
  if (hba1c?.trend === "improving" && personalisedPriorities.length === 0) {
    personalisedPriorities.push("HbA1c trending down — reinforce current plan at next review");
  }

  return {
    moduleId: "PREVENTION",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    riskTrajectoryLabel,
    personalisedPriorities,
    populationContext: inputs?.populationContext ?? null,
    limitations: [
      "Rules-based composite over HbA1c trend + Complications flag levels only — NOT a physiological simulation.",
      "See lib/precision-health/twin-simulation.ts for the platform's honesty pattern on this distinction.",
      "A real Diabetes Twin (Layer 5) is a separate follow-on spec, not implied by this module.",
      "Glucose Intelligence input stays advisory-only pending OQ-DIAB-1 (modality schema)."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
