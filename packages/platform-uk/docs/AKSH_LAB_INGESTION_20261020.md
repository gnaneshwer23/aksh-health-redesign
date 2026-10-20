# Laboratory results ingestion — increment 1

**Date:** 20 October 2026 · Capability `lab_results` (lib/status/capabilities.ts).

## Why

Agents monitor each patient's profile, follow-up and care gaps. Before this change the record could hold HbA1c, eGFR,
ACR and LDL, but only by manual entry or CSV import, with free-text units and no code or source. The connector accepted
glucose only. Lipids, creatinine and ALT had nowhere to go.

## What changed

| Area | Change |
|---|---|
| Catalogue (`lib/labs/catalog.ts`) | 10 kinds: HbA1c, laboratory glucose, eGFR, ACR, LDL, total cholesterol, HDL, triglycerides, creatinine, ALT. Accepted LOINC codes, stored unit (UCUM), conversions (%↔mmol/mol, mg/dL↔mmol/L, mg/g↔mg/mmol, mg/dL↔µmol/L), plausible ranges. One definition for every path |
| Database (041, 042) | New kinds; provenance columns `code`, `code_system`, `external_ref`, `channel`, `replaces_id`, `connector_key_id`. Corrections are new rows that name the row they replace (database-guarded: same patient, same kind, lab only). Connector rows must carry the key that sent them |
| Connector | `POST /api/connect/v1/observations` routes LOINC-coded laboratory Observations to the record; device glucose still goes to CGM. Same result again = duplicate; amended/corrected = replacement (both kept); changed value sent as final = refused (`LAB_CONFLICTING_FINAL`) |
| Manual entry and CSV import | Lab kinds converted to the stored unit and range-checked; value and unit as entered kept (`original_value`, `original_unit`); channel recorded |
| Reads | Replaced rows no longer count in the record, risk and care gaps, or the agents' patient view |
| Guide | Connector guide lists every result, unit and LOINC code, and the correction rules |

## Increment 2 (agents read the labs)

| Area | Change |
|---|---|
| Agents' patient view (`lib/clinical-spine/spine-patient.ts`) | Latest trusted eGFR, ACR, creatinine, LDL, total cholesterol, HDL, triglycerides and ALT, each with date, channel, LOINC code and correction flag (`lib/labs/snapshot.ts`), passed into Aksh Diabetes. Simulation only (Track B gate unchanged) |
| Complication checks (`complications.ts`) | Kidney from eGFR/ACR (watch: eGFR < 60 or ACR > 3 mg/mmol; referral indicated: eGFR < 30 or ACR ≥ 30), heart from LDL ≥ 2.6 mmol/L (watch only), liver from ALT > 40 U/L (watch only). Results older than 15 months are not used and are listed as missing ("not assumed normal"). Eye and foot keep the evidence-count rule. Each signal names its basis, the values used and rule version `lab-rules-2026-10-20`. Thresholds flag for clinician review and await clinical lead sign-off; referrals still go through the referral gate |
| Clinician screen | Complications show the lab values behind each flag and the missing results |
| Patient record | Laboratory results table: latest value and unit, change since last, trend line, date, source (lab feed / staff / import), LOINC code, "corrected" marker, value as sent when converted. eGFR, ACR and LDL show "Not on record" when absent |
| HbA1c | One unit: IFCC mmol/mol in storage, engines, agents and prompts (stable band 2 mmol/mol, plausible 20–140). Facts stored in % before this change are converted on read; the demo HbA1c API accepts mmol/mol or %. % is shown only alongside, for display |

## Still to do

- CSV import columns for the new results.
- Clinical lead sign-off of the lab rule thresholds (until then they are review flags only, and complications stay In validation).
- Laboratory glucose is stored but not yet used by the agents.

## Tests

`tests/lab-results-db.test.ts` (simulation database): catalogue conversions, unknown units and implausible values
refused, LOINC uniqueness, routing (lab vs device glucose), FHIR mapping (comparators, status, missing id, code system),
connector storage with provenance, duplicate, conflicting final refused, correction kept and applied, record reads the
corrected value, database guard on mismatched corrections, clinician manual entry converted and range-checked.
Regression: connector, care network, monitoring, readings and patient spine suites pass.

## Release order

1. Apply migrations 041 and 042 to production (additive; existing code keeps working).
2. Merge: the code writes the new columns, so it must not deploy before step 1.

Rollback: revert the merge. The columns stay (additive) and are ignored by the previous code.
