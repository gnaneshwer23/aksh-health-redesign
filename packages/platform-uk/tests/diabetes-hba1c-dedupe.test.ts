/**
 * P1 DETECT integrity: duplicate same-timestamp HbA1c re-ingests must not
 * collapse a true deteriorating series into a false "stable" trend.
 */
import assert from "node:assert/strict";
import { buildHbA1cSignal } from "../lib/disease-modules/diabetes/hba1c";

const ctx = { patientId: "P002", patientLabel: "Mr James Patel" };

function run() {
  const duplicatedSeries = [
    { recordedAt: "2025-02-01T09:00:00.000Z", valuePercent: 6.8 },
    { recordedAt: "2025-05-01T09:00:00.000Z", valuePercent: 7.1 },
    { recordedAt: "2025-09-01T09:00:00.000Z", valuePercent: 7.6 },
    { recordedAt: "2026-01-01T09:00:00.000Z", valuePercent: 8.0 },
    { recordedAt: "2026-05-01T09:00:00.000Z", valuePercent: 8.2 },
    { recordedAt: "2026-08-01T09:00:00.000Z", valuePercent: 8.4 },
    // Golden re-ingest duplicates (same timestamps) — previously made trend stable.
    { recordedAt: "2026-01-01T09:00:00.000Z", valuePercent: 8.0 },
    { recordedAt: "2026-05-01T09:00:00.000Z", valuePercent: 8.2 },
    { recordedAt: "2026-08-01T09:00:00.000Z", valuePercent: 8.4 }
  ];

  const withDupes = buildHbA1cSignal(ctx, duplicatedSeries, "patient_state_ingest");
  assert.equal(withDupes.trend, "worsening");
  assert.equal(withDupes.latestValuePercent, 8.4);
  assert.equal(withDupes.readingsSource, "patient_state_ingest");

  const fixtureLike = buildHbA1cSignal(
    ctx,
    [
      { recordedAt: "2026-01-10T00:00:00.000Z", valuePercent: 7.4 },
      { recordedAt: "2026-07-10T00:00:00.000Z", valuePercent: 8.1 }
    ],
    "fixture"
  );
  assert.equal(fixtureLike.trend, "worsening");
  assert.equal(fixtureLike.latestValuePercent, 8.1);

  console.log("diabetes-hba1c-dedupe: duplicate timestamps no longer force false stable — PASS");
}

run();
