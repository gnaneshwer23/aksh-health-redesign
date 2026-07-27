/**
 * Diabetes Disease Intelligence — shared types (v0 stub).
 *
 * Diabetes is a module on the Aksh Intelligence Platform, not a separate
 * product. These types back the 9 signal/coaching areas from the spec below.
 * They feed the EXISTING HORIZON (risk) and GUARDIAN (safety) agents — this
 * is not a set of 9 new LLM agents, and it introduces no new orchestrator,
 * audit trail, or auth boundary. CONDUCTOR and SHIELD remain the only
 * instances of each.
 *
 * Spec:   docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md
 * ADRs:   docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md
 *         docs/ADR_TECH_STACK_MODERNIZATION.md
 *
 * v0 status: typed stubs only. Nothing in this module is wired into
 * lib/clinical-spine/orchestrate.ts, lib/agents/llm-oracle.ts, or
 * lib/agents/llm-guardian.ts yet — see each file's TODO(v1) comment.
 */
export const DIABETES_MODULE_IDS = [
    "GLUCOSE",
    "HBA1C",
    "INSULIN",
    "GLP1",
    "NUTRITION",
    "EXERCISE",
    "BEHAVIOUR",
    "COMPLICATIONS",
    "PREVENTION"
];
export const DIABETES_MODULE_FEED_TARGET = {
    GLUCOSE: "HORIZON",
    HBA1C: "HORIZON",
    INSULIN: "GUARDIAN",
    GLP1: "GUARDIAN",
    NUTRITION: "coaching_surface",
    EXERCISE: "coaching_surface",
    BEHAVIOUR: "coaching_surface",
    COMPLICATIONS: "HORIZON",
    PREVENTION: "HORIZON"
};
export const DIABETES_SIGNAL_HONESTY = {
    hitlRequired: true,
    ehrWrite: false,
    autoRetrain: false,
    physiologicalTwin: false
};
