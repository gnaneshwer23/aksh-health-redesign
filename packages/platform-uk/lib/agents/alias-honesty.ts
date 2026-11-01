/**
 * Milestone C5 — product alias honesty (VOICE ≠ VOICE CARE; ORACLE→HORIZON, etc.).
 * Keeps evaluators from conflating legacy API ids with product-facing labels.
 */

import { VOICE_CARE_PRODUCT_LABEL } from "../voice-care";

/** Canonical rename map (DEC-008). Legacy ids stay in code/APIs only. */
export const PRODUCT_ALIAS_MAP = [
  {
    legacyId: "ORACLE",
    productLabel: "HORIZON",
    kind: "rename" as const,
    note: "Predictive risk drafts — product label HORIZON; ENABLE_LLM_ORACLE / ORACLE slots remain aliases.",
  },
  {
    legacyId: "EQUITY",
    productLabel: "COMPASS",
    kind: "rename" as const,
    note: "Population / ICS aggregate briefs — product label COMPASS; /api/agents/equity is an alias of /api/agents/compass.",
  },
  {
    legacyId: "REFERRAL",
    productLabel: "PATHWAY",
    kind: "rename" as const,
    note: "Care-coordination referral drafts — product label PATHWAY; referral route remains the alias path.",
  },
] as const;

export const VOICE_ALIAS_HONESTY = {
  voice: {
    label: "VOICE",
    kind: "sub_capability" as const,
    under: "CANVAS",
    meaning: "Dictation / transcript intake feeding CANVAS — not a 12-agent directory peer.",
    not: "VOICE CARE outbound escalation",
  },
  voiceCare: {
    label: "VOICE CARE",
    kind: "adjacent_sim" as const,
    under: null,
    meaning: VOICE_CARE_PRODUCT_LABEL,
    not: "VOICE dictation / CANVAS intake",
    telephony: false as const,
    channel: "synthetic_outbound" as const,
  },
} as const;

export const ALIAS_HONESTY_LINES = [
  "VOICE = CANVAS dictation sub-capability. VOICE CARE = synthetic Day-3 outbound escalation (no telephony) — not the same product.",
  "ORACLE → HORIZON, EQUITY → COMPASS, REFERRAL → PATHWAY are label renames; legacy ids remain API/env aliases only.",
  "Product UI should prefer canonical labels; never present legacy ids as if they were separate live agents.",
] as const;

export type AliasHonestyRow = {
  productLabel: string;
  legacyOrAdjacent: string;
  kind: "rename" | "sub_capability" | "adjacent_sim";
  note: string;
};

export function listAliasHonestyRows(): AliasHonestyRow[] {
  return [
    {
      productLabel: VOICE_ALIAS_HONESTY.voice.label,
      legacyOrAdjacent: "sub-capability of CANVAS",
      kind: "sub_capability",
      note: VOICE_ALIAS_HONESTY.voice.meaning,
    },
    {
      productLabel: VOICE_ALIAS_HONESTY.voiceCare.label,
      legacyOrAdjacent: "adjacent sim (not directory)",
      kind: "adjacent_sim",
      note: `${VOICE_ALIAS_HONESTY.voiceCare.meaning} · ≠ ${VOICE_ALIAS_HONESTY.voiceCare.not}`,
    },
    ...PRODUCT_ALIAS_MAP.map((row) => ({
      productLabel: row.productLabel,
      legacyOrAdjacent: row.legacyId,
      kind: row.kind,
      note: row.note,
    })),
  ];
}

/** Prefer product-facing label when a legacy id is shown in UI copy. */
export function productFacingAliasLabel(id: string): string {
  const upper = id.trim().toUpperCase();
  if (upper === "VOICE CARE" || upper === "VOICE_CARE") return "VOICE CARE";
  if (upper === "DR.ASSIST" || upper === "DR_ASSIST" || upper === "DRASSIST") return "Dr.Assist";
  for (const row of PRODUCT_ALIAS_MAP) {
    if (row.legacyId === upper || row.productLabel === upper) return row.productLabel;
  }
  return id;
}
