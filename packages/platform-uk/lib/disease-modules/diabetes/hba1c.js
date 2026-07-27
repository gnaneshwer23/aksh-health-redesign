import { DIABETES_SIGNAL_HONESTY } from "./types";
export function buildHbA1cSignal(context, readings = []) {
    var _a, _b;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    const latest = readings.length ? readings[readings.length - 1] : null;
    return Object.assign({ moduleId: "HBA1C", feedsInto: "HORIZON", patientId: context.patientId, patientLabel, latestValuePercent: (_b = latest === null || latest === void 0 ? void 0 : latest.valuePercent) !== null && _b !== void 0 ? _b : null, trend: "insufficient_data", predictedNext3MonthsPercent: null, isDiagnosticPrediction: false, explanation: latest
            ? [`Latest recorded HbA1c: ${latest.valuePercent}% — v0 stub does not compute a trend yet.`]
            : ["No HbA1c readings supplied — v0 stub does not fabricate lab values."], limitations: [
            "Trend / 3-month estimate derivation deferred to v1 (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md).",
            "Any future estimate remains a non-diagnostic trend, never a clinical prediction — wording pending clinical lead sign-off."
        ] }, DIABETES_SIGNAL_HONESTY);
}
