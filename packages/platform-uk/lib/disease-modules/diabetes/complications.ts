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
  /** Referral drafts route through the existing PATHWAY agent + referral_pathway human gate — no new gate type. */
  referralGate: "referral_pathway";
  limitations: string[];
} & DiabetesSignalHonesty;

function deriveFlagLevel(evidenceCount: number): ComplicationFlagLevel {
  if (evidenceCount >= 2) return "referral_indicated";
  if (evidenceCount === 1) return "watch";
  return "none";
}

export function buildComplicationSignal(
  context: DiabetesPatientContext,
  domain: DiabetesComplicationDomain,
  evidenceRefs: string[] = []
): ComplicationSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;
  const flagLevel = deriveFlagLevel(evidenceRefs.length);

  return {
    moduleId: "COMPLICATIONS",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    domain,
    flagLevel,
    evidenceRefs,
    referralGate: "referral_pathway",
    limitations: [
      "Rule: evidence-count heuristic (0 refs=none, 1=watch, ≥2=referral_indicated) — a conservative placeholder, not a clinically validated per-domain threshold.",
      "Per-domain referral-trigger thresholds pending clinical lead sign-off (spec §\"Open questions\" #4).",
      "This module derives the flag level only; actually routing a referral draft through PATHWAY/referral_pathway is a later (B4+) wiring step."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
