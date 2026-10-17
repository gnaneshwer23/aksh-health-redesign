/** The capability register is honest: every production or synthetic-demo claim has evidence that exists. Pure. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { CAPABILITIES } from "../lib/status/capabilities";

const root = resolve(__dirname, "..");
const ids = new Set<string>();
for (const c of CAPABILITIES) {
  assert.ok(!ids.has(c.id), `duplicate capability ${c.id}`);
  ids.add(c.id);
  if (c.status === "production" || c.status === "synthetic_demo") {
    assert.ok(c.evidence.length > 0, `${c.id}: ${c.status} needs evidence`);
  }
  for (const f of c.evidence) assert.ok(existsSync(resolve(root, f)), `${c.id}: evidence ${f} does not exist`);
  if (c.status === "production") assert.equal(c.environment, "production", `${c.id}: production must be verified in production`);
  if (c.status === "in_validation") assert.ok(c.releaseCriteria?.length, `${c.id}: in validation needs release criteria`);
  if (c.status === "planned") assert.equal(c.evidence.length, 0, `${c.id}: planned has nothing to verify`);
}
console.log(`capability-status: ${CAPABILITIES.length} capabilities, every claim backed by existing evidence — PASS`);
