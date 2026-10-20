import assert from "node:assert/strict";

import { isProductionHost, productionHostMisconfigured } from "../lib/env/production-host";

assert.ok(isProductionHost("www.akshhealth.com"));
assert.ok(isProductionHost("AKSHHEALTH.com:443"));
assert.ok(!isProductionHost("aksh-clinical-proof.vercel.app"));
assert.ok(!isProductionHost(null));

// Production domain + production environment: serve.
assert.equal(productionHostMisconfigured("www.akshhealth.com", { AKSH_ENVIRONMENT: "production" }), false);
// Production domain + anything else (the 20 Oct incident): refuse.
for (const e of ["simulation", "preview", "local", "", undefined]) {
  assert.equal(productionHostMisconfigured("www.akshhealth.com", { AKSH_ENVIRONMENT: e }), true, `refuse with ${e}`);
}
// Other hosts are unaffected (proof, previews, localhost).
assert.equal(productionHostMisconfigured("aksh-clinical-proof.vercel.app", { AKSH_ENVIRONMENT: "simulation" }), false);
assert.equal(productionHostMisconfigured("localhost:3000", {}), false);

console.log("production-host-guard: PASS");
