/**
 * Production readiness: rate limits shared across instances (database-backed), retention, organisation and patient
 * exports (complete, scoped, no secrets). Refuses a database marked production.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { exportOrganisation, exportOwnData } from "../lib/export/service";
import { createKey } from "../lib/connector/service";
import { loadNetworkContext } from "../lib/network/context";
import { acceptPatientInvite, acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";
import { checkRateLimit } from "../lib/rate-limit";
import { addReading } from "../lib/readings/service";
import { runRetention } from "../lib/retention/service";

async function run() {
  if (!isPostgresConfigured()) return console.log("readiness-db: skipped (no DATABASE_URL)");
  assertSeedingAllowed("readiness-db");
  await assertNotProductionDatabase(getPgPool(), "readiness-db");
  delete process.env.DISABLE_RATE_LIMIT;
  const tag = randomUUID().slice(0, 8);

  // Rate limits are counted in the database: the limit holds however many "instances" ask.
  const key = `test:${tag}`;
  const results = await Promise.all(Array.from({ length: 7 }, () => checkRateLimit(key, 5, 60_000)));
  assert.equal(results.filter((r) => r.success).length, 5, "exactly the limit succeeds under concurrency");
  assert.ok(results.filter((r) => !r.success).every((r) => (r.retryAfterSeconds ?? 0) >= 1));
  const stored = await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.rate_limits WHERE key_hash = encode(sha256($1::bytea), 'hex')`, [key]);
  assert.equal(stored.rows[0].n, 1, "one window row, key stored hashed");
  assert.equal((await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.rate_limits WHERE key_hash = $1`, [key])).rows[0].n, 0, "raw key never stored");

  // Retention: old error events and expired windows go; recent ones stay.
  await getPgPool().query(
    `INSERT INTO aksh.error_events (environment, source, fingerprint, route, name, message, occurred_at) VALUES
     ('local', 'server', 'old-${tag}', '/retention', 'E', 'old', NOW() - INTERVAL '120 days'),
     ('local', 'server', 'new-${tag}', '/retention', 'E', 'new', NOW() - INTERVAL '2 days')`
  );
  await getPgPool().query(`INSERT INTO aksh.rate_limits (key_hash, window_start, count) VALUES ($1, NOW() - INTERVAL '3 days', 9)`, [`old-${tag}`]);
  const retention = await runRetention();
  assert.ok(retention.errorEvents >= 1 && retention.rateLimitWindows >= 1);
  const left = (await getPgPool().query(`SELECT fingerprint FROM aksh.error_events WHERE fingerprint IN ($1, $2)`, [`old-${tag}`, `new-${tag}`])).rows.map((r) => r.fingerprint);
  assert.deepEqual(left, [`new-${tag}`]);

  // Exports.
  const mk = async (label: string) => {
    const id = randomUUID();
    await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, '$2a$10$secret-hash-never-exported')`, [id, `ready-${label}-${id.slice(0, 8)}@akshhealth.test`]);
    return id;
  };
  const adminId = await mk("admin");
  const org = await createOrganisation({ userId: adminId, email: `ra-${tag}@akshhealth.test`, displayName: "Admin", role: "practice-manager" }, { name: `Export Clinic ${tag}`, kind: "clinic" });
  const admin = await loadNetworkContext(adminId, "practice-manager");
  const [patient] = (await importPatients(admin, org.id, { patients: [{ recordRef: `EX-${tag}`, givenName: "Iris", familyName: "Export", dateOfBirth: "1975-07-07" }] } as never)) as unknown as { id: string }[];
  await createKey(admin, org.id, { name: "Schedule" });
  const code = (await createInvite(admin, org.id, { kind: "patient", patientId: patient!.id })).code;
  const nurseId = await mk("nurse");
  await acceptStaffInvite({ userId: nurseId, email: `rn-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { code: (await createInvite(admin, org.id, { kind: "staff", role: "nurse" })).code });
  const nurse = await loadNetworkContext(nurseId, "nurse");
  await assert.rejects(exportOrganisation(nurse, org.id), (e: unknown) => e instanceof NetworkError && e.status === 403, "only admins export");

  const data = await exportOrganisation(await loadNetworkContext(adminId, "practice-manager"), org.id);
  assert.equal(data.format, "aksh-export-v1");
  assert.equal(data.patients.length, 1);
  assert.equal(data.members.length, 2);
  assert.equal(data.connections.length, 1);
  const text = JSON.stringify(data);
  for (const secret of ["password_hash", "secret-hash-never-exported", "key_hash", "code_hash", code]) assert.ok(!text.includes(secret), `export must not contain ${secret}`);
  assert.ok(data.auditTrail.some((a: { action: string }) => a.action === "organisation.created"));

  const patientUser = await mk("patient");
  await acceptPatientInvite({ userId: patientUser }, { code, dateOfBirth: "1975-07-07" });
  const pctx = await loadNetworkContext(patientUser, "patient");
  await addReading(pctx, { kind: "glucose", value: 6.1, unit: "mmol/L", observedAt: new Date().toISOString(), clientRef: randomUUID() });
  const mine = await exportOwnData(pctx, "patient@example.test");
  assert.equal(mine.record!.name, "Iris Export");
  assert.equal(mine.readings.length, 1);
  assert.ok(!JSON.stringify(mine).includes("secret-hash-never-exported"));
  await assert.rejects(exportOwnData(admin, "x"), (e: unknown) => e instanceof NetworkError && e.status === 403);
  console.log("readiness-db: shared rate limits, retention, organisation and patient exports (scoped, no secrets) — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
