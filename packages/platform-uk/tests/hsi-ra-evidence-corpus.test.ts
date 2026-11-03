import assert from "node:assert/strict";
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { InvestigationRequestError } = await import("../lib/hsi/investigationBackend");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");

const listing = akshInvestigationReleases.find((release) => release.id === RA_RELEASE_ID);
assert.ok(listing);
assert.equal(listing.readiness?.available, false);
assert.match(String(listing.readiness?.reason ?? ""), /Creative Commons URI/);

await assert.rejects(
  () => loadAkshInvestigationRelease(RA_RELEASE_ID, null),
  (error: unknown) =>
    error instanceof InvestigationRequestError && error.status === 422 && error.code === "evidence_not_ready",
);

const snapshot = await loadAkshInvestigationRelease("hsi-research-snapshot", null);
assert.equal(snapshot.passages.length, 0);
assert.equal(snapshot.relationships.length, 0);
assert.ok(snapshot.entities.length > 0);

const unavailableStart = akshInvestigationReleases.some((release) => release.id === "hsi-research-snapshot" && release.readiness?.available !== false);
assert.equal(unavailableStart, true);

console.log("PASS: RA corpus registered as pending evidence_not_ready; existing snapshot corpus remains usable.");
