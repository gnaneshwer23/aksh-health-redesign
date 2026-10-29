/**
 * Evidence-grounded retrieval over a synthetic clinical guidance corpus.
 * Citations are always returned with drafts — never answer from empty context.
 */

import type { EvidenceCitation, SharedPatientContext } from "./agent-intel-types";

type CorpusDoc = {
  id: string;
  title: string;
  tags: string[];
  excerpt: string;
  urlOrRef: string;
};

/** Static synthetic corpus — not a live guidelines API; labelled for honesty. */
export const SYNTHETIC_EVIDENCE_CORPUS: CorpusDoc[] = [
  {
    id: "ev-nice-ng28-hba1c",
    title: "NICE NG28 — HbA1c monitoring (synthetic excerpt)",
    tags: ["diabetes", "hba1c", "monitoring", "type 2"],
    excerpt:
      "Offer HbA1c measurement at 3–6 monthly intervals until stable, then 6-monthly. Treat targets individually; do not treat AI targets as prescriptions.",
    urlOrRef: "synthetic://nice/ng28/hba1c",
  },
  {
    id: "ev-nice-ng28-metformin",
    title: "NICE NG28 — first-line therapy framing (synthetic excerpt)",
    tags: ["diabetes", "metformin", "medication"],
    excerpt:
      "Standard-release metformin remains usual first-line when tolerated. Medication changes require clinician decision — agents draft only.",
    urlOrRef: "synthetic://nice/ng28/metformin",
  },
  {
    id: "ev-anticoag-t2d",
    title: "Anticoagulation + T2D care coordination (synthetic)",
    tags: ["dvt", "apixaban", "diabetes", "safety"],
    excerpt:
      "When T2D coexists with VTE, reconcile glucose therapy and anticoagulation in one review. Flag proposed anticoagulants for HITL — never auto-prescribe.",
    urlOrRef: "synthetic://local/safety/anticoag-t2d",
  },
  {
    id: "ev-missing-data",
    title: "Missing-data policy for diabetes intelligence (synthetic)",
    tags: ["missing", "quality", "data"],
    excerpt:
      "Missing HbA1c, foot check, or retinopathy status must be surfaced before care-plan acceptance. Escalate incomplete context; do not invent values.",
    urlOrRef: "synthetic://aksh/policy/missing-data",
  },
  {
    id: "ev-follow-up",
    title: "Diabetes follow-up cadence (synthetic)",
    tags: ["follow-up", "review", "nurse"],
    excerpt:
      "Schedule structured diabetes review with clear owner and due date after care-plan acceptance. Follow-up drafts require Accept/Edit/Reject.",
    urlOrRef: "synthetic://aksh/ops/follow-up",
  },
];

function scoreDoc(doc: CorpusDoc, tokens: string[]): number {
  let score = 0;
  for (const tag of doc.tags) {
    if (tokens.some((t) => tag.includes(t) || t.includes(tag))) score += 2;
  }
  const hay = `${doc.title} ${doc.excerpt}`.toLowerCase();
  for (const t of tokens) {
    if (hay.includes(t)) score += 1;
  }
  return score;
}

export function retrieveEvidenceForContext(
  ctx: SharedPatientContext,
  options?: { limit?: number; queryHints?: string[] }
): EvidenceCitation[] {
  const limit = options?.limit ?? 3;
  const tokens = new Set<string>();
  for (const c of ctx.conditions) {
    for (const w of c.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 2) tokens.add(w);
    }
  }
  for (const m of ctx.medications) {
    for (const w of m.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 2) tokens.add(w);
    }
  }
  for (const h of options?.queryHints ?? ["diabetes", "follow-up", "missing"]) {
    tokens.add(h.toLowerCase());
  }
  if (ctx.conditions.some((c) => /diabetes/i.test(c))) {
    tokens.add("diabetes");
    tokens.add("type");
    tokens.add("hba1c");
  }
  if (ctx.conditions.some((c) => /dvt|thromb/i.test(c))) {
    tokens.add("dvt");
    tokens.add("apixaban");
  }

  const tokenList = [...tokens];
  const ranked = SYNTHETIC_EVIDENCE_CORPUS.map((doc) => ({
    doc,
    relevance: scoreDoc(doc, tokenList),
  }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  if (ranked.length === 0) {
    // Refuse empty: return missing-data policy as minimum grounding
    const fallback = SYNTHETIC_EVIDENCE_CORPUS.find((d) => d.id === "ev-missing-data")!;
    return [
      {
        id: `cite-${fallback.id}`,
        sourceId: fallback.id,
        title: fallback.title,
        excerpt: fallback.excerpt,
        relevance: 0.1,
        urlOrRef: fallback.urlOrRef,
        synthetic: true,
      },
    ];
  }

  return ranked.map((r) => ({
    id: `cite-${r.doc.id}`,
    sourceId: r.doc.id,
    title: r.doc.title,
    excerpt: r.doc.excerpt,
    relevance: Math.min(1, r.relevance / 8),
    urlOrRef: r.doc.urlOrRef,
    synthetic: true,
  }));
}
