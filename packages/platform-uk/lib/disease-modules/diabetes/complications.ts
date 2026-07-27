import type { DiabetesPatientContext, DiabetesSignalHonesty } from "./types";
import { DIABETES_SIGNAL_HONESTY } from "./types";

/**
 * Complication Intelligence (diabetes spec area #8).
 *
 * Feeds HORIZON as complication-risk contributing factors. Referral-
 * triggering flags route through the EXISTING `referral_pathway` human gate
 * (lib/types.ts HumanGateId) and PATHWAY agent — no new gate type is
 * introduced here.
 *
 * v0: typed stub over caller-supplied evidence references (e.g. a lab flag
 * or imaging-metadata note). No scoring thresholds implemented yet.
 * TODO(v1): implement per-domain flag-level scoring once thresholds are
 * confirmed by a clinical lead (spec §"Open questions" #4 — which
 * complication domains should auto-trigger a referral draft vs. require
 * clinician-initiated referral only).
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

export function buildComplicationSignal(
  context: DiabetesPatientContext,
  domain: DiabetesComplicationDomain,
  evidenceRefs: string[] = []
): ComplicationSignal {
  const patientLabel = context.patientLabel?.trim() || context.patientId;

  return {
    moduleId: "COMPLICATIONS",
    feedsInto: "HORIZON",
    patientId: context.patientId,
    patientLabel,
    domain,
    flagLevel: evidenceRefs.length ? "watch" : "none",
    evidenceRefs,
    referralGate: "referral_pathway",
    limitations: [
      "v0 stub — no domain-specific scoring thresholds implemented yet (deferred to v1).",
      "Referral-triggering thresholds pending clinical lead sign-off (spec §\"Open questions\" #4)."
    ],
    ...DIABETES_SIGNAL_HONESTY
  };
}
