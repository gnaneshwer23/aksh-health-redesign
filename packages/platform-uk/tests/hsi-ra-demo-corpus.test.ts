import assert from "node:assert/strict";
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { InvestigationRequestError } = await import("../lib/hsi/investigationBackend");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
const { RA_DEMO_RELEASE_ID } = await import("../lib/hsi/raDemoEvidenceRelease");

const pending = akshInvestigationReleases.find((release) => release.id === RA_RELEASE_ID);
assert.ok(pending);
assert.equal(pending.readiness?.available, false);
await assert.rejects(
  () => loadAkshInvestigationRelease(RA_RELEASE_ID, null),
  (error: unknown) =>
    error instanceof InvestigationRequestError && error.status === 422 && error.code === "evidence_not_ready",
);

const listing = akshInvestigationReleases.find((release) => release.id === RA_DEMO_RELEASE_ID);
assert.ok(listing?.readiness?.available);
assert.match(listing!.title, /DEMO/);
assert.match(listing!.description, /not_for_scientific_claim/);

const demo = await loadAkshInvestigationRelease(RA_DEMO_RELEASE_ID, null);
assert.equal(demo.context.dataClass, "synthetic");
assert.ok(demo.passages.length >= 2);
assert.ok(demo.sources.every((source) => source.kind === "synthetic_fixture" && source.pmid === null));
assert.equal(demo.claims.length, 0);

console.log("PASS: RA demo fixture corpus loads synthetic passages; pending real release stays evidence_not_ready.");
