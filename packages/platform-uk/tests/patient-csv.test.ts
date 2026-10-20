import assert from "node:assert/strict";

import { csvToPatients, parseCsv, PATIENT_CSV_TEMPLATE } from "../lib/network/csv";
import { importPatientSchema } from "../lib/network/service";

assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\n\n'), [["a", "b"], ["x, y", 'say "hi"']]);
assert.deepEqual(parseCsv('a\n"multi\nline"'), [["a"], ["multi\nline"]]);

const tpl = csvToPatients(PATIENT_CSV_TEMPLATE);
assert.deepEqual(tpl.missingColumns, []);
assert.equal(tpl.patients.length, 1);
assert.ok(importPatientSchema.safeParse(tpl.patients[0]).success, "template row is valid");

const bad = csvToPatients("record_number,given_name,family_name,date_of_birth,diabetes_type\nX1,Ann,Lee,14/03/1968,type 2\n");
const parsed = importPatientSchema.safeParse(bad.patients[0]);
assert.ok(!parsed.success && parsed.error.issues.some((i) => i.path[0] === "dateOfBirth"), "non-ISO date is reported");
assert.equal((bad.patients[0] as { diabetesType: string }).diabetesType, "type_2", "type normalised");

assert.deepEqual(csvToPatients("given_name,family_name\nA,B").missingColumns, ["record_number", "date_of_birth"]);
// HbA1c in % (most countries) is converted to mmol/mol on import.
const pctRow = csvToPatients("record_number,given_name,family_name,date_of_birth,latest_hba1c_percent,hba1c_date\nP1,Ana,Diaz,1970-01-01,7.0,2026-09-01").patients[0] as { observations: { value: number; unit: string }[] };
assert.equal(pctRow.observations[0]!.value, 53);
assert.equal(pctRow.observations[0]!.unit, "mmol/mol");

// Laboratory columns: converted and range-checked by the server schema; a result without labs_date is refused.
const tplParsed = importPatientSchema.parse(tpl.patients[0]);
const kinds = (tplParsed.observations ?? []).map((o) => `${o.kind}:${o.value}:${o.unit}`);
for (const k of ["egfr:58:mL/min/{1.73_m2}", "acr:4.2:mg/mmol", "creatinine:110:umol/L", "ldl:2.9:mmol/L", "alt:32:U/L"]) assert.ok(kinds.includes(k), `template carries ${k}`);
const noDate = csvToPatients("record_number,given_name,family_name,date_of_birth,egfr\nL1,Lu,Ma,1970-01-01,55").patients[0];
assert.ok(!importPatientSchema.safeParse(noDate).success, "a lab result without labs_date is refused");
const implausible = csvToPatients("record_number,given_name,family_name,date_of_birth,ldl_mmol_l,labs_date\nL2,Lu,Ma,1970-01-01,130,2026-09-01").patients[0];
const imp = importPatientSchema.safeParse(implausible);
assert.ok(!imp.success && imp.error.issues.some((i) => /LDL/.test(i.message)), "LDL entered in mg/dL in an mmol/L column is caught");
const blankLabs = csvToPatients("record_number,given_name,family_name,date_of_birth,egfr,labs_date\nL3,Lu,Ma,1970-01-01,,").patients[0] as { observations?: unknown[] };
assert.equal(blankLabs.observations, undefined, "blank lab cells add nothing");
console.log("patient-csv: parser, template, mapping, validation errors, HbA1c %, lab columns — PASS");
