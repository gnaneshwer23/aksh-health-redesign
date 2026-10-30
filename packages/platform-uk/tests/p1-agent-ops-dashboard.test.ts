/**
 * P1-OPS-01 — Agent Ops page exists, honesty copy, admin nav, no PHI claims.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..");
const page = readFileSync(path.join(root, "app/dashboard/admin/agent-ops/page.tsx"), "utf8");
const sidebar = readFileSync(path.join(root, "components/dashboard/Sidebar.tsx"), "utf8");

assert.match(page, /Simulation \/ synthetic validation/);
assert.match(page, /not a clinical accuracy score/);
assert.match(page, /\/api\/agents\/readiness/);
assert.match(page, /loopOutcomes|equity/);
assert.match(page, /data-testid="agent-ops-honesty"/);
assert.match(page, /PRISM\/ATLAS/);
assert.match(page, /CompassBriefPanel/);
assert.doesNotMatch(page, /patientName|NHS number|dateOfBirth/i);
assert.match(sidebar, /\/dashboard\/admin\/agent-ops/);

console.log("p1-agent-ops-dashboard: honesty copy + readiness wiring + admin nav — PASS");
