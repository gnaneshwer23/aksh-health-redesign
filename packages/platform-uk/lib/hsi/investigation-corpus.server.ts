import "server-only";
import release from "@/data/hsi/research-bundle.json";
import raReleaseArtifact from "@/data/hsi/ra-anti-tnf/release.json";
import raGraphContext from "@/data/hsi/ra-anti-tnf/graph-context.json";
import raDemoReleaseArtifact from "@/data/hsi/ra-anti-tnf-demo/release.json";
import { parseHsiResearchBundle } from "./research-contract";
import { parseResearchBundle, RESEARCH_CONTRACT_VERSION, type ResearchBundle } from "./researchContracts";
import { InvestigationRequestError, type InvestigationRelease } from "./investigationBackend";
import {
  RA_RELEASE_ID,
  buildRaEvidenceBundle,
  raEvidenceReleaseListing,
  RaEvidenceUnavailableError,
} from "./raEvidenceRelease";
import {
  RA_DEMO_RELEASE_ID,
  buildRaDemoEvidenceBundle,
  raDemoEvidenceReleaseListing,
} from "./raDemoEvidenceRelease";

const snapshotRelease: InvestigationRelease = {
  id: "hsi-research-snapshot",
  title: "HSI research snapshot",
  description:
    "Research concept pointers from the imported HSI release. No patient records or licensed source passages are included.",
  readiness: {
    available: true,
    sources: 0,
    passages: 0,
    version: null,
    scientificReview: "unreviewed",
    reason: "Concept pointers only; licensed exact passages require the RA evidence artifact.",
  },
};

const raListing = raEvidenceReleaseListing(raReleaseArtifact);
const raDemoListing = raDemoEvidenceReleaseListing(raDemoReleaseArtifact);

export const akshInvestigationReleases: InvestigationRelease[] = [snapshotRelease, raDemoListing, raListing];

/** Graph pointers stay metadata; a PMID alone does not license a passage or establish claim support. */
export async function loadAkshInvestigationRelease(id: string, conceptId: string | null): Promise<ResearchBundle> {
  if (id === RA_DEMO_RELEASE_ID) {
    // Synthetic DEMO-PMID / SYN-* fixture only — not_for_scientific_claim; never patient records.
    return buildRaDemoEvidenceBundle(raDemoReleaseArtifact);
  }
  if (id === RA_RELEASE_ID) {
    try {
      // Bounded RA working set only — not a second global KG and never patient records.
      return buildRaEvidenceBundle(parseResearchBundle(raGraphContext), raReleaseArtifact);
    } catch (error) {
      if (error instanceof RaEvidenceUnavailableError) {
        throw new InvestigationRequestError(422, "evidence_not_ready");
      }
      throw error;
    }
  }
  if (id !== "hsi-research-snapshot") throw new InvestigationRequestError(400, "unknown_research_release");
  const artifact = parseHsiResearchBundle(release);
  const ids = [...new Set(artifact.cards.map((c) => c.akshNodeId))];
  const selected = conceptId ?? ids[0]!;
  if (!ids.includes(selected)) throw new InvestigationRequestError(400, "unknown_research_concept");
  const provenance = {
    product: "aksh" as const,
    datasetId: "hsi-research-snapshot",
    version: artifact.producer.revision,
    retrievedAt: new Date().toISOString(),
  };
  return parseResearchBundle({
    schemaVersion: RESEARCH_CONTRACT_VERSION,
    containsPhi: false,
    clinicalAdvice: false,
    kgWrite: false,
    context: {
      id: "AKSH-RESEARCH-CONTEXT",
      question: `What verified research evidence is available for concept ${selected}?`,
      conceptIds: [selected],
      dataClass: "public_real",
      purpose: "research_only",
      containsPhi: false,
      provenance,
    },
    entities: ids.map((nodeId) => ({ id: nodeId, label: nodeId, type: "other", dataClass: "public_real", provenance })),
    // The snapshot has concept pointers, not subject/predicate/object edges or licensed quotes.
    sources: [],
    passages: [],
    relationships: [],
    claims: [],
    runs: [],
  });
}
