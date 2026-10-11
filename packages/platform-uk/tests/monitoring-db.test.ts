/**
 * CGM monitoring and the device connector: FHIR Observation parsing (pure), urgency ranking (pure), then the database —
 * a hypoglycaemia patient first, a stopped feed second, an on-target connector-fed patient last; connector counts,
 * duplicates, unknown patients and role limits.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { listMonitoring } from "../lib/cgm/monitoring";
import { urgency } from "../lib/cgm/metrics";
import { commitUpload } from "../lib/cgm/service";
import { observationFromFhir } from "../lib/connector/fhir";
import { authenticate, createKey, receiveObservations } from "../lib/connector/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { updateOrganisation } from "../lib/network/admin";
import { loadNetworkContext } from "../lib/network/context";
import { NetworkError, acceptStaffInvite, createInvite, createOrganisation, importPatients } from "../lib/network/service";

const obs = (over: Record<string, unknown> = {}) => ({
  resourceType: "Observation",
  id: randomUUID(),
  status: "final",
  code: { coding: [{ system: "http://loinc.org", code: "14745-4", display: "Glucose [Moles/volume] in Body fluid" }] },
  valueQuantity: { value: 6.2, unit: "mmol/L", code: "mmol/L" },
  effectiveDateTime: new Date(Date.now() - 3_600_000).toISOString(),
  subject: { identifier: { value: "MRN-1" } },
  ...over,
});

function pure() {
  const ok = observationFromFhir(obs());
  assert.ok(ok.ok && ok.mmol === 6.2 && ok.patientIdentifiers[0] === "MRN-1");
  const mg = observationFromFhir(obs({ valueQuantity: { value: 180, unit: "mg/dL" }, code: { text: "Interstitial glucose" } }));
  assert.ok(mg.ok && mg.mmol === 10);
  for (const [over, code] of [
    [{ status: "preliminary" }, "IGNORED_STATUS"],
    [{ code: { text: "Heart rate" } }, "NOT_GLUCOSE"],
    [{ valueQuantity: { value: 6, unit: "%" } }, "INVALID_VALUE"],
    [{ effectiveDateTime: "2026-10-10T08:00:00" }, "INVALID_TIME"],
    [{ subject: { reference: "Patient/1" } }, "NO_PATIENT_IDENTIFIER"],
    [{ valueQuantity: { value: 900, unit: "mg/dL" } }, "OUT_OF_RANGE"],
  ] as const) {
    const f = observationFromFhir(obs(over as Record<string, unknown>));
    assert.ok(!f.ok && f.code === code, `${JSON.stringify(over)} -> ${code}`);
  }
  const base = { veryLow: 0, low: 0, inRange: 80, veryHigh: 0, sufficient: true, stale: false };
  assert.ok(urgency({ ...base, veryLow: 2 }) < urgency({ ...base, low: 5 }));
  assert.ok(urgency({ ...base, low: 5 }) < urgency({ ...base, stale: true }));
  assert.ok(urgency({ ...base, stale: true }) < urgency({ ...base, inRange: 40 }));
  assert.ok(urgency({ ...base, inRange: 60 }) < urgency({ ...base, sufficient: false }));
  assert.equal(urgency(base), 6);
}

/** Generic CSV with offsets: `days` of 5-minute readings ending `endDaysAgo` days ago, values from `pick`. */
function csv(days: number, endDaysAgo: number, pick: (i: number) => number) {
  const lines = ["timestamp,glucose mmol/L"];
  const end = Date.now() - endDaysAgo * 86_400_000;
  let i = 0;
  for (let t = end - days * 86_400_000; t < end; t += 300_000, i++) lines.push(`${new Date(t).toISOString()},${pick(i).toFixed(1)}`);
  return lines.join("\n");
}

