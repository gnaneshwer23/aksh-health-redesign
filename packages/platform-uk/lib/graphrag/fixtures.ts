export type GuidelineFixture = {
  id: string;
  title: string;
  citation: string;
  provenance: string;
  version: string;
  treats: string;
  body: string;
};

/** Versioned synthetic guidelines — not live literature. */
export const DIABETES_GUIDELINE_FIXTURES: GuidelineFixture[] = [
  {
    id: "gl-t2d-hba1c-review-v1",
    title: "Type 2 diabetes — glycaemic review interval",
    citation: "Aksh synthetic guideline GL-T2D-001 v1 (rehearsal only)",
    provenance: "synthetic_guideline_fixture",
    version: "1.0",
    treats: "Type 2 diabetes mellitus",
    body: "Offer HbA1c review at least annually; sooner if control deteriorating or therapy changed. Do not invent values.",
  },
  {
    id: "gl-t2d-metformin-renal-v1",
    title: "Metformin and renal function",
    citation: "Aksh synthetic guideline GL-T2D-002 v1 (rehearsal only)",
    provenance: "synthetic_guideline_fixture",
    version: "1.0",
    treats: "Type 2 diabetes mellitus",
    body: "Review metformin dose against current eGFR. Missing eGFR is missing critical information — do not fabricate eGFR.",
  },
  {
    id: "gl-antithrombotic-dual-v1",
    title: "Antiplatelet plus anticoagulant combination",
    citation: "Aksh synthetic safety statement GL-HEM-001 v1 (rehearsal only)",
    provenance: "synthetic_guideline_fixture",
    version: "1.0",
    treats: "Deep vein thrombosis",
    body: "Aspirin plus a DOAC is high-risk combination therapy. Surface the conflict; do not silently merge or drop either drug.",
  },
];
