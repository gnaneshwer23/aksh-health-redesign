import type { Metadata } from "next";
import Link from "next/link";
import researchArtifact from "@/data/hsi/research-bundle.json";
import { parseHsiResearchBundle } from "@/lib/hsi/research-contract";
import { PageHero } from "@/components/site/PageHero";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "HSI research context",
  description: "Read-only HSI research claims and concept mappings. Not clinical guidance or patient-specific advice.",
  robots: { index: false, follow: false },
};

export default function HsiResearchPage() {
  const result = parseHsiResearchBundleSafe();
  return (
    <SiteShell>
      <PageHero title="Research context, with its limits intact." lede="HSI provides public research claims and shared concept identifiers. Aksh keeps patient records, permissions and clinical decisions in its own care workflows." />
      <section className="s-section s-section--tight">
        <div className="s-container" style={{ display: "grid", gap: 24 }}>
          <div className="s-card" role="note">
            <h2 className="s-h3">Research preview · not clinical decision support</h2>
            <p>These are seed claims, not patient recommendations. Source identifiers do not verify exact claim support. No records are sent to HSI, no care plan is changed, and no clinical approval is recorded here.</p>
          </div>
          {!result ? <p role="alert">Research context is unavailable because the HSI artifact did not pass validation. No unvalidated claims are displayed.</p> : <>
            <p className="s-small">{result.cards.length} mapped claims · snapshot {result.generatedAt} · HSI revision {result.producer.revision.slice(0, 12)}{result.producer.workingTree === "includes_local_changes" ? " (includes local changes)" : ""}. This is an imported snapshot, not live retrieval.</p>
            {result.cards.map((card) => (
              <article className="s-card" key={card.claimId}>
                <h2 className="s-h3">{card.assertion}</h2>
                <p className="s-small">{card.claimId} · Grade: {card.grade} · Pack review: {card.review}</p>
                <p>Exact claim support: not verified for clinical use.</p>
                <dl style={{ overflowWrap: "anywhere" }}>
                  <dt>Shared concept pointer</dt><dd>{card.akshNodeId}</dd>
                  <dt>LOINC mapping</dt><dd>{card.loinc ?? "Not mapped"}</dd>
                  <dt>Source context and limitations</dt><dd>{card.provenanceNote ?? "Not recorded; source review required."}</dd>
                </dl>
                {card.pmid ? <a className="s-link" href={`https://pubmed.ncbi.nlm.nih.gov/${card.pmid}/`} target="_blank" rel="noreferrer">Inspect PMID {card.pmid} →</a> : card.doi ? <a className="s-link" href={`https://doi.org/${encodeURIComponent(card.doi)}`} target="_blank" rel="noreferrer">Inspect DOI {card.doi} →</a> : <p>No source locator recorded.</p>}
              </article>
            ))}
          </>}
          <p><Link className="s-link" href="/resources">Back to resources →</Link></p>
        </div>
      </section>
    </SiteShell>
  );
}

function parseHsiResearchBundleSafe() {
  try { return parseHsiResearchBundle(researchArtifact); } catch { return null; }
}
