import assert from "node:assert/strict";
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");

const listing = akshInvestigationReleases.find((release) => release.id === RA_RELEASE_ID);
assert.ok(listing);
assert.equal(listing.readiness?.available, true);
assert.equal(listing.readiness?.scientificReview, "unreviewed");
assert.ok((listing.readiness?.passages ?? 0) >= 2);

const evidence = await loadAkshInvestigationRelease(RA_RELEASE_ID, null);
assert.equal(evidence.context.dataClass, "public_real");
assert.ok(evidence.passages.length >= 2);
assert.ok(evidence.sources.every((source) => source.kind === "publication" && source.pmid));
assert.equal(evidence.claims.length, 0);

const snapshot = await loadAkshInvestigationRelease("hsi-research-snapshot", null);
assert.equal(snapshot.passages.length, 0);
assert.equal(snapshot.relationships.length, 0);
assert.ok(snapshot.entities.length > 0);

const unavailableStart = akshInvestigationReleases.some((release) => release.id === "hsi-research-snapshot" && release.readiness?.available !== false);
assert.equal(unavailableStart, true);

console.log("PASS: RA evidence corpus rights-verified and unreviewed; existing snapshot corpus remains usable.");
