import { DIABETES_SIGNAL_HONESTY } from "./types";
export function buildGlucoseSignal(context, readings = []) {
    var _a;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    if (readings.length === 0) {
        return Object.assign({ moduleId: "GLUCOSE", feedsInto: "HORIZON", patientId: context.patientId, patientLabel, tirPercent: null, variabilityScore: null, patternFlags: ["insufficient_data"], dataCompleteness: "none", limitations: [
                "No glucose readings supplied — v0 stub does not fabricate CGM/BGM data.",
                "TIR / variability / pattern derivation deferred to v1 (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md)."
            ] }, DIABETES_SIGNAL_HONESTY);
    }
    return Object.assign({ moduleId: "GLUCOSE", feedsInto: "HORIZON", patientId: context.patientId, patientLabel, tirPercent: null, variabilityScore: null, patternFlags: ["insufficient_data"], dataCompleteness: "partial", limitations: [
            `${readings.length} reading(s) received — v0 stub does not yet compute TIR/variability/patterns.`,
            "Real derivation deferred to v1."
        ] }, DIABETES_SIGNAL_HONESTY);
}
