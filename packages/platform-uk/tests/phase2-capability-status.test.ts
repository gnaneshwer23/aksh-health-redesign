/**
 * E1 / P4: PRISM/ATLAS honest capability-status module + read-only endpoint.
 *
 * Covers:
 *  1. Both report live:false, built:false, wired:false, scaffoldBuilt:true (P4 L2).
 *  2. GET /api/system/phase2-capability-status requires authentication.
 *  3. Any authenticated role succeeds and receives both agents' statuses.
 *  4. The response contains no live-imaging or live-research claim.
 */

import assert from "node:assert/strict";

import {
  getAtlasCapabilityStatus,
  getPhase2AgentCapabilityStatus,
  getPrismCapabilityStatus
} from "../lib/agents/phase2-capability-status";
import { GET as getPhase2CapabilityStatusRoute } from "../app/api/system/phase2-capability-status/route";

function testStatusInvariants() {
  const prism = getPrismCapabilityStatus();
  const atlas = getAtlasCapabilityStatus();

  for (const status of [prism, atlas]) {
    assert.equal(status.live, false, `${status.agentId}: live must be false`);
    assert.equal(status.built, false, `${status.agentId}: built (production) must be false`);
    assert.equal(status.wired, false, `${status.agentId}: wired must be false`);
    assert.equal(status.wiredToConductor, false, `${status.agentId}: wiredToConductor must be false`);
    assert.equal(status.ehrWrite, false, `${status.agentId}: ehrWrite must be false`);
    assert.equal(status.scaffoldBuilt, true, `${status.agentId}: P4 scaffold must be present`);
    assert.equal(status.maturity, "L2_scaffold", `${status.agentId}: maturity L2_scaffold`);
    assert.equal(status.phase, 2, `${status.agentId}: phase must be 2`);
    assert.ok(status.notProductionReason.length > 0, `${status.agentId}: notProductionReason required`);
  }

  assert.equal(prism.agentId, "PRISM");
  assert.equal(atlas.agentId, "ATLAS");

  console.log("Phase 2 capability status: PRISM/ATLAS scaffoldBuilt with live/built/wired false.");
}

function testCombinedStatusShape() {
  const combined = getPhase2AgentCapabilityStatus();
  assert.equal(combined.artifactType, "aksh-phase2-agent-capability-status");
  assert.equal(combined.agents.length, 2);
  assert.ok(combined.agents.every((agent) => agent.live === false && agent.built === false && agent.wired === false));
  assert.equal(combined.invariants.liveImagingDeployment, false);
  assert.equal(combined.invariants.clinicalEnablementApproved, false);
  assert.ok(combined.notes.length > 0);

  const serialized = JSON.stringify(combined).toLowerCase();
  assert.ok(!serialized.includes('"live":true'), "no field anywhere in the combined status may claim liveness");

  console.log("Phase 2 capability status: combined artifact shape correct, no live:true claim.");
}

function buildRequest(headers?: Record<string, string>) {
  return new Request("http://localhost:3000/api/system/phase2-capability-status", {
    headers: headers ?? {}
  });
}

async function testRouteRequiresAuthentication() {
  delete process.env.AKSH_TEST_AUTH_HEADER;
  const response = await getPhase2CapabilityStatusRoute(buildRequest());
  assert.equal(response.status, 401, "unauthenticated request must be rejected");

  console.log("Phase 2 capability status route: unauthenticated request returns 401.");
}

async function testRouteAllowsAnyAuthenticatedRole() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    for (const role of ["patient", "researcher", "gp", "practice-manager", "some-unrecognized-role"]) {
      const response = await getPhase2CapabilityStatusRoute(
        buildRequest({
          "x-user-id": `phase2_status_test_${role}`,
          "x-user-email": `phase2-status-${role}@akshhealth.com`,
          "x-user-role": role
        })
      );
      assert.equal(response.status, 200, `role "${role}" (any authenticated role) must be allowed — this is status info, not a governance export`);
      const body = (await response.json()) as { agents?: Array<{ live: boolean; scaffoldBuilt?: boolean }> };
      assert.equal(body.agents?.length, 2);
      assert.ok(body.agents?.every((agent) => agent.live === false));
      assert.ok(body.agents?.every((agent) => agent.scaffoldBuilt === true));
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("Phase 2 capability status route: any authenticated role succeeds, scaffold honesty intact.");
}

async function main() {
  testStatusInvariants();
  testCombinedStatusShape();
  await testRouteRequiresAuthentication();
  await testRouteAllowsAnyAuthenticatedRole();
  console.log("phase2-capability-status: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
