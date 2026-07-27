import { DIABETES_SIGNAL_HONESTY } from "./types";
export function buildPreventionSignal(context, inputs) {
    var _a, _b;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    return Object.assign({ moduleId: "PREVENTION", feedsInto: "HORIZON", patientId: context.patientId, patientLabel, riskTrajectoryLabel: "insufficient_data", personalisedPriorities: [], populationContext: (_b = inputs === null || inputs === void 0 ? void 0 : inputs.populationContext) !== null && _b !== void 0 ? _b : null, limitations: [
            "v0 stub — rules-based composite scoring not yet implemented (deferred to v1).",
            "NOT a physiological simulation — see lib/precision-health/twin-simulation.ts for the platform's honesty pattern on this.",
            "A real Diabetes Twin (Layer 5) is a separate follow-on spec, not implied by this module."
        ] }, DIABETES_SIGNAL_HONESTY);
}
