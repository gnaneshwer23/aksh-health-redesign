import { detectCheckInEscalation } from "@/lib/patient-companion/check-in";
import { MARKET_BY_CODE } from "@/lib/synthetic-world/catalog";
import type { MarketCode } from "@/lib/synthetic-world/types";

import type { SafetyResult } from "./types";

/**
 * Safety screen — runs before intent handling on every patient turn (hazard H-ACC-1).
 *
 * Deterministic phrase and threshold checks. Wording returned to the patient is fixed and
 * never generated. Thresholds are defaults pending Clinical Safety Officer sign-off
 * (FRONT_DESK_HONESTY.thresholdsClinicallySignedOff === false).
 */

const EMERGENCY_PHRASES = [
  // cardiorespiratory
  "chest pain",
  "crushing chest",
  "can't breathe",
  "cant breathe",
  "cannot breathe",
  "struggling to breathe",
  "blue lips",
  // stroke (FAST)
  "face drooping",
  "face has dropped",
  "slurred speech",
  "can't lift my arm",
  "cant lift my arm",
  "arm weakness",
  // collapse / consciousness
  "collapsed",
  "unconscious",
  "won't wake up",
  "wont wake up",
  "can't wake",
  "cant wake",
  "having a fit",
  "seizure",
  // anaphylaxis / bleeding
  "throat swelling",
  "tongue swelling",
  "anaphylaxis",
  "bleeding heavily",
  "won't stop bleeding",
];

const URGENT_SAME_DAY_PHRASES = [
  "ketones",
  "vomiting and my sugar",
  "vomiting and high sugar",
  "keep being sick",
  "hypo again",
  "hypos every day",
  "foot is black",
  "foot ulcer",
  "foot is hot and swollen",
  "sudden vision loss",
  "lost my vision",
];

/** Fixed wording per market. Aksh is not tied to one health system, so numbers come from market config. */
export function safetyMessages(market: MarketCode | string = "GB") {
  const m = MARKET_BY_CODE[market as MarketCode];
  // Unknown locale: never guess another country's number.
  if (!m) {
    return {
      emergency: "This could be an emergency. Please call your local emergency number now. If you can’t, ask someone near you to call. I’m also alerting the practice team.",
      crisis: "I’m really sorry you’re feeling like this. If you might act on these thoughts, please call your local emergency number now, or a crisis line near you. I’m letting the practice team know.",
      urgent: "That needs to be looked at today. I’m passing this to the practice team now and someone will call you back. If things get worse before then, call your local urgent care service, or your local emergency number in an emergency.",
    };
  }
  return {
    emergency: `This could be an emergency. Please call ${m.emergencyNumber} now. If you can’t, ask someone near you to call. I’m also alerting the practice team.`,
    crisis: `I’m really sorry you’re feeling like this. If you might act on these thoughts, please call ${m.emergencyNumber} now.${m.urgentAdviceLine ? ` You can also call ${m.urgentAdviceLine} and choose the mental health option, or contact ${m.crisisLine}, any time.` : ` You can also contact ${m.crisisLine}, any time.`} I’m letting the practice team know.`,
    urgent: `That needs to be looked at today. I’m passing this to the practice team now and someone will call you back. If things get worse before then, call ${m.urgentAdviceLine ?? "your local urgent care service"}, or ${m.emergencyNumber} in an emergency.`,
  };
}

function find(text: string, phrases: string[]) {
  return phrases.find((p) => text.includes(p)) ?? null;
}

/** Glucose readings spoken in mmol/L, e.g. "my sugar was 2.6" or "glucose 27". */
function extremeGlucose(text: string): { kind: "low" | "high"; value: number } | null {
  const pattern = /(?:sugar|sugars|glucose|bm)[^0-9]{0,24}(\d{1,2}(?:\.\d)?)(?![\d/.])/g;
  for (const m of text.matchAll(pattern)) {
    const v = Number(m[1]);
    if (Number.isFinite(v) && v > 0 && v < 3.0) return { kind: "low", value: v };
    if (Number.isFinite(v) && v >= 25 && v < 60) return { kind: "high", value: v };
  }
  return null;
}

export function screenUtterance(utterance: string, market: MarketCode | string = "GB"): SafetyResult {
  const text = utterance.toLowerCase();
  const MESSAGES = safetyMessages(market);

  const crisis = detectCheckInEscalation(text);
  if (crisis.triggered && crisis.category === "self_harm_or_crisis") {
    return {
      level: "crisis",
      reason: "Possible self-harm or crisis disclosed",
      matched: crisis.matchedPhrase,
      patientMessage: MESSAGES.crisis,
      handOffNow: true,
    };
  }

  const emergency = find(text, EMERGENCY_PHRASES) ?? (crisis.category === "red_flag_symptom" ? crisis.matchedPhrase : null);
  if (emergency) {
    return {
      level: "emergency",
      reason: "Possible emergency symptom",
      matched: emergency,
      patientMessage: MESSAGES.emergency,
      handOffNow: true,
    };
  }

  const glucose = extremeGlucose(text);
  if (glucose) {
    return {
      level: "urgent_same_day",
      reason:
        glucose.kind === "low"
          ? `Reported glucose ${glucose.value} mmol/L (below 3.0)`
          : `Reported glucose ${glucose.value} mmol/L (25 or above)`,
      matched: String(glucose.value),
      patientMessage: MESSAGES.urgent,
      handOffNow: true,
    };
  }

  const urgent = find(text, URGENT_SAME_DAY_PHRASES);
  if (urgent) {
    return {
      level: "urgent_same_day",
      reason: "Symptom needing same-day clinical contact",
      matched: urgent,
      patientMessage: MESSAGES.urgent,
      handOffNow: true,
    };
  }

  if (crisis.triggered && crisis.category === "diabetes_distress") {
    return {
      level: "clinician_review",
      reason: "Diabetes distress disclosed",
      matched: crisis.matchedPhrase,
      patientMessage: null,
      handOffNow: false,
    };
  }

  return { level: "none", reason: null, matched: null, patientMessage: null, handOffNow: false };
}

export const SAFETY_MESSAGES = safetyMessages("GB");
