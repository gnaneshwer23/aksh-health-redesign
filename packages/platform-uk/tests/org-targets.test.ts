/**
 * Organisation clinical targets: defaults until chosen, only the fixed options accepted, and the flag follows the
 * organisation's choice and says which value applied.
 */
import assert from "node:assert/strict";

import { buildComplicationSignal } from "../lib/disease-modules/diabetes/complications";
import type { LabSnapshot } from "../lib/labs/snapshot";
import { DEFAULT_TARGETS, orgTargets } from "../lib/rules/targets";

assert.equal(DEFAULT_TARGETS.ldlWatchMmol, 2.6);
assert.equal(DEFAULT_TARGETS.hba1cTargetMmol, 53);
assert.equal(DEFAULT_TARGETS.chosen.ldlWatchMmol, false);
const chosen = orgTargets({ ldlWatchMmol: "1.8", hba1cTargetMmol: "58" });
assert.deepEqual([chosen.ldlWatchMmol, chosen.hba1cTargetMmol, chosen.chosen.ldlWatchMmol], [1.8, 58, true]);
const bogus = orgTargets({ ldlWatchMmol: "0.5", hba1cTargetMmol: 99 as never });
assert.deepEqual([bogus.ldlWatchMmol, bogus.hba1cTargetMmol, bogus.chosen.ldlWatchMmol], [2.6, 53, false], "unknown values fall back to the default");

const now = new Date("2026-10-21T00:00:00Z");
const labs = { ldl: { kind: "ldl", value: 2.0, unit: "mmol/L", observedAt: "2026-09-01T00:00:00Z", channel: "connector", code: null, corrected: false } } as LabSnapshot;
const ctx = { patientId: "P", patientLabel: "P" };
assert.equal(buildComplicationSignal(ctx, "cardiovascular", [], labs, now).flagLevel, "none", "LDL 2.0 is below the default 2.6");
const strict = buildComplicationSignal(ctx, "cardiovascular", [], labs, now, chosen);
assert.equal(strict.flagLevel, "watch", "LDL 2.0 is above the organisation's 1.8");
assert.deepEqual(strict.ruleIds, ["lipids.ldl_watch"]);
assert.ok(strict.evidenceRefs[0]!.includes("LDL 1.8 mmol/L or more (organisation target)"));
console.log("org-targets: defaults, fixed options only, the flag follows the organisation's choice and names it — PASS");
