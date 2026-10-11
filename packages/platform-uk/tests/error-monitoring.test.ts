/** Error monitoring: scrubbing removes identifying data; events are stored; one alert per fingerprint per hour. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { fingerprint, recordError, scrub } from "../lib/observability/errors";

async function run() {
  const s = scrub(
    'duplicate key value violates unique constraint "network_patients_org_ref" Key (organisation_id, record_ref)=(org-1, RV-99) for nadia.example@clinic.org +44 7700 900123 born 1959-05-02 id 3f2a9c1e-1111-4222-8333-944455556666 /api/x?token=abc',
    500
  );
  for (const leak of ["RV-99", "nadia.example@clinic.org", "7700 900123", "1959-05-02", "3f2a9c1e", "token=abc"]) assert.ok(!s.includes(leak), `scrub leaked ${leak}: ${s}`);
  assert.ok(s.includes("Key (organisation_id, record_ref)=([value])"));
  assert.equal(fingerprint("server", "Error", scrub("timeout after 3021 ms", 500)), fingerprint("server", "Error", scrub("timeout after 15 ms", 500)), "numbers do not split fingerprints");

  if (!isPostgresConfigured()) return console.log("error-monitoring: scrub PASS; DB part skipped (no DATABASE_URL)");
  // Alert path without sending mail: no provider configured in this process.
  delete process.env.RESEND_API_KEY;
  delete process.env.SMTP_HOST;
  process.env.OPS_ALERT_EMAIL = "ops@akshhealth.test";
  // Letters only: a run of digits in the route would (correctly) be scrubbed to [number] before storage.
  const route = `/test/${randomUUID().slice(0, 8).replace(/\d/g, (d) => "abcdefghij"[Number(d)]!)}`;
  await recordError({ source: "server", route, name: "TestError", message: "boom 1" });
  await recordError({ source: "server", route, name: "TestError", message: "boom 2" });
  const rows = (await getPgPool().query(`SELECT alerted, environment FROM aksh.error_events WHERE route = $1 ORDER BY id`, [route])).rows;
  assert.equal(rows.length, 2, "both occurrences stored");
  assert.deepEqual(rows.map((r) => r.alerted), [true, false], "only the first occurrence in the window alerts");

  // The tenant role cannot read the error log.
  const c = await getPgPool().connect();
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL ROLE aksh_tenant");
    await assert.rejects(c.query(`SELECT 1 FROM aksh.error_events LIMIT 1`), /permission denied/);
    await c.query("ROLLBACK");
  } finally {
    c.release();
  }
  await getPgPool().query(`DELETE FROM aksh.error_events WHERE route = $1`, [route]);
  console.log("error-monitoring: scrub, storage, alert throttling, tenant denial — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
