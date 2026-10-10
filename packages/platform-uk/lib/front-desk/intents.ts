import { captureHealthData } from "./health-capture";
import { isClinicalQuestion } from "./knowledge";
import type { AccessIntent, AppointmentType } from "./types";

/** Deterministic intent router. Low confidence falls through to "unknown" → clarify, then hand-off. */
export function detectIntent(utterance: string): AccessIntent {
  const t = utterance.toLowerCase();

  if (/\b(speak|talk) to (a |someone|somebody|a person|a human|reception|the doctor|a doctor|the nurse)|\breal person\b|\bhuman\b/.test(t)) {
    return "speak_to_someone";
  }
  if (/\b(cancel|can't make|cant make|won't make|wont make|can no longer)\b/.test(t)) return "cancel";
  if (/\b(move|change|reschedule|rearrange|different (day|time))\b/.test(t)) return "move";
  if (/\b(repeat prescription|prescription|refill|run out of my)\b/.test(t)) return "repeat_prescription";
  if (/\b(book|appointment|see (a|the) (doctor|gp|nurse)|make an appointment|need an appointment)\b/.test(t)) return "book";
  if (
    /\b(update|readings?|my sugars?|my glucose|my blood pressure|feeling|symptoms?|been having|weigh)\b/.test(t) ||
    captureHealthData(t).length > 0
  ) {
    return "health_update";
  }
  if (isClinicalQuestion(t) || /\?|\b(how|what|when|where|can i|do i|is there)\b/.test(t)) return "question";
  return "unknown";
}

export function detectAppointmentType(utterance: string): AppointmentType | null {
  const t = utterance.toLowerCase();
  if (/diabetes (review|check|appointment)|annual review|diabetic review/.test(t)) return "diabetes_review";
  if (/blood test|bloods|blood sample/.test(t)) return "blood_test";
  if (/foot (check|review)|feet/.test(t)) return "foot_check";
  if (/nurse/.test(t)) return "nurse_review";
  if (/doctor|gp\b/.test(t)) return "gp_routine";
  return null;
}

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  gp_routine: "GP appointment",
  diabetes_review: "diabetes review",
  blood_test: "blood test",
  nurse_review: "nurse appointment",
  foot_check: "diabetes foot check",
};

/** "the first one", "2", "Tuesday at 10:20", "10.40" → index into offered slots. */
export function pickOfferedSlot(utterance: string, offered: { start: string }[]): number | null {
  const t = utterance.toLowerCase();
  // Ordinal words first ("the second one" must not match "one"), then bare numbers.
  const ordinals: [RegExp, number][] = [
    [/\b(third|3rd|last)\b/, 2],
    [/\b(second|2nd|middle)\b/, 1],
    [/\b(first|1st)\b/, 0],
    [/^(?:number\s+|option\s+)?(three|3)\b/, 2],
    [/^(?:number\s+|option\s+)?(two|2)\b/, 1],
    [/^(?:number\s+|option\s+)?(one|1)\b/, 0],
  ];
  const time = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (time) {
    const hhmm = `${time[1].padStart(2, "0")}:${time[2]}`;
    const idx = offered.findIndex((s) => londonTime(s.start) === hhmm);
    if (idx >= 0) return idx;
  }
  const trimmed = t.trim();
  for (const [re, i] of ordinals) if (re.test(trimmed) && i < offered.length) return i;
  return null;
}

export function londonTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

export function londonDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
}

export function isYes(t: string) {
  return /\b(yes|yeah|yep|please|ok|okay|sure|correct|that's right|go ahead|do it)\b/i.test(t);
}

export function isNo(t: string) {
  return /\b(no|nope|don't|dont|not now|leave it)\b/i.test(t);
}

export function isDone(t: string) {
  return /\b(that's all|thats all|that's it|thats it|nothing else|no more|done|finished|bye|goodbye)\b/i.test(t);
}
