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
 * area closest to a "Diabetes Twin," but v0/v1 stay a rules-based composite
 * summary — NOT a simulation. `physiologicalTwin: false` is enforced the
 * same way lib/precision-health/twin-simulation.ts enforces it: as a literal
 * type field, not a comment.
 *
 * A real Diabetes Twin (Layer 5 in docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md)
 * is out of scope here and should be its own follow-on spec once v1 signals
 * are live and trusted (see docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md v2 notes).
 *
 * v0: typed stub. Aggregates inputs into a limitations-forward summary only;
 * no trajectory scoring yet.
 * TODO(v1): implement rules-based composite scoring over glucose/hba1c/
 * complications inputs; feed the result into HORIZON as a top-level
 * explanatory summary alongside the per-area contributing factors.
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

  return {
    moduleId: "PREVENTION",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    riskTrajectoryLabel: "insufficient_data",
    personalisedPriorities: [],
    populationContext: inputs?.populationContext ?? null,
    limitations: [
      "v0 stub — rules-based composite scoring not yet implemented (deferred to v1).",
      "NOT a physiological simulation — see lib/precision-health/twin-simulation.ts for the platform's honesty pattern on this.",
      "A real Diabetes Twin (Layer 5) is a separate follow-on spec, not implied by this module."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
