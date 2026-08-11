/**
 * E1 (docs/PHASED_BUILD_PLAN_E.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-1): PRISM/ATLAS honest
 * capability-status module + read-only endpoint.
 *
 * Covers:
 *  1. Both PRISM and ATLAS report live:false, built:false, wired:false —
 *     the hard invariant this module exists to make machine-readable.
 *  2. GET /api/system/phase2-capability-status requires authentication
 *     (401 for an unauthenticated request).
 *  3. Any authenticated role (this is honesty/status information, not a
 *     governance export — deliberately not restricted to the
 *     clinical_reviewer/operations_lead allow-list E2 applies elsewhere)
 *     succeeds and receives both agents' statuses.
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
    assert.equal(status.built, false, `${status.agentId}: built must be false`);
    assert.equal(status.wired, false, `${status.agentId}: wired must be false`);
    assert.equal(status.phase, 2, `${status.agentId}: phase must be 2`);
    assert.ok(status.notBuiltReason.length > 0, `${status.agentId}: notBuiltReason must be a non-empty explanation`);
  }

  assert.equal(prism.agentId, "PRISM");
  assert.equal(atlas.agentId, "ATLAS");

  console.log("Phase 2 capability status: PRISM/ATLAS both report live:false, built:false, wired:false.");
}

function testCombinedStatusShape() {
  const combined = getPhase2AgentCapabilityStatus();
  assert.equal(combined.artifactType, "aksh-phase2-agent-capability-status");
  assert.equal(combined.agents.length, 2);
  assert.ok(combined.agents.every((agent) => agent.live === false && agent.built === false && agent.wired === false));
  assert.ok(combined.notes.length > 0);

  const serialized = JSON.stringify(combined).toLowerCase();
  assert.ok(!serialized.includes('"live":true'), "no field anywhere in the combined status may claim liveness");

  console.log("Phase 2 capability status: combined artifact shape correct, no live:true claim anywhere in the payload.");
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
      const body = (await response.json()) as { agents?: Array<{ live: boolean }> };
      assert.equal(body.agents?.length, 2);
      assert.ok(body.agents?.every((agent) => agent.live === false));
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("Phase 2 capability status route: any authenticated role succeeds, no live claim in the response.");
}

async function main() {
  testStatusInvariants();
  testCombinedStatusShape();
  await testRouteRequiresAuthentication();
  await testRouteAllowsAnyAuthenticatedRole();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
