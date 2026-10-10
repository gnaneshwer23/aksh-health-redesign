import assert from "node:assert/strict";

import { MARKETS } from "../lib/synthetic-world/catalog";
import { getSyntheticWorld, mmolToPercent, SYNTHETIC_EMAIL_DOMAIN } from "../lib/synthetic-world/generate";

const w = getSyntheticWorld();

// Counts the product team asked for.
assert.equal(w.professionals.length, 100, "100 healthcare professionals");
assert.equal(w.patients.length, 500, "500 patients with diabetes or prediabetes");
assert.ok(w.organisations.filter((o) => o.kind === "community_pharmacy").length >= 20, "pharmacies");
for (const kind of ["primary_care_clinic", "diabetes_centre", "hospital", "laboratory", "payer", "research_institute", "device_partner"]) {
  assert.ok(w.organisations.some((o) => o.kind === kind), `has ${kind}`);
}
for (const m of MARKETS) assert.ok(w.patients.some((p) => p.market === m.code), `patients in ${m.code}`);

// Deterministic.
assert.equal(JSON.stringify(getSyntheticWorld().patients[42]), JSON.stringify(w.patients[42]));

// Referential integrity.
const orgIds = new Set(w.organisations.map((o) => o.id));
const proIds = new Set(w.professionals.map((p) => p.id));
assert.equal(new Set(w.patients.map((p) => p.id)).size, 500, "unique patient ids");
assert.equal(proIds.size, 100, "unique professional ids");
for (const pro of w.professionals) assert.ok(orgIds.has(pro.organisationId), `${pro.id} org exists`);
for (const p of w.patients) {
  assert.ok(orgIds.has(p.primaryOrganisationId) && orgIds.has(p.pharmacyId) && orgIds.has(p.payerId), `${p.id} orgs exist`);
  assert.ok(p.careTeam.length >= 3, `${p.id} has a care team`);
  for (const t of p.careTeam) assert.ok(proIds.has(t.professionalId), `${p.id} care team member exists`);
  assert.equal(w.organisations.find((o) => o.id === p.pharmacyId)?.market, p.market, `${p.id} pharmacy in own market`);
  assert.equal(p.hba1c.length, 4);
  for (const pt of p.hba1c) assert.equal(pt.hba1cPercent, mmolToPercent(pt.hba1cMmolMol));
}

// Clinically coherent synthetic data.
for (const p of w.patients) {
  const names = p.medications.map((m) => m.name);
  if (p.diabetesType === "type_1") assert.ok(names.includes("Insulin glargine") && names.includes("Insulin aspart"), `${p.id} T1 on basal-bolus`);
  if (p.egfr < 30) assert.ok(!names.includes("Metformin"), `${p.id} no metformin with eGFR < 30`);
  if (p.diabetesType === "gestational") assert.equal(p.sex, "female");
  if (p.cgm) assert.equal(p.cgm.timeInRangePct + p.cgm.timeBelowRangePct + p.cgm.timeAboveRangePct, 100);
  assert.ok(p.risk.score >= 0 && p.risk.score <= 98);
}
const bands = new Set(w.patients.map((p) => p.risk.band));
for (const b of ["Low", "Medium", "High", "VeryHigh"]) assert.ok(bands.has(b as never), `risk band ${b} represented`);
for (const pro of w.professionals.filter((x) => x.role !== "practice_manager")) assert.ok(pro.caseload > 0, `${pro.id} ${pro.role} has patients`);

// Synthetic-only identifiers.
for (const p of w.patients) {
  if (p.market === "GB") assert.match(p.phone, /^07700 900\d{3}$/, "Ofcom drama range");
  if (p.market === "US") assert.match(p.phone, /555-01\d{2}$/, "fictional 555-01xx range");
  if (p.market === "IN") assert.match(p.phone, /^\+91 00000 /, "invalid prefix by design");
  if (p.market === "AE") assert.match(p.phone, /^\+971 00 /, "invalid prefix by design");
}
for (const pro of w.professionals) assert.ok(pro.email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`), "reserved .example domain");
assert.equal(w.honesty.realPatientData, false);

console.log(`synthetic-world: ${w.organisations.length} organisations, ${w.professionals.length} professionals, ${w.patients.length} patients — PASS`);
