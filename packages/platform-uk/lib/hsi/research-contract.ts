import { z } from "zod";

/** Independent consumer boundary: unknown properties and unsafe flags fail closed. */
export const hsiResearchSchema = z.object({
  schemaVersion: z.literal("hsi-aksh-research-1"),
  producer: z.object({
    repository: z.literal("gnaneshwer23/hsi-core"),
    revision: z.string().regex(/^[a-f0-9]{40}$/),
    workingTree: z.enum(["clean", "includes_local_changes"]),
  }).strict(),
  generatedAt: z.iso.datetime({ offset: true }),
  containsPhi: z.literal(false),
  notCds: z.literal(true),
  autoApplyToEhr: z.literal(false),
  cards: z.array(z.object({
    claimId: z.string().regex(/^HSI-C-[A-Z0-9-]+$/),
    edgeId: z.string().regex(/^HSI-E-[A-Z0-9-]+$/),
    assertion: z.string().min(1).max(4000),
    akshNodeId: z.string().regex(/^aksh:[a-z0-9_:-]+$/),
    loinc: z.string().regex(/^\d+-\d$/).nullable(),
    grade: z.enum(["established", "uncertain", "unexplored"]),
    review: z.enum(["draft", "unreviewed", "source-verified", "claim-assessed", "approved", "rejected", "conflicting", "superseded"]),
    pmid: z.string().regex(/^\d+$/).nullable(),
    doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).nullable(),
    provenanceNote: z.string().max(8000).nullable(),
    sourceSupport: z.literal("not_verified_for_clinical_use"),
  }).strict()).min(1).max(500),
}).strict().superRefine((bundle, ctx) => {
  for (const field of ["claimId", "edgeId"] as const) {
    const values = bundle.cards.map((card) => card[field]);
    if (new Set(values).size !== values.length) ctx.addIssue({ code: "custom", message: `Duplicate ${field}` });
  }
});

export function parseHsiResearchBundle(input: unknown) {
  return hsiResearchSchema.parse(input);
}

export type HsiResearchBundle = z.infer<typeof hsiResearchSchema>;
