/**
 * Demo patient binding — patient01 → P002 (shared with GP Patel journey).
 */
import assert from "node:assert/strict";

import {
  CANONICAL_SHARED_DEMO_PATIENT_ID,
  resolveBoundPatientIdForSession,
  resolveDemoBoundPatientId,
  readBoundPatientIdFromPreferences,
} from "../lib/auth/demo-patient-binding";

function run() {
  assert.equal(CANONICAL_SHARED_DEMO_PATIENT_ID, "P002");

  assert.equal(
    resolveDemoBoundPatientId("patient01@demo.akshhealth.com", "patient"),
    "P002"
  );
  assert.equal(
    resolveDemoBoundPatientId("Patient01@Demo.AkshHealth.com", "patient"),
    "P002"
  );
  assert.equal(resolveDemoBoundPatientId("patient01@demo.akshhealth.com", "gp"), null);
  assert.equal(resolveDemoBoundPatientId("gp01@demo.akshhealth.com", "patient"), null);

  assert.equal(
    resolveDemoBoundPatientId("patient02@demo.akshhealth.com", "patient"),
    "P027"
  );
  assert.equal(
    resolveDemoBoundPatientId("patient15@demo.akshhealth.com", "patient"),
    "P040"
  );
  assert.equal(resolveDemoBoundPatientId("patient16@demo.akshhealth.com", "patient"), null);

  assert.equal(
    readBoundPatientIdFromPreferences({ boundPatientId: "P008" }),
    "P008"
  );
  assert.equal(readBoundPatientIdFromPreferences({}), null);

  // Preference override wins over demo email map
  assert.equal(
    resolveBoundPatientIdForSession({
      role: "patient",
      email: "patient01@demo.akshhealth.com",
      preferences: { boundPatientId: "P009" },
    }),
    "P009"
  );

  // Demo email map when no preference
  assert.equal(
    resolveBoundPatientIdForSession({
      role: "patient",
      email: "patient01@demo.akshhealth.com",
      preferences: { demoCohort: true },
    }),
    "P002"
  );

  assert.equal(
    resolveBoundPatientIdForSession({
      role: "gp",
      email: "gp01@demo.akshhealth.com",
      preferences: { boundPatientId: "P002" },
    }),
    null
  );

  // Auth wires boundPatientId into JWT/session
  const authSrc = require("node:fs").readFileSync(
    require("node:path").join(process.cwd(), "lib/auth.ts"),
    "utf8"
  );
  assert.ok(authSrc.includes("boundPatientId"));
  assert.ok(authSrc.includes("demo-patient-binding"));
  assert.ok(authSrc.includes("token.boundPatientId"));
  assert.ok(authSrc.includes("session.user.boundPatientId"));

  // Companion unified on shared chart
  const companion = require("node:fs").readFileSync(
    require("node:path").join(process.cwd(), "components/dashboard/PatientCompanion.tsx"),
    "utf8"
  );
  assert.ok(companion.includes("CANONICAL_SHARED_DEMO_PATIENT_ID"));
  assert.ok(companion.includes("companionPatientId"));
  assert.ok(!companion.includes('COMPANION_DEMO_PATIENT_ID = "P001"'));
  assert.ok(!companion.includes("DIABETES_COACHING_DEMO_PATIENT_ID"));

  // Consent repo prefers Postgres when configured (no Vercel EROFS on grant)
  const consentRepo = require("node:fs").readFileSync(
    require("node:path").join(
      process.cwd(),
      "lib/repositories/consent-grant-repository.ts"
    ),
    "utf8"
  );
  assert.ok(consentRepo.includes("persistPostgres"));
  assert.ok(consentRepo.includes('source: "postgres" | "file"'));
  assert.ok(consentRepo.includes("isPostgresConfigured()"));

  console.log("demo-patient-binding + companion + consent wiring OK");
}

run();
