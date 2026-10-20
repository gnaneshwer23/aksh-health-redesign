/**
 * The latest trusted laboratory result of each kind for one patient: what the clinical agents read. Values are in the
 * stored units of lib/labs/catalog.ts. Pure types and helpers; loading lives with the caller (patient spine, record).
 */
import type { Provenance } from "../provenance";

import type { LabKind } from "./catalog";

export type LabResult = {
  kind: LabKind;
  value: number;
  unit: string;
  observedAt: string;
  /** How it reached Aksh: connector, manual, csv_import (null for rows recorded before 20 Oct 2026). */
  channel: string | null;
  /** LOINC code when the source sent one. */
  code: string | null;
  /** True when this value replaced an earlier result (a laboratory correction). */
  corrected: boolean;
  /** What kind of value this is (lib/provenance.ts). Laboratory results are "observed". */
  provenance?: Provenance;
};

export type LabSnapshot = Partial<Record<LabKind, LabResult>>;

/** Months since the result, for "out of date" checks. */
export function monthsSince(observedAt: string, now = new Date()): number {
  return (now.getTime() - Date.parse(observedAt)) / (30.44 * 86_400_000);
}

/** One line for evidence lists: "eGFR 52 mL/min/{1.73_m2} on 2026-10-01 (connector, LOINC 33914-3)". */
export function describeLab(label: string, r: LabResult): string {
  const source = [r.channel, r.code ? `LOINC ${r.code}` : null, r.corrected ? "corrected" : null].filter(Boolean).join(", ");
  return `${label} ${r.value} ${r.unit} on ${r.observedAt.slice(0, 10)}${source ? ` (${source})` : ""}`;
}
