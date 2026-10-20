/**
 * P1 DETECT integrity: duplicate same-timestamp HbA1c re-ingests must not
 * collapse a true deteriorating series into a false "stable" trend.
 */
import assert from "node:assert/strict";
import { buildHbA1cSignal } from "../lib/disease-modules/diabetes/hba1c";

const ctx = { patientId: "P002", patientLabel: "Mr James Patel" };

function run() {
  const duplicatedSeries = [
    { recordedAt: "2025-02-01T09:00:00.000Z", valueMmolMol: 51 },
    { recordedAt: "2025-05-01T09:00:00.000Z", valueMmolMol: 54 },
    { recordedAt: "2025-09-01T09:00:00.000Z", valueMmolMol: 60 },
    { recordedAt: "2026-01-01T09:00:00.000Z", valueMmolMol: 64 },
    { recordedAt: "2026-05-01T09:00:00.000Z", valueMmolMol: 66 },
    { recordedAt: "2026-08-01T09:00:00.000Z", valueMmolMol: 68 },
    // Golden re-ingest duplicates (same timestamps) — previously made trend stable.
    { recordedAt: "2026-01-01T09:00:00.000Z", valueMmolMol: 64 },
    { recordedAt: "2026-05-01T09:00:00.000Z", valueMmolMol: 66 },
    { recordedAt: "2026-08-01T09:00:00.000Z", valueMmolMol: 68 }
  ];

  const withDupes = buildHbA1cSignal(ctx, duplicatedSeries, "patient_state_ingest");
  assert.equal(withDupes.trend, "worsening");
  assert.equal(withDupes.latestValueMmolMol, 68);
  assert.equal(withDupes.readingsSource, "patient_state_ingest");

  const fixtureLike = buildHbA1cSignal(
    ctx,
    [
      { recordedAt: "2026-01-10T00:00:00.000Z", valueMmolMol: 57 },
      { recordedAt: "2026-07-10T00:00:00.000Z", valueMmolMol: 65 }
    ],
    "fixture"
  );
  assert.equal(fixtureLike.trend, "worsening");
  assert.equal(fixtureLike.latestValueMmolMol, 65);

  console.log("diabetes-hba1c-dedupe: duplicate timestamps no longer force false stable — PASS");
}

run();
