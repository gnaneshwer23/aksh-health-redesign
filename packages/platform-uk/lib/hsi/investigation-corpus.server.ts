import "server-only";
import release from "@/data/hsi/research-bundle.json";
import { parseHsiResearchBundle } from "./research-contract";
import { parseResearchBundle, RESEARCH_CONTRACT_VERSION, type ResearchBundle } from "./researchContracts";
import { InvestigationRequestError, type InvestigationRelease } from "./investigationBackend";

export const akshInvestigationReleases: InvestigationRelease[] = [{ id: "hsi-research-snapshot", title: "HSI research snapshot", description: "Research concept pointers from the imported HSI release. No patient records or licensed source passages are included." }];
/** Graph pointers stay metadata; a PMID alone does not license a passage or establish claim support. */
export async function loadAkshInvestigationRelease(id: string, conceptId: string | null): Promise<ResearchBundle> {
  if (id !== "hsi-research-snapshot") throw new InvestigationRequestError(400, "unknown_research_release");
  const artifact = parseHsiResearchBundle(release);
  const ids = [...new Set(artifact.cards.map((c) => c.akshNodeId))];
  const selected = conceptId ?? ids[0]!;
  if (!ids.includes(selected)) throw new InvestigationRequestError(400, "unknown_research_concept");
  const provenance = { product: "aksh" as const, datasetId: "hsi-research-snapshot", version: artifact.producer.revision, retrievedAt: new Date().toISOString() };
  return parseResearchBundle({ schemaVersion: RESEARCH_CONTRACT_VERSION, containsPhi: false, clinicalAdvice: false, kgWrite: false,
    context: { id: "AKSH-RESEARCH-CONTEXT", question: `What verified research evidence is available for concept ${selected}?`, conceptIds: [selected], dataClass: "public_real", purpose: "research_only", containsPhi: false, provenance },
    entities: ids.map((nodeId) => ({ id: nodeId, label: nodeId, type: "other", dataClass: "public_real", provenance })),
    // The snapshot has concept pointers, not subject/predicate/object edges or licensed quotes.
    sources: [], passages: [], relationships: [], claims: [], runs: [],
  });
}
