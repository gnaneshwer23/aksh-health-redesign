import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getSimulatedEhrHonesty,
  listSimulatedEhrCharts,
  resetSimulatedEhrForTests,
  upsertSimulatedEhrCharts,
} from "../lib/simulated-ehr";
import { getLongitudinalBundle } from "../lib/mock-data/longitudinal-bundles";
import { generateExtendedDemoPatients } from "../lib/mock-data/demo-cohort-generator";

describe("simulated EHR store", () => {
  it("stays honest: liveEmis false / realPatientData false", () => {
    const honesty = getSimulatedEhrHonesty();
    assert.equal(honesty.liveEmis, false);
    assert.equal(honesty.realPatientData, false);
    assert.equal(honesty.syntheticOnly, true);
    assert.equal(honesty.partnerWrite, false);
  });

  it("upserts parallel EMIS + SystmOne projections idempotently", async () => {
    await resetSimulatedEhrForTests("unit-sim-ehr");

    const first = await upsertSimulatedEhrCharts({
      patientId: "P002",
      caseId: "case-sim-1",
      acceptedBy: "Dr Unit",
      clinicianId: "gp-unit",
      bridgeStagingId: "bridge-unit-1",
      simWriteId: "sim-write-1",
      bundleSummary: "DocumentReference, Observation — HITL Accept",
      resourceTypes: ["DocumentReference", "Observation"],
      scopeKey: "unit-sim-ehr",
    });
    assert.equal(first.length, 2);
    assert.ok(first.every((e) => e.liveEmis === false && e.realPatientData === false));
    assert.deepEqual(
      first.map((e) => e.partner).sort(),
      ["simulated_emis", "simulated_systmone"]
    );

    const again = await upsertSimulatedEhrCharts({
      patientId: "P002",
      caseId: "case-sim-1",
      acceptedBy: "Dr Unit",
      clinicianId: "gp-unit",
      bridgeStagingId: "bridge-unit-1",
      simWriteId: "sim-write-1",
      bundleSummary: "DocumentReference, Observation — HITL Accept",
      resourceTypes: ["DocumentReference", "Observation"],
      scopeKey: "unit-sim-ehr",
    });
    assert.equal(again.length, 2);
    assert.deepEqual(
      again.map((e) => e.id).sort(),
      first.map((e) => e.id).sort()
    );

    const listed = await listSimulatedEhrCharts({
      patientId: "P002",
      scopeKey: "unit-sim-ehr",
      limit: 10,
    });
    assert.equal(listed.length, 2);
  });
});

describe("longitudinal synthetic richness", () => {
  it("P002 HbA1c trajectory matches flagship 6.8→8.4 with aspirin/apixaban conflict", () => {
    const bundle = getLongitudinalBundle("P002");
    assert.ok(bundle);
    const hba1c = bundle!.labs.filter((l) => l.name === "HbA1c").map((l) => l.value);
    assert.equal(hba1c[0], "6.8");
    assert.equal(hba1c[hba1c.length - 1], "8.4");
    assert.ok(bundle!.medications.some((m) => /Aspirin/i.test(m.name) && m.status === "active"));
    assert.ok(bundle!.medications.some((m) => /Apixaban/i.test(m.name) && m.status === "proposed"));
    assert.equal(bundle!.liveEmis, false);
    assert.equal(bundle!.realPatientData, false);
  });

  it("extended diabetes-primary patients emit HbA1c / draft seeds", () => {
    const extended = generateExtendedDemoPatients();
    const t2d = extended.filter((p) => p.clinicalProfiles?.includes("t2d"));
    assert.ok(t2d.length >= 8);
    assert.ok(
      t2d.some((p) =>
        p.digitalTwinPrediction.deteriorationSignals.some((s) => s.includes("HbA1c series"))
      )
    );
    assert.ok(t2d.some((p) => p.qaNotes?.includes("draftSeed:")));
    assert.ok(extended.every((p) => p.qaNotes?.includes("liveEmis:false")));
  });
});
