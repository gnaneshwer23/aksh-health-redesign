/**
 * Synthetic catalogs for Phase 3 medication + personalised care.
 * Interaction fixtures are stubs — not a licensed/maintained drug database.
 */

import { randomUUID } from "crypto";

import { checkInteractions } from "../mock-data/medications";
import { getMockGuardianResponse } from "../neo4j/mock-fallback";
import type {
  CarePlanTemplate,
  EducationalResource,
  InteractionSourceHonesty,
  MedicationSafetyFlag,
  PatientGoal,
  SyntheticInteractionFlag,
} from "./medcare-types";

export const INTERACTION_SOURCE_HONESTY: InteractionSourceHonesty = {
  kind: "synthetic_stub",
  licensedDrugDatabase: false,
  label: "Synthetic interaction stub (not a licensed drug database)",
  note:
    "Flags come from in-repo synthetic fixtures / mock GUARDIAN path. This is not BNF API, First Databank, Lexicomp, or any maintained clinical drug-interaction service. Do not treat as validated CDS.",
};

export const CARE_PLAN_TEMPLATES: CarePlanTemplate[] = [
  {
    id: "t2d_foundational",
    title: "Type 2 diabetes — foundational care",
    description: "Monitoring, lifestyle discussion, and medication review prompts (DRAFT until HITL).",
    sections: [
      {
        id: "monitoring",
        title: "Monitoring",
        clinical: true,
        itemTemplates: [
          "Confirm HbA1c and glucose review cadence with clinician",
          "Review foot, eye, and kidney checks due/overdue",
        ],
      },
      {
        id: "lifestyle",
        title: "Lifestyle discussion",
        clinical: false,
        itemTemplates: [
          "Diet and activity talking points for consultation",
          "Signpost patient education resources (synthetic catalog)",
        ],
      },
      {
        id: "medicines",
        title: "Medicines review",
        clinical: true,
        itemTemplates: [
          "Reconcile active vs proposed medicines — no autonomous prescribe/adjust",
          "Surface allergy and synthetic interaction flags for clinician review",
        ],
      },
      {
        id: "safety",
        title: "Safety & honesty",
        clinical: true,
        itemTemplates: [
          "ehrWrite remains false",
          "Not clinically validated CDS",
        ],
      },
    ],
    synthetic: true,
  },
  {
    id: "t2d_with_cvd_risk",
    title: "Type 2 diabetes with CVD risk discussion",
    description: "Adds cardiovascular risk conversation prompts; still DRAFT + HITL.",
    sections: [
      {
        id: "cvd",
        title: "Cardiovascular risk discussion",
        clinical: true,
        itemTemplates: [
          "Discuss lipid and BP context already on record (no new prescribe)",
          "Referral drafts require separate clinician Accept",
        ],
      },
      {
        id: "medicines",
        title: "Medicines & bleeding risk",
        clinical: true,
        itemTemplates: [
          "Review anticoagulant / antiplatelet combinations via synthetic flags only",
          "No dose change without clinician decision",
        ],
      },
      {
        id: "safety",
        title: "Safety & honesty",
        clinical: true,
        itemTemplates: ["ehrWrite false", "Synthetic demo — not validated CDS"],
      },
    ],
    synthetic: true,
  },
  {
    id: "insulin_education",
    title: "Insulin education support",
    description: "Education-first template; no insulin titration autonomy.",
    sections: [
      {
        id: "education",
        title: "Education",
        clinical: false,
        itemTemplates: [
          "Offer insulin technique / hypo recognition education resources",
          "Confirm patient goals around confidence with injections",
        ],
      },
      {
        id: "safety",
        title: "Safety",
        clinical: true,
        itemTemplates: [
          "No autonomous insulin adjustment",
          "Hypoglycaemia concern → escalate to clinician",
        ],
      },
    ],
    synthetic: true,
  },
  {
    id: "polypharmacy_review",
    title: "Polypharmacy medication review",
    description: "Structured recon + safety flag review for multi-medicine patients.",
    sections: [
      {
        id: "recon",
        title: "Reconciliation",
        clinical: true,
        itemTemplates: [
          "Complete medication reconciliation run (HITL)",
          "Document discrepancies without prescribing",
        ],
      },
      {
        id: "interactions",
        title: "Interaction & allergy panel",
        clinical: true,
        itemTemplates: [
          "Review synthetic interaction stub flags",
          "Confirm allergy list currency with patient",
        ],
      },
      {
        id: "safety",
        title: "Safety & honesty",
        clinical: true,
        itemTemplates: ["No autonomous deprescribe", "ehrWrite false"],
      },
    ],
    synthetic: true,
  },
];

export const EDUCATIONAL_CATALOG: EducationalResource[] = [
  {
    id: "edu-hypo",
    title: "Recognising and treating hypoglycaemia",
    summary: "Patient-facing overview of hypo symptoms and first steps (synthetic demo copy).",
    audience: "patient",
    topics: ["hypoglycaemia", "safety"],
    urlOrRef: "synthetic://education/hypoglycaemia",
    synthetic: true,
  },
  {
    id: "edu-med-list",
    title: "Keeping an up-to-date medicine list",
    summary: "Why reconciliation matters before clinic visits.",
    audience: "patient",
    topics: ["medicines", "reconciliation"],
    urlOrRef: "synthetic://education/medicine-list",
    synthetic: true,
  },
  {
    id: "edu-foot",
    title: "Daily foot checks in diabetes",
    summary: "Simple daily foot check routine (educational, not diagnostic).",
    audience: "patient",
    topics: ["complications", "self-care"],
    urlOrRef: "synthetic://education/foot-checks",
    synthetic: true,
  },
  {
    id: "edu-clinician-polypharmacy",
    title: "Polypharmacy review checklist (clinician)",
    summary: "Talking points for structured medicines review — decision support framing only.",
    audience: "clinician",
    topics: ["polypharmacy", "HITL"],
    urlOrRef: "synthetic://education/polypharmacy-checklist",
    synthetic: true,
  },
];

