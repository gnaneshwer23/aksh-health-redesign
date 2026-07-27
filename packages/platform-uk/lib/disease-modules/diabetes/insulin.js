import { DIABETES_SIGNAL_HONESTY } from "./types";
export function buildInsulinSignal(context, regimen) {
    var _a, _b, _c;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    const medications = (_b = regimen === null || regimen === void 0 ? void 0 : regimen.medications) !== null && _b !== void 0 ? _b : [];
    const hypoEvents = (_c = regimen === null || regimen === void 0 ? void 0 : regimen.reportedHypoEventCount) !== null && _c !== void 0 ? _c : 0;
    return Object.assign({ moduleId: "INSULIN", feedsInto: "GUARDIAN", patientId: context.patientId, patientLabel, regimenSummary: medications.length ? medications.join("; ") : "No insulin regimen recorded", sensitivityEstimate: "insufficient_data", timingObservations: [], hypoRiskFlag: hypoEvents > 0, doseChangeRecommendation: null, isDoseRecommendation: false, limitations: [
            "v0 stub — no sensitivity modelling or timing analysis yet (deferred to v1).",
            "This module never generates an executable dose change; GUARDIAN + clinician review required for any medication decision.",
            hypoEvents > 0
                ? `${hypoEvents} reported hypo event(s) — route to clinician review via GUARDIAN.`
                : "No reported hypo events in supplied context."
        ] }, DIABETES_SIGNAL_HONESTY);
}
