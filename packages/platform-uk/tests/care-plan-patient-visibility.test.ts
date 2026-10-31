/**
 * Care-plan patient visibility — APPROVED only; DRAFT/REJECTED never leak.
 * Hermetic file-store by default (clears DATABASE_URL).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const tmp = mkdtempSync(path.join(tmpdir(), "care-plan-vis-"));
const prevCwd = process.cwd();
const prevDb = process.env.DATABASE_URL;
const prevUse = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const scopeKey = `cpvis_${randomUUID().slice(0, 8)}`;
  const orgA = "org-vis-a";
  const orgB = "org-vis-b";
  const patientId = "P002";

  const { createCarePlanRecord, decideCarePlan, listCarePlans } = await import(
    "../lib/diabetes-intelligence/repository"
  );
  const { listPatientVisibleCarePlans, selectPatientVisibleApprovedPlans } = await import(
    "../lib/diabetes-intelligence/care-plan-facade"
  );
  const {
    filterPatientVisibleCarePlans,
    toPatientVisibleCarePlans,
  } = await import("../lib/care-episode/stakeholder-handoffs");
  const { denyUnlessConnectedPatientAccess } = await import(
    "../lib/clinical-proof/connected-patient-access"
  );

  // Cross-org deny on shared file store (054-aligned app filter)
  const draftA = await createCarePlanRecord(
    {
      patientId,
      patientLabel: "Synthetic Patel",
      sections: [{ id: "goals", title: "Goals", items: ["Walk"], clinical: false }],
      safetyNotes: [],
      missingData: [],
      createdBy: "gp-a",
    },
    { scopeKey, organisationId: orgA }
  );
  assert.equal(draftA.status, "DRAFT");
  assert.equal(draftA.organisationId, orgA);

  const listedB = await listCarePlans(patientId, { scopeKey, organisationId: orgB });
  assert.equal(listedB.length, 0, "org B must not see org A draft");

  const listedA = await listCarePlans(patientId, { scopeKey, organisationId: orgA });
  assert.equal(listedA.length, 1);
  assert.equal(listedA[0]!.id, draftA.id);

  // Approve one plan; leave another as draft
  const decided = await decideCarePlan(
    {
      planId: draftA.id,
      action: "accept",
      actor: "gp-a",
      actorPersona: "gp",
      reason: "visibility proof",
    },
    { scopeKey, organisationId: orgA }
  );
  assert.equal(decided.plan.status, "APPROVED");

  const draftOnly = await createCarePlanRecord(
    {
      patientId,
      patientLabel: "Synthetic Patel",
      sections: [{ id: "goals", title: "Goals", items: ["Secret draft"], clinical: true }],
      safetyNotes: ["must not leak"],
      missingData: [],
      createdBy: "gp-a",
    },
    { scopeKey, organisationId: orgA }
  );
  assert.equal(draftOnly.status, "DRAFT");

  const all = await listCarePlans(patientId, { scopeKey, organisationId: orgA });
  assert.ok(all.some((p) => p.status === "DRAFT"));
  assert.ok(all.some((p) => p.status === "APPROVED"));

  const visible = filterPatientVisibleCarePlans(all);
  assert.equal(visible.length, 1);
  assert.equal(visible[0]!.id, decided.plan.id);
  assert.ok(!visible.some((p) => p.id === draftOnly.id), "draft must not appear");

  const patientFacing = toPatientVisibleCarePlans(all);
  assert.equal(patientFacing.length, 1);
  assert.equal(patientFacing[0]!.status, "APPROVED");
  assert.equal(patientFacing[0]!.draftsHidden, true);

  const facadeVisible = await listPatientVisibleCarePlans(patientId, {
    scopeKey,
    organisationId: orgA,
  });
  assert.ok(facadeVisible.every((p) => p.status === "APPROVED"));
  assert.ok(!facadeVisible.some((p) => p.id === draftOnly.id));
  assert.equal(selectPatientVisibleApprovedPlans(facadeVisible).length, facadeVisible.length);

  // Access gate: patient bound to other id is denied
  const denied = denyUnlessConnectedPatientAccess(
    { userRole: "patient", boundPatientId: "P999" },
    patientId
  );
  assert.ok(denied);
  assert.equal(denied!.status, 403);

  const allowed = denyUnlessConnectedPatientAccess(
    { userRole: "patient", boundPatientId: patientId },
    patientId
  );
  assert.equal(allowed, null);

  console.log(
    "care-plan-patient-visibility: cross-org deny + APPROVED-only patient surface — PASS"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDb;
    if (prevUse === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUse;
    rmSync(tmp, { recursive: true, force: true });
  });
