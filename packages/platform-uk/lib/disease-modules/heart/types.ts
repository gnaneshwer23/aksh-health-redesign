/**
 * Heart (Cardiovascular) Disease Intelligence — shared types (v0 stub).
 *
 * This file is a typed-stub scaffold only, added by
 * docs/PHASED_BUILD_PLAN_E.md Phase E5 (implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-5) to prove the "module on a
 * platform" pattern (docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md
 * FR-ARC-002) generalises beyond Diabetes. It deliberately mirrors the shape
 * of lib/disease-modules/diabetes/types.ts's own original v0 form — before
 * ENABLE_DIABETES_MODULE or any orchestrate.ts wiring existed for Diabetes.
 *
 * Status, explicit:
 *  - v0 typed-stub only. Nothing in this module is wired into
 *    lib/clinical-spine/orchestrate.ts, HORIZON, or GUARDIAN. There is no
 *    Heart signal-builder logic, no ingest path, no decision history, and no
 *    index.ts barrel — none of that exists yet, mirroring how none of it
 *    existed for Diabetes until docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md
 *    was written and ENABLE_DIABETES_MODULE was introduced.
 *  - No environment flag exists for Heart (an `ENABLE_HEART_MODULE`-style
 *    flag would be pure decoration with nothing reading it) — deliberately
 *    not added until there is something to gate.
 *  - docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md's OQ-ARC-4 ("should a
 *    second disease module get its own PRD chapter, or a new Volume?")
 *    remains open and Product-owned. This file does not resolve it.
 *  - The `HEART_MODULE_IDS` below are illustrative/provisional cardiovascular
 *    signal areas only, pending a real clinical-lead/product spec — exactly
 *    as Diabetes's own 9 areas were before its spec existed. They are not a
 *    commitment to build any of them.
 *
 * Module-boundary rule (restates Diabetes's own FR-DIAB-006 hard boundary,
 * which holds even for a single module): this file imports nothing from
 * lib/disease-modules/diabetes/*, and nothing in diabetes/* imports from
 * heart/* — verified by grep in tests/heart-module-stub.test.ts, not just by
 * construction.
 */

export const HEART_MODULE_IDS = [
  "BLOOD_PRESSURE",
  "LIPIDS",
  "RHYTHM",
  "HEART_FAILURE_SIGNS",
  "MEDICATION_ADHERENCE_CVD",
  "LIFESTYLE_CVD"
] as const;

export type HeartModuleId = (typeof HEART_MODULE_IDS)[number];

/** Which existing platform surface each module's output is intended to feed — reuses the same three surfaces Diabetes feeds, no new agent, no new orchestrator path. */
export type HeartFeedTarget = "HORIZON" | "GUARDIAN" | "coaching_surface";

/**
 * Illustrative only, pending a real clinical-lead/product spec (see file
 * header). Mirrors DIABETES_MODULE_FEED_TARGET's shape; not itself read by
 * any orchestrator, agent, or route today.
 */
export const HEART_MODULE_FEED_TARGET: Record<HeartModuleId, HeartFeedTarget> = {
  BLOOD_PRESSURE: "HORIZON",
  LIPIDS: "HORIZON",
  RHYTHM: "GUARDIAN",
  HEART_FAILURE_SIGNS: "GUARDIAN",
  MEDICATION_ADHERENCE_CVD: "coaching_surface",
  LIFESTYLE_CVD: "coaching_surface"
};

/**
 * Shared honesty fields for a future risk/safety-shaped Heart signal.
 * Byte-identical shape to DIABETES_SIGNAL_HONESTY
 * (lib/disease-modules/diabetes/types.ts) — no Heart signal is built yet;
 * this exists only so a future signal-builder file has a literal-type
 * contract to conform to, mirroring the pattern already used in
 * lib/precision-health/risk-state.ts and
 * lib/clinical-spine/outcomes-loop.ts (SPINE_OUTCOMES_HONESTY).
 */
export type HeartSignalHonesty = {
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
  physiologicalTwin: false;
};

export const HEART_SIGNAL_HONESTY: HeartSignalHonesty = {
  hitlRequired: true,
  ehrWrite: false,
  autoRetrain: false,
  physiologicalTwin: false
};
