/** Corpus-level verification: pending evidence_not_ready + research working set loads. No product Neon required. */
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { InvestigationRequestError } = await import("../lib/hsi/investigationBackend");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
const { RA_RESEARCH_RELEASE_ID } = await import("../lib/hsi/raResearchEvidenceRelease");

const pending = akshInvestigationReleases.find((r) => r.id === RA_RELEASE_ID);
if (!pending || pending.readiness?.available !== false) throw new Error("pending RA must stay unavailable");
try {
  await loadAkshInvestigationRelease(RA_RELEASE_ID, null);
  throw new Error("expected evidence_not_ready");
} catch (error) {
  if (!(error instanceof InvestigationRequestError) || error.code !== "evidence_not_ready") throw error;
}

const researchListing = akshInvestigationReleases.find((r) => r.id === RA_RESEARCH_RELEASE_ID);
if (!researchListing?.readiness?.available) throw new Error("research corpus must be available");
if (/demo|fixture|smoke/i.test(researchListing.title) || /demo|fixture|smoke/i.test(researchListing.description ?? "")) {
  throw new Error("research corpus listing must stay professional");
}
const research = await loadAkshInvestigationRelease(RA_RESEARCH_RELEASE_ID, null);
if (research.context.dataClass !== "synthetic" || research.passages.length < 2) throw new Error("research passages missing");

console.log(
  JSON.stringify(
    {
      ok: true,
      product: "aksh",
      pending: RA_RELEASE_ID,
      research: RA_RESEARCH_RELEASE_ID,
      researchPassages: research.passages.length,
      note: "Apply db/migrations/056_hsi_investigations.sql with Aksh .env.local, then provision-hsi-research.ts, before live UI verification.",
    },
    null,
    2,
  ),
);