export function buildSyntheticInteractions(patientId: string, medications: string[]): SyntheticInteractionFlag[] {
  const guardian = getMockGuardianResponse(patientId);
  const fromGuardian: SyntheticInteractionFlag[] = (guardian?.interactions ?? []).map((i) => ({
    id: `ix-${patientId}-${i.drugA}-${i.drugB}`.replace(/\s+/g, "_"),
    drugA: i.drugA,
    drugB: i.drugB,
    severity: i.severity === "red" ? "high" : i.severity === "amber" ? "medium" : "low",
    referenceLabel: `${i.bnfRef} (synthetic fixture label — not live BNF)`,
    recommendation: i.recommendation,
    validatedCds: false,
    synthetic: true,
  }));

  if (fromGuardian.length > 0) return fromGuardian;

  const seen = new Set<string>();
  const out: SyntheticInteractionFlag[] = [];
  for (const medLine of medications) {
    const drugName = medLine.split(/\s+\d/)[0]?.trim() ?? medLine;
    for (const hit of checkInteractions(drugName, medications)) {
      const key = [hit.drugA, hit.drugB].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `ix-${patientId}-${key}`.replace(/\s+/g, "_"),
        drugA: hit.drugA,
        drugB: hit.drugB,
        severity: hit.severity === "High" ? "high" : hit.severity === "Medium" ? "medium" : "low",
        referenceLabel: `BNF ${hit.bnfSection} (synthetic fixture label — not live BNF)`,
        recommendation: hit.recommendation,
        validatedCds: false,
        synthetic: true,
      });
    }
  }
  return out;
}

export function defaultGoalsForPatient(patientId: string, now = Date.now()): PatientGoal[] {
  const iso = new Date(now).toISOString();
  return [
    {
      id: `goal-${patientId}-adherence`,
      patientId,
      title: "Bring an accurate medicine list to next review",
      description: "Patient-proposed goal supporting reconciliation — not a prescription change.",
      category: "medication_adherence",
      status: "proposed",
      targetDate: new Date(now + 14 * 86400_000).toISOString().slice(0, 10),
      createdAt: iso,
      updatedAt: iso,
      synthetic: true,
    },
    {
      id: `goal-${patientId}-edu`,
      patientId,
      title: "Complete hypoglycaemia education module",
      description: "Link to synthetic educational resource; clinician confirms relevance.",
      category: "education",
      status: "proposed",
      targetDate: new Date(now + 30 * 86400_000).toISOString().slice(0, 10),
      createdAt: iso,
      updatedAt: iso,
      synthetic: true,
    },
  ];
}

export function safetyFlagsFromInteractions(
  patientId: string,
  interactions: SyntheticInteractionFlag[],
  allergies: Array<{ substance: string; criticality: string }>,
  now = Date.now()
): MedicationSafetyFlag[] {
  const iso = new Date(now).toISOString();
  const flags: MedicationSafetyFlag[] = interactions.map((ix) => ({
    id: `flag-${ix.id}`,
    patientId,
    code: `interaction_${ix.severity}`,
    severity: ix.severity,
    title: `Synthetic interaction: ${ix.drugA} + ${ix.drugB}`,
    detail: `${ix.recommendation} · Source: synthetic stub (not licensed drug DB). validatedCds=false.`,
    relatedMedications: [ix.drugA, ix.drugB],
    status: "pending_review",
    createdAt: iso,
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    autonomousAdjust: false,
    validatedCds: false,
    synthetic: true,
  }));

  for (const a of allergies) {
    if (a.criticality === "high" || a.criticality === "unable_to_assess") {
      flags.push({
        id: `flag-allergy-${patientId}-${a.substance}`.replace(/\s+/g, "_").slice(0, 80),
        patientId,
        code: "allergy_attention",
        severity: a.criticality === "high" ? "high" : "medium",
        title: `Allergy attention: ${a.substance}`,
        detail: `Active allergy on Patient 360 spine (${a.criticality}). Confirm before any medicine change — no autonomous prescribe.`,
        relatedMedications: [],
        status: "pending_review",
        createdAt: iso,
        decidedBy: null,
        decidedAt: null,
        decisionNote: null,
        hitlRequired: true,
        ehrWrite: false,
        autonomousPrescribe: false,
        autonomousAdjust: false,
        validatedCds: false,
        synthetic: true,
      });
    }
  }

  if (flags.length === 0) {
    flags.push({
      id: `flag-info-${patientId}-${randomUUID().slice(0, 8)}`,
      patientId,
      code: "no_stub_interactions",
      severity: "info",
      title: "No synthetic interaction hits on current list",
      detail:
        "Absence of stub hits is not clinical clearance. Licensed drug-DB integration is not present.",
      relatedMedications: [],
      status: "pending_review",
      createdAt: iso,
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      hitlRequired: true,
      ehrWrite: false,
      autonomousPrescribe: false,
      autonomousAdjust: false,
      validatedCds: false,
      synthetic: true,
    });
  }

  return flags;
}
