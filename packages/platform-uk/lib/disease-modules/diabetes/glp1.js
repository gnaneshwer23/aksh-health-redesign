import { DIABETES_SIGNAL_HONESTY } from "./types";
export function buildGlp1Signal(context, reportedSideEffects = []) {
    var _a;
    const patientLabel = ((_a = context.patientLabel) === null || _a === void 0 ? void 0 : _a.trim()) || context.patientId;
    return Object.assign({ moduleId: "GLP1", feedsInto: "GUARDIAN", patientId: context.patientId, patientLabel, suitabilitySignal: "insufficient_data", responseTrend: "insufficient_data", sideEffectFlags: reportedSideEffects, prescribingRecommendation: null, isPrescribingRecommendation: false, limitations: [
            "v0 stub — no suitability or response-trend modelling yet (deferred to v1).",
            "This module never initiates or changes a GLP-1 prescription; clinician review required via GUARDIAN.",
            reportedSideEffects.length
                ? `${reportedSideEffects.length} reported side-effect flag(s) supplied.`
                : "No reported side effects in supplied context."
        ] }, DIABETES_SIGNAL_HONESTY);
}
