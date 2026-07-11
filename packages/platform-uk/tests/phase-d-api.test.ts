import assert from "node:assert/strict";

import { GET as getNeo4jHealth } from "../app/api/neo4j/health/route";
import { GET as getProfile } from "../app/api/profile/route";
import { checkNeo4jHealth, isNeo4jConfigured } from "../lib/neo4j";
import {
  buildEmptyStateMessage,
  buildProfileGreeting,
  filterGpPatients,
  filterGpPatientsForProfile,
  getPersonalizedLabel,
  resolveOrganisationName,
  toOrgSlug,
} from "../lib/profile/personalization";

function buildAuthedRequest(pathname: string, extraHeaders: Record<string, string> = {}) {
  return new Request(`http://localhost:3000${pathname}`, {
    headers: {
      "x-user-id": "phase_d_test_user",
      "x-user-email": "phase-d@akshhealth.com",
      "x-user-role": "gp",
      "x-user-name": "Dr. Morgan (GP)",
      "x-user-organisation": "Riverside Medical Centre",
      ...extraHeaders,
    },
  });
}

async function run() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const health = await getNeo4jHealth(buildAuthedRequest("/api/neo4j/health"));
  assert.equal(health.status, 200);
  const healthBody = (await health.json()) as { connected: boolean; mode: "live" | "mock" };
  assert.equal(typeof healthBody.connected, "boolean");
  assert.ok(healthBody.mode === "live" || healthBody.mode === "mock");

  const configured = isNeo4jConfigured();
  const directHealth = await checkNeo4jHealth();
  assert.equal(directHealth.mode, configured ? directHealth.connected ? "live" : "mock" : "mock");

  const profileResponse = await getProfile(buildAuthedRequest("/api/profile"));
  assert.equal(profileResponse.status, 200);
  const profileBody = (await profileResponse.json()) as {
    fullName: string | null;
    role: string;
    organisation: string | null;
    source: string;
  };
  assert.equal(profileBody.fullName, "Dr. Morgan (GP)");
  assert.equal(profileBody.role, "gp");
  assert.equal(profileBody.organisation, "Riverside Medical Centre");
  assert.ok(profileBody.source === "database" || profileBody.source === "session");

  assert.equal(
    resolveOrganisationName("practice-manager", null, {}, { practiceName: "Oakwood Health Practice" }),
    "Oakwood Health Practice"
  );
  assert.match(buildProfileGreeting("Dr Morgan"), /^Good (morning|afternoon|evening), Dr Morgan$/);

  const patients = [
    { id: "P001", supervisingGp: "Dr Morgan" },
    { id: "P002", supervisingGp: "Dr Patel" },
  ];
  const filtered = filterGpPatients(patients, "Dr. Morgan (GP)");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "P001");

  const profileScoped = filterGpPatientsForProfile(
    [
      { id: "P001", supervisingGp: "Dr Morgan", organisation: "Riverside Medical Centre" },
      { id: "P002", supervisingGp: "Dr Williams", organisation: "Oakwood Health Practice" },
    ],
    {
      userId: "test",
      email: null,
      fullName: "Dr. Morgan (GP)",
      role: "gp",
      organisation: "Riverside Medical Centre",
      practiceOds: null,
      preferences: {},
      onboardingComplete: true,
      emailVerified: true,
      identity: {},
      organisationDetails: {},
      source: "session",
    }
  );
  assert.equal(profileScoped.length, 1);
  assert.equal(profileScoped[0]?.id, "P001");

  assert.equal(getPersonalizedLabel(null, "Fallback Org"), "Fallback Org");
  assert.equal(toOrgSlug("North Thames Clinical Informatics Unit"), "north-thames-clinical-informatics-unit");
  assert.match(
    buildEmptyStateMessage(
      { organisation: "Riverside Medical Centre" } as Parameters<typeof buildEmptyStateMessage>[0],
      "patients",
      "No patients"
    ),
    /Riverside Medical Centre/
  );

  const unauth = await getProfile(new Request("http://localhost:3000/api/profile"));
  assert.equal(unauth.status, 401);

  console.log("Phase D API smoke checks passed.");
}

void run().finally(() => {
  delete process.env.AKSH_TEST_AUTH_HEADER;
});
