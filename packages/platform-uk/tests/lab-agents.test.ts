/**
 * Increment 2: the agents read laboratory results. Complication rules from lab values (kidney, heart, liver), missing
 * and out-of-date results reported rather than assumed normal, the evidence-count fallback where no lab rule exists,
 * and HbA1c computed in mmol/mol everywhere (including facts stored in % before the change).
 */
import assert from "node:assert/strict";

import { formatHbA1c } from "../lib/diabetes-units";
import { buildComplicationSignal, LAB_RULE_VERSION } from "../lib/disease-modules/diabetes/complications";
import { buildHbA1cSignal } from "../lib/disease-modules/diabetes/hba1c";
import { toHbA1cReading } from "../lib/disease-modules/diabetes/ingest";
import type { LabSnapshot } from "../lib/labs/snapshot";

const now = new Date("2026-10-20T00:00:00Z");
const ctx = { patientId: "P-LAB", patientLabel: "Lab patient" };
const lab = (kind: string, value: number, unit: string, observedAt = "2026-09-01T00:00:00Z") => ({ kind, value, unit, observedAt, channel: "connector", code: null, corrected: false });

// Kidney: eGFR and ACR drive the flag, with the values and rule cited.
const ckdWatch = buildComplicationSignal(ctx, "ckd", [], { egfr: lab("egfr", 52, "mL/min/{1.73_m2}"), acr: lab("acr", 2.1, "mg/mmol") } as LabSnapshot, now);
assert.equal(ckdWatch.flagLevel, "watch");
assert.equal(ckdWatch.basis, "laboratory");
assert.ok(ckdWatch.evidenceRefs.some((r) => r.includes("eGFR 52") && r.includes("eGFR below 60")));
assert.equal(ckdWatch.ruleVersion, LAB_RULE_VERSION);
const ckdRefer = buildComplicationSignal(ctx, "ckd", [], { egfr: lab("egfr", 70, "mL/min/{1.73_m2}"), acr: lab("acr", 35, "mg/mmol") } as LabSnapshot, now);
assert.equal(ckdRefer.flagLevel, "referral_indicated", "ACR 30 mg/mmol or more indicates referral for clinician review");
assert.equal(ckdRefer.referralGate, "referral_pathway", "a referral still needs a clinician's confirmation");
const ckdNormal = buildComplicationSignal(ctx, "ckd", [], { egfr: lab("egfr", 88, "mL/min/{1.73_m2}"), acr: lab("acr", 1, "mg/mmol") } as LabSnapshot, now);
assert.equal(ckdNormal.flagLevel, "none");
assert.equal(ckdNormal.missingLabs.length, 0);

// Missing and out-of-date results are reported, never assumed normal.
const ckdMissing = buildComplicationSignal(ctx, "ckd", [], { egfr: lab("egfr", 88, "mL/min/{1.73_m2}", "2024-01-01T00:00:00Z") } as LabSnapshot, now);
assert.equal(ckdMissing.flagLevel, "none");
assert.ok(ckdMissing.missingLabs.some((m) => m.includes("eGFR out of date")));
assert.ok(ckdMissing.missingLabs.some((m) => m.includes("not on record")));
assert.ok(ckdMissing.limitations.some((l) => l.includes("Not assumed normal")));

// Lipids and liver: watch only, never a referral on their own.
assert.equal(buildComplicationSignal(ctx, "cardiovascular", [], { ldl: lab("ldl", 4.9, "mmol/L") } as LabSnapshot, now).flagLevel, "watch");
assert.equal(buildComplicationSignal(ctx, "fatty_liver", [], { alt: lab("alt", 400, "U/L") } as LabSnapshot, now).flagLevel, "watch");

// Domains without a lab rule keep the evidence-count heuristic; the higher of lab and evidence wins.
const eye = buildComplicationSignal(ctx, "retinopathy", ["retinal photo: background changes", "optometrist letter"], undefined, now);
assert.equal(eye.flagLevel, "referral_indicated");
assert.equal(eye.basis, "evidence_count");
assert.equal(eye.missingLabs.length, 0);
const combined = buildComplicationSignal(ctx, "ckd", ["nephrology letter"], { egfr: lab("egfr", 25, "mL/min/{1.73_m2}"), acr: lab("acr", 2, "mg/mmol") } as LabSnapshot, now);
assert.equal(combined.flagLevel, "referral_indicated");
assert.ok(combined.evidenceRefs.includes("nephrology letter"), "caller evidence is kept alongside lab values");

// HbA1c in mmol/mol: stable band ≈2 mmol/mol, extrapolation clamped to a plausible range.
const stable = buildHbA1cSignal(ctx, [{ recordedAt: "2026-01-01T00:00:00Z", valueMmolMol: 53 }, { recordedAt: "2026-04-01T00:00:00Z", valueMmolMol: 54 }]);
assert.equal(stable.trend, "stable");
const worse = buildHbA1cSignal(ctx, [{ recordedAt: "2026-01-01T00:00:00Z", valueMmolMol: 53 }, { recordedAt: "2026-04-01T00:00:00Z", valueMmolMol: 64 }]);
assert.equal(worse.trend, "worsening");
assert.equal(worse.latestValueMmolMol, 64);
assert.ok(worse.explanation[0]!.includes("64 mmol/mol (8%)"));
const wild = buildHbA1cSignal(ctx, [{ recordedAt: "2026-01-01T00:00:00Z", valueMmolMol: 42 }, { recordedAt: "2026-01-15T00:00:00Z", valueMmolMol: 135 }]);
assert.ok(wild.predictedNext3MonthsMmolMol === 140, "clamped to the plausible maximum");
assert.equal(formatHbA1c(53), "53 mmol/mol (7%)");

// Facts stored in % before the change are read as mmol/mol.
assert.deepEqual(toHbA1cReading({ recordedAt: "2026-02-01T00:00:00Z", valuePercent: 8.2 }), { recordedAt: "2026-02-01T00:00:00Z", valueMmolMol: 66 });
assert.deepEqual(toHbA1cReading({ recordedAt: "2026-02-01T00:00:00Z", valueMmolMol: 66 }), { recordedAt: "2026-02-01T00:00:00Z", valueMmolMol: 66 });
assert.equal(toHbA1cReading({ recordedAt: "2026-02-01T00:00:00Z" }), null);

console.log("lab-agents: kidney/heart/liver lab rules, missing labs reported, evidence fallback, HbA1c in mmol/mol, legacy % facts — PASS");
