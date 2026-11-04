import assert from "node:assert/strict";
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

async function runCorpusAssertions(): Promise<void> {
  const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
  const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
  const { RA_RESEARCH_RELEASE_ID } = await import("../lib/hsi/raResearchEvidenceRelease");

  const evidence = akshInvestigationReleases.find((release) => release.id === RA_RELEASE_ID);
  assert.ok(evidence?.readiness?.available);
  assert.equal(evidence!.readiness?.scientificReview, "unreviewed");
  const evidenceBundle = await loadAkshInvestigationRelease(RA_RELEASE_ID, null);
  assert.equal(evidenceBundle.context.dataClass, "public_real");
  assert.ok(evidenceBundle.passages.length >= 2);

  const listing = akshInvestigationReleases.find((release) => release.id === RA_RESEARCH_RELEASE_ID);
  assert.ok(listing?.readiness?.available);
  assert.equal(listing!.title, "RA / anti-TNF research corpus");
  assert.doesNotMatch(listing!.title, /demo/i);
  assert.match(listing!.description, /unreviewed/);
  assert.doesNotMatch(listing!.description, /demo|fixture|smoke/i);

  const research = await loadAkshInvestigationRelease(RA_RESEARCH_RELEASE_ID, null);
  assert.equal(research.context.dataClass, "synthetic");
  assert.ok(research.passages.length >= 2);
  assert.ok(research.sources.every((source) => source.kind === "synthetic_fixture" && source.pmid === null));
  assert.equal(research.claims.length, 0);

  console.log("PASS: RA research corpus loads synthetic passages; rights-verified evidence sits beside it unreviewed.");

}

void runCorpusAssertions().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
