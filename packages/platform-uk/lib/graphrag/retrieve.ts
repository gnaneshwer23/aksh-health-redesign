import type { ClinicalContextPackage } from "@/lib/context-engine/types";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { fetchPatientFromGraph } from "@/lib/neo4j/queries";

import { DIABETES_GUIDELINE_FIXTURES, type GuidelineFixture } from "./fixtures";

export type GraphRagHit = {
  id: string;
  kind: "guideline" | "graph_fact" | "fixture_fact";
  title: string;
  text: string;
  citation: string;
  provenance: string;
  score: number;
  retrieved: true;
};

export type GraphRagResult = {
  dataSource: "neo4j" | "mock";
  liveEmis: false;
  query: string;
  patientId: string;
  hits: GraphRagHit[];
  subgraph: Array<{ from: string; rel: string; to: string }>;
};

function lexicalScore(query: string, text: string): number {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  if (terms.length === 0) return 0;
  const hay = text.toLowerCase();
  let n = 0;
  for (const t of terms) if (hay.includes(t)) n += 1;
  return n / terms.length;
}

function guidelineHit(g: GuidelineFixture, query: string): GraphRagHit {
  return {
    id: g.id,
    kind: "guideline",
    title: g.title,
    text: g.body,
    citation: g.citation,
    provenance: g.provenance,
    score: Math.max(lexicalScore(query, `${g.title} ${g.body} ${g.treats}`), 0.2),
    retrieved: true,
  };
}

export async function retrieveGraphRag(input: {
  patientId: string;
  query: string;
  context?: ClinicalContextPackage | null;
}): Promise<GraphRagResult> {
  const query = input.query.trim() || "diabetes hba1c medication safety";
  const subgraph: GraphRagResult["subgraph"] = [];
  const hits: GraphRagHit[] = [];

  let dataSource: "neo4j" | "mock" = "mock";
  if (isNeo4jConfigured()) {
    try {
      const graph = await fetchPatientFromGraph(input.patientId);
      if (graph) {
        dataSource = "neo4j";
        for (const c of graph.conditions) {
          subgraph.push({ from: input.patientId, rel: "HAS_CONDITION", to: c });
        }
        for (const m of graph.medications) {
          subgraph.push({ from: input.patientId, rel: "TAKES", to: m });
        }
      }
    } catch {
      dataSource = "mock";
    }
  }

  const ctx = input.context;
  if (ctx) {
    for (const c of ctx.conditions) subgraph.push({ from: ctx.patient_context.patientId, rel: "HAS_CONDITION", to: c });
    for (const m of ctx.medications) subgraph.push({ from: ctx.patient_context.patientId, rel: "TAKES", to: m });
    for (const a of ctx.allergies) subgraph.push({ from: ctx.patient_context.patientId, rel: "HAS_ALLERGY", to: a });
    for (const lab of ctx.laboratory_results) {
      hits.push({
        id: `lab-${lab.name}`,
        kind: "fixture_fact",
        title: lab.name,
        text: `${lab.name} ${lab.value}`,
        citation: `Patient fact · ${lab.recordedAt ?? "unknown time"}`,
        provenance: "context_package",
        score: 1,
        retrieved: true,
      });
    }
  }

  for (const g of DIABETES_GUIDELINE_FIXTURES) {
    hits.push(guidelineHit(g, query));
  }

  hits.sort((a, b) => b.score - a.score);

  // High-fidelity longitudinal packs can emit many lab facts at score 1.
  // Keep hybrid retrieval honest: always reserve guideline slots in the top window.
  const guidelines = hits.filter((h) => h.kind === "guideline");
  const other = hits.filter((h) => h.kind !== "guideline");
  const guidelineSlots = Math.min(3, guidelines.length);
  const mixed = [...other.slice(0, Math.max(0, 8 - guidelineSlots)), ...guidelines.slice(0, guidelineSlots)];
  mixed.sort((a, b) => b.score - a.score);

  const uniqueSub = new Map(subgraph.map((e) => [`${e.from}|${e.rel}|${e.to}`, e]));

  return {
    dataSource,
    liveEmis: false,
    query,
    patientId: input.patientId,
    hits: mixed.slice(0, 8),
    subgraph: [...uniqueSub.values()].slice(0, 24),
  };
}
