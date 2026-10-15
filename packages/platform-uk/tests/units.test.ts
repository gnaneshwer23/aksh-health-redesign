/** Diabetes units for any country (lib/units.ts) and unit-aware CGM flags. Pure. */
import assert from "node:assert/strict";

import { consensusFlags } from "../lib/cgm/metrics";
import { defaultUnits, formatGlucose, formatHba1c, hba1cPercentFrom } from "../lib/units";

assert.equal(formatGlucose(3.0, "mg/dL"), "54 mg/dL");
assert.equal(formatGlucose(13.9, "mg/dL"), "250 mg/dL");
assert.equal(formatGlucose(3.0), "3.0 mmol/L");
assert.equal(formatGlucose(7.25, "mmol/L"), "7.3 mmol/L");
assert.equal(hba1cPercentFrom(53), 7.0);
assert.equal(formatHba1c(53, "%"), "7%");
assert.equal(formatHba1c(64, "mmol/mol"), "64 mmol/mol");

assert.deepEqual(defaultUnits("en-US"), { glucoseUnit: "mg/dL", hba1cUnit: "%" });
assert.deepEqual(defaultUnits("hi-IN"), { glucoseUnit: "mg/dL", hba1cUnit: "%" });
assert.deepEqual(defaultUnits("en-GB"), { glucoseUnit: "mmol/L", hba1cUnit: "mmol/mol" });
assert.deepEqual(defaultUnits("en-AU"), { glucoseUnit: "mmol/L", hba1cUnit: "%" });
assert.deepEqual(defaultUnits("CA"), { glucoseUnit: "mmol/L", hba1cUnit: "%" });
assert.deepEqual(defaultUnits(null), { glucoseUnit: "mg/dL", hba1cUnit: "%" }, "unknown: the most common units worldwide");

const m = { veryLow: 2, low: 3, inRange: 60, veryHigh: 6, cvPct: 30, days: 14, wearPct: 90, sufficient: true };
assert.ok(consensusFlags(m, "mg/dL").includes("time below 54 mg/dL is 1% or more"));
assert.ok(consensusFlags(m, "mg/dL").includes("time above 250 mg/dL is 5% or more"));
assert.ok(consensusFlags(m).includes("time below 3.0 mmol/L is 1% or more"));
console.log("units: formatting, country defaults, unit-aware CGM flags — PASS");
