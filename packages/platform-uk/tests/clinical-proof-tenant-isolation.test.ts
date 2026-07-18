import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";

import {
  assertAdminDeniedClinicalApi,
  assertPatientCannotAccessOtherPatient,
  assertPracticeCannotSeeOtherPractice,
  evaluateClinicalApiAccess,
  evaluatePatientUrlAccess,
  filterRecordsForPractice
} from "../lib/clinical-proof/tenant-isolation";
import { DEFAULT_PRACTICE_ID } from "../lib/repositories/constants";
import { jsonFileReviewCaseRepositoryAdapter } from "../lib/storage/json-file-review-case-adapter";
import type { ReviewCase } from "../lib/types";

async function run() {
  // --- Practice A cannot see practice B ---
  const practiceA = "practice-alpha";
  const practiceB = "practice-beta";
  const mixed = [
    { id: "case-a1", practiceId: practiceA },
    { id: "case-b1", practiceId: practiceB },
    { id: "case-b2", practiceId: practiceB }
  ];

  const visibleToA = filterRecordsForPractice(mixed, practiceA);
  assert.equal(visibleToA.length, 1);
  assert.equal(visibleToA[0]?.id, "case-a1");
  assertPracticeCannotSeeOtherPractice(practiceA, mixed.filter((r) => r.practiceId === practiceB));

  const visibleToB = filterRecordsForPractice(mixed, practiceB);
  assert.equal(visibleToB.length, 2);
  assert.equal(
    visibleToB.some((r) => r.practiceId === practiceA),
    false
  );

  // File adapter: practice-scoped isolation without Postgres
  const scopeKey = `tenant_iso_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  const dataFile = path.join(dataDir, `review-cases.${scopeKey}.json`);

  const caseA = {
    id: "tenant-case-a",
    practiceId: practiceA,
    userId: "gp-a",
    patientLabel: "Practice A patient",
    status: "pending_review"
  } as ReviewCase;
  const caseB = {
    id: "tenant-case-b",
    practiceId: practiceB,
    userId: "gp-b",
    patientLabel: "Practice B patient",
    status: "pending_review"
  } as ReviewCase;

  await writeFile(dataFile, JSON.stringify([caseA, caseB], null, 2), "utf8");

  const fromA = await jsonFileReviewCaseRepositoryAdapter.readReviewCases(scopeKey, practiceA);
  assert.ok(fromA.some((c) => c.id === "tenant-case-a"));
  assert.equal(
    fromA.some((c) => c.id === "tenant-case-b"),
    false,
    "Practice A must not see Practice B case"
  );

  const fromB = await jsonFileReviewCaseRepositoryAdapter.readReviewCases(scopeKey, practiceB);
  assert.ok(fromB.some((c) => c.id === "tenant-case-b"));
  assert.equal(fromB.some((c) => c.id === "tenant-case-a"), false);

  const crossRead = await jsonFileReviewCaseRepositoryAdapter.readReviewCaseById(
    "tenant-case-b",
    scopeKey,
    undefined,
    practiceA
  );
  assert.equal(crossRead, null, "Cross-practice read-by-id must return null");

  // Default practice still works for seed-shaped rows without practiceId
  const defaultScoped = filterRecordsForPractice(
    [
      { id: "seed-1", practiceId: undefined },
      { id: "other", practiceId: practiceB }
    ],
    DEFAULT_PRACTICE_ID
  );
  assert.equal(defaultScoped.length, 1);
  assert.equal(defaultScoped[0]?.id, "seed-1");

  // --- Patient cannot access another patient's URL ---
  assertPatientCannotAccessOtherPatient({
    role: "patient",
    boundPatientId: "P002",
    requestedPatientId: "P002"
  });

  const crossPatient = evaluatePatientUrlAccess({
    role: "patient",
    boundPatientId: "P002",
    requestedPatientId: "P018"
  });
  assert.equal(crossPatient.allowed, false);
  assert.equal(crossPatient.status, 403);
  assert.throws(
    () =>
      assertPatientCannotAccessOtherPatient({
        role: "patient",
        boundPatientId: "P002",
        requestedPatientId: "P018"
      }),
    /cannot access patient/
  );

  // GP is not blocked by patient-url check
  assert.equal(
    evaluatePatientUrlAccess({
      role: "gp",
      boundPatientId: null,
      requestedPatientId: "P018"
    }).allowed,
    true
  );

  // --- Admin cannot read clinical records via clinical APIs ---
  for (const role of [
    "practice-manager",
    "operations_lead",
    "ics-lead",
    "hospital-executive",
    "researcher"
  ]) {
    assertAdminDeniedClinicalApi(role);
    const denied = evaluateClinicalApiAccess({ role, requestedPatientId: "P002" });
    assert.equal(denied.allowed, false);
    assert.equal(denied.status, 403);
  }

  for (const role of ["gp", "nurse", "pharmacist", "clinical_reviewer"]) {
    assert.equal(
      evaluateClinicalApiAccess({ role, requestedPatientId: "P002" }).allowed,
      true
    );
  }

  // Patient clinical API: only bound id
  assert.equal(
    evaluateClinicalApiAccess({
      role: "patient",
      boundPatientId: "P002",
      requestedPatientId: "P002"
    }).allowed,
    true
  );
  assert.equal(
    evaluateClinicalApiAccess({
      role: "patient",
      boundPatientId: "P002",
      requestedPatientId: "P009"
    }).allowed,
    false
  );

  // Route wiring must call the policy helper (honest contract — not inventing RLS on Neo4j)
  const patientRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/neo4j/patient/route.ts"),
    "utf8"
  );
  assert.ok(patientRoute.includes("evaluateClinicalApiAccess"));
  assert.ok(patientRoute.includes("x-bound-patient-id") || patientRoute.includes("boundPatientId"));

  const guardianRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/neo4j/guardian/route.ts"),
    "utf8"
  );
  assert.ok(guardianRoute.includes("evaluateClinicalApiAccess"));

  // Migration documents RLS scaffold
  const migration = fs.readFileSync(
    path.join(process.cwd(), "db/migrations/001_review_cases.sql"),
    "utf8"
  );
  assert.ok(migration.includes("ROW LEVEL SECURITY"));
  assert.ok(migration.includes("review_cases_tenant_isolation"));

  try {
    await unlink(dataFile);
  } catch {
    // ignore
  }

  console.log(
    "Tenant / RLS isolation clinical-proof passed (practice filter, patient URL deny, admin clinical API deny)."
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