async function run() {
  pure();
  if (!isPostgresConfigured()) return console.log("monitoring-db: pure checks PASS; DB part skipped (no DATABASE_URL)");
  assertSeedingAllowed("monitoring-db");
  await assertNotProductionDatabase(getPgPool(), "monitoring-db");
  const tag = randomUUID().slice(0, 6);
  const mk = async (label: string) => {
    const id = randomUUID();
    await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `mon-${label}-${id.slice(0, 8)}@akshhealth.test`]);
    return id;
  };
  const nurseId = await mk("nurse");
  const org = await createOrganisation({ userId: nurseId, email: `mn-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { name: `Monitor Clinic ${tag}`, kind: "diabetes_centre" });
  let nurse = await loadNetworkContext(nurseId, "nurse");
  await updateOrganisation(nurse, org.id, { locale: { timezone: "UTC" } });
  nurse = await loadNetworkContext(nurseId, "nurse");
  const [hypo, stopped, fed] = (await importPatients(nurse, org.id, { patients: [
    { recordRef: `HY-${tag}`, givenName: "Hana", familyName: "Hypo", dateOfBirth: "1980-01-01" },
    { recordRef: `ST-${tag}`, givenName: "Sam", familyName: "Stopped", dateOfBirth: "1981-01-01" },
    { recordRef: `FD-${tag}`, givenName: "Faye", familyName: "Fed", dateOfBirth: "1982-01-01" },
  ] } as never)) as unknown as { id: string }[];

  // Hana: 3% of readings below 3.0. Sam: good control but nothing for 5 days. Faye: on target, via the device connector.
  await commitUpload(nurse, hypo!.id, csv(14, 0, (i) => (i % 33 === 0 ? 2.6 : 7)), undefined);
  await commitUpload(nurse, stopped!.id, csv(14, 5, () => 6.5), undefined);
  const key = await authenticate(`Bearer ${(await createKey(nurse, org.id, { name: "CGM aggregator" })).key}`);
  const now = Date.now();
  const entries = Array.from({ length: 14 * 288 }, (_, i) => ({
    resource: obs({ subject: { identifier: { value: `FD-${tag}` } }, effectiveDateTime: new Date(now - (i + 1) * 300_000).toISOString(), valueQuantity: { value: 6 + (i % 3) * 0.5, unit: "mmol/L" } }),
  }));
  const extras = [
    { resource: obs({ subject: { identifier: { value: "NOBODY" } } }) },
    { resource: obs({ code: { text: "Heart rate" } }) },
    { resource: obs({ effectiveDateTime: "2026-10-10T08:00:00" }) },
  ];
  const batch1 = await receiveObservations(key, { resourceType: "Bundle", type: "collection", entry: [...entries.slice(0, 2000), ...extras] });
  assert.equal(batch1.counts.ACCEPTED, 2000);
  assert.equal(batch1.counts.UNKNOWN_PATIENT, 1);
  assert.equal(batch1.counts.NOT_GLUCOSE, 1);
  assert.equal(batch1.counts.INVALID_TIME, 1);
  const batch2 = await receiveObservations(key, { resourceType: "Bundle", entry: entries.slice(1500) });
  assert.equal(batch2.counts.ACCEPTED, entries.length - 2000);
  assert.equal(batch2.counts.DUPLICATE, 500, "overlapping pushes never double count");

  const list = (await listMonitoring(nurse)).filter((r) => [hypo!.id, stopped!.id, fed!.id].includes(r.patientId));
  assert.deepEqual(list.map((r) => r.patientId), [hypo!.id, stopped!.id, fed!.id], JSON.stringify(list.map((r) => [r.name, r.urgency, r.flags])));
  assert.ok(list[0]!.flags.includes("time below 3.0 mmol/L is 1% or more"));
  assert.ok(list[1]!.stale && /no CGM data for 5 days/.test(list[1]!.flags[0]!));
  assert.ok(list[2]!.sufficient && list[2]!.urgency === 6, JSON.stringify(list[2]));

  // Non-clinical staff do not get the clinical worklist.
  const mgrId = await mk("mgr");
  await acceptStaffInvite({ userId: mgrId, email: `mg-${tag}@akshhealth.test`, displayName: "Manager", role: "practice-manager" }, { code: (await createInvite(nurse, org.id, { kind: "staff", role: "practice-manager" })).code });
  await assert.rejects(listMonitoring(await loadNetworkContext(mgrId, "practice-manager")), (e: unknown) => e instanceof NetworkError && e.status === 403);
  console.log("monitoring-db: observation parsing, urgency, worklist order, device connector counts and duplicates, role limits — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
