/** Clinical-proof environment flag (platform map G4): on only outside production and the real workspace. */
import assert from "node:assert/strict";

import { isProofEnvironment, proofRedirect } from "../lib/env/proof";

assert.equal(isProofEnvironment({ AKSH_ENVIRONMENT: "simulation", AKSH_PROOF_ENVIRONMENT: "true" }), true);
assert.equal(isProofEnvironment({ AKSH_ENVIRONMENT: "simulation" }), false, "off by default");
assert.equal(isProofEnvironment({ AKSH_ENVIRONMENT: "production", AKSH_PROOF_ENVIRONMENT: "true" }), false, "never in production");
assert.equal(isProofEnvironment({ AKSH_ENVIRONMENT: "simulation", AKSH_PROOF_ENVIRONMENT: "true", AKSH_REAL_WORKSPACE: "true" }), false, "never in the real workspace");
assert.equal(proofRedirect("/"), "/proof");
assert.equal(proofRedirect("/contact"), "/proof");
assert.equal(proofRedirect("/pilot/apply"), "/proof");
assert.equal(proofRedirect("/demo/patel"), null);
assert.equal(proofRedirect("/signup"), null, "sandbox accounts can be created");
console.log("proof-environment: flag gating and landing redirects — PASS");
