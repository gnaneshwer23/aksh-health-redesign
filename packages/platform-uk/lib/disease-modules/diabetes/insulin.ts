import type { DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * Insulin Intelligence (diabetes spec area #3).
 *
 * Explanatory / safety-flag output ONLY. Feeds GUARDIAN's existing
 * hypoglycaemia / dosing-conflict alert path (lib/agents/llm-guardian.ts) —
 * this module never proposes an executable dose change.
 *
 * `doseChangeRecommendation` is a hard `null` literal type (not an optional
 * field a future version can silently populate) so no code path can start
 * emitting dosing instructions without a deliberate type change and clinical
 * sign-off. This is the module the spec's "no silent auto-dose" non-goal is
 * most directly about — treat any change here as safety-sensitive.
 *
 * v0: typed stub over a caller-supplied regimen summary. No sensitivity or
 * timing modelling yet.
 * TODO(v1): derive sensitivityEstimate/timingObservations from regimen +
 * GlucoseSignal (glucose.ts) — remains explanatory-only, feeding GUARDIAN,
 * never emitting a dose value.
 */

export type InsulinRegimenSummary = {
  medications: string[];
  reportedHypoEventCount: number;
};

export type InsulinSignal = {
  moduleId: "INSULIN";
  feedsInto: "GUARDIAN";
  patientId: string;
  patientLabel: string;
  regimenSummary: string;
  sensitivityEstimate: "insufficient_data";
  timingObservations: string[];
  hypoRiskFlag: boolean;
  /** Hard-locked: this module never proposes a dose change. */
  doseChangeRecommendation: null;
  isDoseRecommendation: false;
  limitations: string[];
} & DiabetesSignalHonesty;

export function buildInsulinSignal(
  context: DiabetesPatientContext,
  regimen?: InsulinRegimenSummary
): InsulinSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const medications = regimen?.medications ?? [];
  const hypoEvents = regimen?.reportedHypoEventCount ?? 0;

  return {
    moduleId: "INSULIN",
    feedsInto: "GUARDIAN",
    patientId: context.patientId,
    patientLabel,
    regimenSummary: medications.length ? medications.join("; ") : "No insulin regimen recorded",
    sensitivityEstimate: "insufficient_data",
    timingObservations: [],
    hypoRiskFlag: hypoEvents > 0,
    doseChangeRecommendation: null,
    isDoseRecommendation: false,
    limitations: [
      "v0 stub — no sensitivity modelling or timing analysis yet (deferred to v1).",
      "This module never generates an executable dose change; GUARDIAN + clinician review required for any medication decision.",
      hypoEvents > 0
        ? `${hypoEvents} reported hypo event(s) — route to clinician review via GUARDIAN.`
        : "No reported hypo events in supplied context."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
