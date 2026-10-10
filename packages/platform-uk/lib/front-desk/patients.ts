import { patients } from "@/lib/mock-data/patients";
import { getSyntheticWorld } from "@/lib/synthetic-world/generate";
import type { MarketCode } from "@/lib/synthetic-world/types";

/**
 * Identity for Front Desk conversations (hazard H-ACC-3): a name AND date of birth must match
 * before anything is booked or discussed. Synthetic cohort only.
 */

/** Ofcom-reserved drama range (07700 900000–900999): can never reach a real person. */
export function syntheticPhone(patientId: string) {
  const n = Number(patientId.replace(/\D/g, "")) || 0;
  return `07700 900${String(n % 1000).padStart(3, "0")}`;
}

/** Synthetic contact preference: every seventh patient has opted out of phone contact. */
export function phoneContactAllowed(patientId: string) {
  const n = Number(patientId.replace(/\D/g, "")) || 0;
  return n % 7 !== 3;
}

/** Who Front Desk can identify: the clinical demo cohort plus the 500-patient synthetic network. */
export type DeskPatient = { id: string; name: string; dob: string; market: MarketCode };

let index: DeskPatient[] | null = null;
function allPatients(): DeskPatient[] {
  if (!index) {
    index = [
      ...patients.map((p) => ({ id: p.id, name: p.name, dob: p.dob, market: "GB" as MarketCode })),
      ...getSyntheticWorld().patients.map((p) => ({ id: p.id, name: `${p.title} ${p.givenName} ${p.familyName}`, dob: p.dob, market: p.market })),
    ];
  }
  return index;
}

export function getPatient(id: string | null): DeskPatient | null {
  return id ? allPatients().find((p) => p.id === id) ?? null : null;
}

export function displayName(p: { name: string }) {
  return p.name.replace(/^(Mr|Mrs|Ms|Mx|Miss|Master|Dr|Baby)\s+/, "");
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** Accepts 22/11/1971, 22-11-1971, 1971-11-22, "22 November 1971", "22nd of November 1971". */
export function parseDob(text: string): string | null {
  const t = text.toLowerCase();
  const iso = t.match(/\b(19|20)(\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}${iso[2]}-${iso[3]}-${iso[4]}`;
  const dmy = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-]((?:19|20)\d{2})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const words = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s*,?\s+((?:19|20)\d{2})\b/);
  if (words) {
    const m = MONTHS.findIndex((x) => x.startsWith(words[2].slice(0, 3)));
    if (m >= 0) return `${words[3]}-${String(m + 1).padStart(2, "0")}-${words[1].padStart(2, "0")}`;
  }
  return null;
}

export type IdentityResult =
  | { kind: "matched"; patient: DeskPatient }
  | { kind: "need_more"; missing: ("name" | "dob")[] }
  | { kind: "no_match" };

export function identifyPatient(text: string): IdentityResult {
  const t = text.toLowerCase();
  const dob = parseDob(t);
  const everyone = allPatients();
  const byName = everyone.filter((p) => {
    const parts = displayName(p).toLowerCase().split(/\s+/);
    const first = parts[0] ?? "";
    const last = parts[parts.length - 1] ?? "";
    return t.includes(first) && t.includes(last);
  });
  if (!dob && !byName.length) return { kind: "need_more", missing: ["name", "dob"] };
  if (!dob) return { kind: "need_more", missing: ["dob"] };
  if (!byName.length) {
    // DOB given but no recognisable name in this utterance.
    return everyone.some((p) => p.dob === dob) ? { kind: "need_more", missing: ["name"] } : { kind: "no_match" };
  }
  const match = byName.filter((p) => p.dob === dob);
  return match.length === 1 ? { kind: "matched", patient: match[0]! } : { kind: "no_match" };
}
