import assert from "node:assert/strict";

import { assertSeedingAllowed, getDeploymentEnvironment } from "../lib/env/deployment";

assert.equal(getDeploymentEnvironment({}), "local");
assert.equal(getDeploymentEnvironment({ AKSH_ENVIRONMENT: "Production" }), "production");
assert.equal(getDeploymentEnvironment({ AKSH_ENVIRONMENT: "staging" }), "local", "unknown values never become production");
assert.throws(() => assertSeedingAllowed("seed", { AKSH_ENVIRONMENT: "production" }), /refuses to run/);
assert.doesNotThrow(() => assertSeedingAllowed("seed", { AKSH_ENVIRONMENT: "simulation" }));

console.log("deployment-environment: environment detection and production seed guard — PASS");
