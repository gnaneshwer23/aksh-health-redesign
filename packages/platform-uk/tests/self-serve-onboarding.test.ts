import assert from "node:assert/strict";

import { patientIdFromInviteCode, registrationFieldFor } from "../lib/onboarding/markets";
import { resolvePatientBinding } from "../lib/onboarding/patient-binding";
import { getIdentitySchema, getOrgSchema } from "../lib/onboarding/validation";
import { getSyntheticWorld } from "../lib/synthetic-world/generate";

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

// Invite binding requires code AND matching date of birth.
const p = getSyntheticWorld().patients[42]!;
assert.equal(patientIdFromInviteCode(`aksh-${p.id.toLowerCase()}`), p.id);
assert.equal(patientIdFromInviteCode("W0001"), null);
assert.deepEqual(resolvePatientBinding({}), { status: "none" });
const linked = resolvePatientBinding({ inviteCode: `AKSH-${p.id}`, dateOfBirth: p.dob });
assert.equal(linked.status, "linked");
assert.equal(resolvePatientBinding({ inviteCode: `AKSH-${p.id}`, dateOfBirth: "1900-01-01" }).status, "rejected");
assert.equal(resolvePatientBinding({ inviteCode: "AKSH-W9999", dateOfBirth: p.dob }).status, "rejected");

console.log("self-serve-onboarding: markets, schemas, invite binding — PASS");
