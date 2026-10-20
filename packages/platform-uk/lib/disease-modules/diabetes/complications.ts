import { LAB_CATALOG, type LabKind } from "../../labs/catalog";
import { describeLab, monthsSince, type LabResult, type LabSnapshot } from "../../labs/snapshot";
import type { DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * Complication Intelligence (diabetes spec area #8).
 *
 * Feeds HORIZON as complication-risk contributing factors. Referral-
 * triggering flags route through the EXISTING `referral_pathway` human gate
 * (lib/types.ts HumanGateId) and PATHWAY agent — no new gate type is
 * introduced here. Actually routing a referral draft through PATHWAY is B4
 * UI-layer work; this module only derives and labels the flag level.
 *
 * v1 (B3): real rule-based derivation over caller-supplied evidence
 * references (e.g. a lab flag or imaging-metadata note). The scoring rule is
 * a conservative evidence-count heuristic (0 refs → none, 1 → watch, ≥2 →
 * referral_indicated) — NOT a clinically validated per-domain threshold.
 * Per-domain clinical thresholds (spec §"Open questions" #4 — which
 * complication domains should auto-trigger a referral draft) remain pending
 * clinical lead sign-off; this heuristic exists so the module produces a
 * real signal instead of a stub, without asserting a clinical judgement call
 * it isn't authorised to make.
 */

export const DIABETES_COMPLICATION_DOMAINS = [
  "retinopathy",
  "neuropathy",
  "ckd",
  "cardiovascular",
  "fatty_liver"
] as const;

export type DiabetesComplicationDomain = (typeof DIABETES_COMPLICATION_DOMAINS)[number];

export type ComplicationFlagLevel = "none" | "watch" | "referral_indicated";

export type ComplicationSignal = {
  moduleId: "COMPLICATIONS";
  feedsInto: "HORIZON";
  patientId: string;
  patientLabel: string;
  domain: DiabetesComplicationDomain;
  flagLevel: ComplicationFlagLevel;
  evidenceRefs: string[];
  /** What the flag rests on: laboratory values (LAB_RULES), caller evidence references, or nothing. */
  basis: "laboratory" | "evidence_count" | "none";
  /** Laboratory results that were due but missing or out of date: shown for clinician review, never assumed normal. */
  missingLabs: string[];
  ruleVersion: string;
  /** Referral drafts route through the existing PATHWAY agent + referral_pathway human gate — no new gate type. */
  referralGate: "referral_pathway";
  limitations: string[];
} & DiabetesSignalHonesty;

/**
 * Laboratory rules (version below). Thresholds follow widely used diabetes and kidney guidance (eGFR categories G3a/G4,
 * albuminuria categories A2/A3) but are NOT yet signed off by a clinical lead for Aksh; they flag for clinician review
 * only. Lipids and liver results never indicate a referral on their own. Results older than LAB_MAX_AGE_MONTHS are not
 * used and are reported as missing.
 */
export const LAB_RULE_VERSION = "lab-rules-2026-10-20";
export const LAB_MAX_AGE_MONTHS = 15;

type LabRule = { kind: LabKind; level: Exclude<ComplicationFlagLevel, "none">; test: (v: number) => boolean; text: string };
export const LAB_RULES: Partial<Record<DiabetesComplicationDomain, { kinds: LabKind[]; rules: LabRule[] }>> = {
  ckd: {
    kinds: ["egfr", "acr"],
    rules: [
      { kind: "egfr", level: "referral_indicated", test: (v) => v < 30, text: "eGFR below 30" },
      { kind: "acr", level: "referral_indicated", test: (v) => v >= 30, text: "ACR 30 mg/mmol or more" },
      { kind: "egfr", level: "watch", test: (v) => v < 60, text: "eGFR below 60" },
      { kind: "acr", level: "watch", test: (v) => v > 3, text: "ACR above 3 mg/mmol" },
    ],
  },
  cardiovascular: {
    kinds: ["ldl"],
    rules: [{ kind: "ldl", level: "watch", test: (v) => v >= 2.6, text: "LDL 2.6 mmol/L or more" }],
  },
  fatty_liver: {
    kinds: ["alt"],
    rules: [{ kind: "alt", level: "watch", test: (v) => v > 40, text: "ALT above 40 U/L" }],
  },
};

const RANK: Record<ComplicationFlagLevel, number> = { none: 0, watch: 1, referral_indicated: 2 };

function labAssessment(domain: DiabetesComplicationDomain, labs: LabSnapshot | undefined, now: Date) {
  const def = LAB_RULES[domain];
  if (!def) return null;
  const usable = new Map<LabKind, LabResult>();
  const missing: string[] = [];
  for (const k of def.kinds) {
    const r = labs?.[k];
    if (r && monthsSince(r.observedAt, now) <= LAB_MAX_AGE_MONTHS) usable.set(k, r);
    else missing.push(r ? `${LAB_CATALOG[k].label} out of date (last ${r.observedAt.slice(0, 10)})` : `${LAB_CATALOG[k].label} not on record`);
  }
  let level: ComplicationFlagLevel = "none";
  const refs: string[] = [];
  for (const rule of def.rules) {
    const r = usable.get(rule.kind);
    if (r && rule.test(r.value) && RANK[rule.level] > RANK[level]) level = rule.level;
  }
  for (const [k, r] of usable) {
    const hit = def.rules.find((x) => x.kind === k && x.test(r.value));
    refs.push(describeLab(LAB_CATALOG[k].label, r) + (hit ? ` — ${hit.text}` : ""));
  }
  return { level, refs, missing, used: usable.size };
}

function deriveFlagLevel(evidenceCount: number): ComplicationFlagLevel {
  if (evidenceCount >= 2) return "referral_indicated";
  if (evidenceCount === 1) return "watch";
  return "none";
}

export function buildComplicationSignal(
  context: DiabetesPatientContext,
  domain: DiabetesComplicationDomain,
  evidenceRefs: string[] = [],
  labs?: LabSnapshot,
  now: Date = new Date()
): ComplicationSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const fromEvidence = deriveFlagLevel(evidenceRefs.length);
  const lab = labAssessment(domain, labs, now);
  const fromLabs = lab?.level ?? "none";
  const flagLevel = RANK[fromLabs] >= RANK[fromEvidence] ? fromLabs : fromEvidence;
  const basis = lab && lab.used > 0 && RANK[fromLabs] >= RANK[fromEvidence] ? "laboratory" : evidenceRefs.length ? "evidence_count" : "none";

  return {
    moduleId: "COMPLICATIONS",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    domain,
    flagLevel,
    evidenceRefs: [...(lab?.refs ?? []), ...evidenceRefs],
    basis,
    missingLabs: lab?.missing ?? [],
    ruleVersion: LAB_RULE_VERSION,
    referralGate: "referral_pathway",
    limitations: [
      lab
        ? `Laboratory rule ${LAB_RULE_VERSION} (${LAB_RULES[domain]!.rules.map((r) => r.text).join("; ")}): flags for clinician review; thresholds not yet signed off by a clinical lead.`
        : "No laboratory rule for this domain: evidence-count heuristic (0 refs=none, 1=watch, ≥2=referral_indicated), a conservative placeholder.",
      ...(lab?.missing.length ? [`Missing or out of date (over ${LAB_MAX_AGE_MONTHS} months): ${lab.missing.join("; ")}. Not assumed normal.`] : []),
      "Per-domain referral-trigger thresholds pending clinical lead sign-off (spec §\"Open questions\" #4).",
      "This module derives the flag level only; a referral is drafted through PATHWAY and needs a clinician's confirmation (referral_pathway gate)."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
