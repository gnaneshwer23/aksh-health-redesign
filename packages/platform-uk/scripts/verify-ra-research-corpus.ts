/** Corpus-level verification: rights-verified evidence + research working set. No product Neon required. */
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
const { RA_RESEARCH_RELEASE_ID } = await import("../lib/hsi/raResearchEvidenceRelease");

const evidenceListing = akshInvestigationReleases.find((r) => r.id === RA_RELEASE_ID);
if (!evidenceListing?.readiness?.available) throw new Error("rights-verified RA evidence must be available");
if (evidenceListing.readiness.scientificReview !== "unreviewed") throw new Error("evidence must stay unreviewed");
const evidence = await loadAkshInvestigationRelease(RA_RELEASE_ID, null);
if (evidence.context.dataClass !== "public_real" || evidence.passages.length < 2) throw new Error("evidence passages missing");
if (evidence.claims.length !== 0) throw new Error("evidence must not invent claims");
if (!evidence.sources.every((s) => s.kind === "publication" && s.pmid)) throw new Error("evidence sources must be real publications");

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
      evidence: RA_RELEASE_ID,
      evidencePassages: evidence.passages.length,
      research: RA_RESEARCH_RELEASE_ID,
      researchPassages: research.passages.length,
      scientificReview: "unreviewed",
      note: "Apply db/migrations/056_hsi_investigations.sql with Aksh .env.local, then provision-hsi-research.ts, before live UI verification.",
    },
    null,
    2,
  ),
);
