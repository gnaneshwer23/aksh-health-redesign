import assert from "node:assert/strict";

import { accessRequestSchema } from "../lib/access-requests/validation";

/** First contact is six fields; systems and go-live commitments are optional (covered on the scoping call). */
const base = {
  contactName: "Test Lead",
  contactEmail: "lead@example.org",
  orgName: "Example Diabetes Centre",
  orgType: "Specialist diabetes centre",
  region: "Europe",
  listSize: "Under 5,000",
};

const short = accessRequestSchema.safeParse(base);
assert.ok(short.success, "six first-contact fields are enough");
assert.deepEqual(short.data.ehrSystems, []);
assert.deepEqual(short.data.commitments, []);

assert.ok(accessRequestSchema.safeParse({ ...base, ehrSystems: ["Epic"], commitments: ["We will sign a Data Processing Agreement (DPA) before go-live"] }).success, "optional detail still accepted");
assert.ok(!accessRequestSchema.safeParse({ ...base, ehrSystems: ["Not a system"] }).success, "unknown system refused");
assert.ok(!accessRequestSchema.safeParse({ ...base, contactEmail: "nope" }).success, "email still validated");
const { region: _r, ...noRegion } = base;
assert.ok(!accessRequestSchema.safeParse(noRegion).success, "required fields still required");

console.log("access-request-validation: PASS");
