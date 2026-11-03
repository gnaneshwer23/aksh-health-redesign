/** Corpus-level smoke: pending evidence_not_ready + demo fixture loads. No product Neon required. */
// @ts-expect-error Bun is the consumer harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

const { akshInvestigationReleases, loadAkshInvestigationRelease } = await import("../lib/hsi/investigation-corpus.server");
const { InvestigationRequestError } = await import("../lib/hsi/investigationBackend");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
const { RA_DEMO_RELEASE_ID } = await import("../lib/hsi/raDemoEvidenceRelease");

const pending = akshInvestigationReleases.find((r) => r.id === RA_RELEASE_ID);
if (!pending || pending.readiness?.available !== false) throw new Error("pending RA must stay unavailable");
try {
  await loadAkshInvestigationRelease(RA_RELEASE_ID, null);
  throw new Error("expected evidence_not_ready");
} catch (error) {
  if (!(error instanceof InvestigationRequestError) || error.code !== "evidence_not_ready") throw error;
}

const demoListing = akshInvestigationReleases.find((r) => r.id === RA_DEMO_RELEASE_ID);
if (!demoListing?.readiness?.available) throw new Error("demo corpus must be available");
const demo = await loadAkshInvestigationRelease(RA_DEMO_RELEASE_ID, null);
if (demo.context.dataClass !== "synthetic" || demo.passages.length < 2) throw new Error("demo passages missing");

console.log(
  JSON.stringify(
    {
      ok: true,
      product: "aksh",
      pending: RA_RELEASE_ID,
      demo: RA_DEMO_RELEASE_ID,
      demoPassages: demo.passages.length,
      note: "Apply db/migrations/056_hsi_investigations.sql with Aksh .env.local, then provision-hsi-research.ts, before live UI smoke.",
    },
    null,
    2,
  ),
);
