import assert from "node:assert/strict";

import { registrationFieldFor } from "../lib/onboarding/markets";
import { getIdentitySchema, getOrgSchema } from "../lib/onboarding/validation";

// Registration is jurisdiction-neutral and optional; never names a country or a specific regulator.
assert.equal(registrationFieldFor("gp")?.label, "Professional registration or licence number");
assert.equal(registrationFieldFor("clinical-pharmacist")?.label, "Professional registration or licence number");
assert.equal(registrationFieldFor("patient"), null);

const clinician = getIdentitySchema("gp");
assert.ok(clinician.safeParse({ fullName: "Dr Test", workEmail: "a@clinic.example" }).success, "registration optional");
assert.ok(clinician.safeParse({ fullName: "Dr Test", workEmail: "a@clinic.example", phone: "+1 (555) 010-0199" }).success, "international phone");
assert.ok(!clinician.safeParse({ fullName: "Dr Test", workEmail: "nope" }).success);

// Patients need no national health number; email or phone required.
const patient = getIdentitySchema("patient");
assert.ok(patient.safeParse({ firstName: "A", lastName: "B", dateOfBirth: "1970-01-01", email: "p@x.example" }).success);
assert.ok(!patient.safeParse({ firstName: "A", lastName: "B", dateOfBirth: "1970-01-01" }).success);

// Organisation defaults to the sandbox clinic; a described organisation needs a name.
const org = getOrgSchema("gp")!;
assert.ok(org.safeParse({ useSynthetic: true }).success);
assert.ok(!org.safeParse({ useSynthetic: false }).success);
assert.ok(org.safeParse({ useSynthetic: false, organisationName: "Lakeside Clinic", ehrSystem: "Epic" }).success);

// Invite binding (code + date of birth, single use) is covered against the database in care-network-db.test.ts.

console.log("self-serve-onboarding: registration, schemas — PASS");
