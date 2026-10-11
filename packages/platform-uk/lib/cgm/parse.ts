/**
 * Read CGM exports without assuming one fixed layout. Vendors change headers between versions, regions and patient/
 * provider exports, so we find the header row and the columns by name, detect the unit from the header, read local
 * timestamps in the clinic's time zone, and report anything ambiguous instead of guessing. Pure.
 *
 * Recognised: Dexcom Clarity (Timestamp, Event Type, "Glucose Value (mg/dL|mmol/L)"; "Low"/"High" outside the device
 * range), LibreView ("Device Timestamp", "Record Type" 0 = historic, "Historic Glucose mg/dL|mmol/L"), and a generic
 * "timestamp,glucose,unit" CSV. Always previewed before anything is saved.
 */
import { parseCsv } from "../network/csv";

export type CgmFormat = "dexcom_clarity" | "libreview" | "generic";
export type DateOrder = "iso" | "dmy" | "mdy";
export type ParsedRow = { at: string; mmol: number; censored?: "below_range" | "above_range" };
export type ParseResult = {
  ok: boolean;
  format: CgmFormat | null;
  unit: "mmol/L" | "mg/dL" | null;
  dateOrder: DateOrder | "ambiguous" | null;
  rows: ParsedRow[];
  rowsRead: number;
  rejected: { line: number; reason: string }[];
  problem?: string;
};

const MGDL_PER_MMOL = 18.0182;
// Device reporting range (40–400 mg/dL); values shown as Low/High are recorded at the edge and marked as censored.
const LOW_MMOL = 2.2;
const HIGH_MMOL = 22.2;

const norm = (s: string) => s.trim().toLowerCase();

function findHeader(rows: string[][]) {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const h = rows[i]!.map(norm);
    const ts = h.findIndex((c) => c.includes("timestamp") || c === "time" || c === "datetime");
    const glucose = h.findIndex((c) => c.includes("glucose") && !c.includes("rate of change") && !c.includes("scan") && !c.includes("strip"));
    if (ts >= 0 && glucose >= 0) return { index: i, header: h, ts, glucose };
  }
  return null;
}

function unitFrom(header: string): "mmol/L" | "mg/dL" | null {
  if (/mmol/.test(header)) return "mmol/L";
  if (/mg\/?dl/.test(header)) return "mg/dL";
  return null;
}

type Local = { y: number; mo: number; d: number; h: number; mi: number; s: number; offsetMin?: number };

function parseTimestamp(raw: string, order: DateOrder): Local | null {
  const t = raw.trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const off = m[7] ? (m[7] === "Z" ? 0 : (m[7][0] === "-" ? -1 : 1) * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(-2)))) : undefined;
    return { y: +m[1]!, mo: +m[2]!, d: +m[3]!, h: +m[4]!, mi: +m[5]!, s: +(m[6] ?? 0), offsetMin: off };
  }
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!m || order === "iso") return null;
  let h = +m[4]!;
  if (m[7]) h = (h % 12) + (/pm/i.test(m[7]) ? 12 : 0);
  const [a, b] = [+m[1]!, +m[2]!];
  return order === "dmy" ? { y: +m[3]!, mo: b, d: a, h, mi: +m[5]!, s: +(m[6] ?? 0) } : { y: +m[3]!, mo: a, d: b, h, mi: +m[5]!, s: +(m[6] ?? 0) };
}

/** Which day/month order the file uses: decided by any value above 12; otherwise ambiguous. */
export function detectDateOrder(samples: string[]): DateOrder | "ambiguous" {
  if (samples.every((s) => /^\d{4}-\d{2}-\d{2}/.test(s.trim()))) return "iso";
  let dmy = false;
  let mdy = false;
  for (const s of samples) {
    const m = s.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{4}/);
    if (!m) continue;
    if (+m[1]! > 12) dmy = true;
    if (+m[2]! > 12) mdy = true;
  }
  if (dmy && !mdy) return "dmy";
  if (mdy && !dmy) return "mdy";
  return "ambiguous";
}

/** Wall-clock time in a time zone → the exact instant (handles daylight saving by iterating on the zone offset). */
export function zonedToInstant(l: Local, timeZone: string): Date | null {
  if (l.mo < 1 || l.mo > 12 || l.d < 1 || l.d > 31 || l.h > 23 || l.mi > 59 || l.s > 59) return null;
  const asUtc = Date.UTC(l.y, l.mo - 1, l.d, l.h, l.mi, l.s);
  if (new Date(asUtc).getUTCDate() !== l.d) return null; // 31 April etc.
  if (l.offsetMin !== undefined) return new Date(asUtc - l.offsetMin * 60_000);
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const offsetAt = (instant: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(instant)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!) - instant;
  };
  let guess = asUtc - offsetAt(asUtc);
  guess = asUtc - offsetAt(guess);
  return new Date(guess);
}

export function parseCgmExport(text: string, timeZone: string, chosenOrder?: DateOrder): ParseResult {
  const empty = (problem: string): ParseResult => ({ ok: false, format: null, unit: null, dateOrder: null, rows: [], rowsRead: 0, rejected: [], problem });
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    return empty("Unknown time zone. Set it in Organisation → Settings.");
  }
  const table = parseCsv(text.replace(/^﻿/, "")).filter((r) => r.some((c) => c.trim() !== ""));
  const found = findHeader(table);
  if (!found) return empty("Could not find a timestamp column and a glucose column. Export the CGM data as CSV.");
  const { index, header, ts, glucose } = found;
  const eventType = header.findIndex((c) => c === "event type");
  const recordType = header.findIndex((c) => c === "record type");
  const unitCol = header.findIndex((c) => c === "unit" || c === "units");
  const format: CgmFormat = eventType >= 0 ? "dexcom_clarity" : recordType >= 0 ? "libreview" : "generic";
  const headerUnit = unitFrom(header[glucose]!);

  const data = table.slice(index + 1);
  const samples = data.slice(0, 2000).map((r) => r[ts] ?? "").filter(Boolean);
  const detected = detectDateOrder(samples);
  const dateOrder = chosenOrder ?? detected;
  if (dateOrder === "ambiguous") {
    return { ok: false, format, unit: headerUnit, dateOrder: "ambiguous", rows: [], rowsRead: data.length, rejected: [], problem: "Dates could be day/month or month/day. Choose the order used in this file." };
  }

  const rows: ParsedRow[] = [];
  const rejected: { line: number; reason: string }[] = [];
  let unit = headerUnit;
  data.forEach((r, i) => {
    const line = index + i + 2;
    if (format === "dexcom_clarity") {
      const ev = norm(r[eventType] ?? "");
      if (ev && ev !== "egv") return; // alerts, calibrations, insulin, carbs: not glucose readings
    }
    if (format === "libreview" && (r[recordType] ?? "").trim() !== "0") return; // 0 = historic; scans would double count
    const rawValue = (r[glucose] ?? "").trim();
    if (!rawValue) return;
    const rowUnit = unit ?? (unitCol >= 0 ? unitFrom(norm(r[unitCol] ?? "")) : null);
    if (!rowUnit) {
      rejected.push({ line, reason: "No unit (mmol/L or mg/dL) in the header or a unit column" });
      return;
    }
    unit ??= rowUnit;
    const local = parseTimestamp(r[ts] ?? "", dateOrder);
    const instant = local ? zonedToInstant(local, timeZone) : null;
    if (!instant) {
      rejected.push({ line, reason: `Unreadable time "${(r[ts] ?? "").slice(0, 30)}"` });
      return;
    }
    let mmol: number;
    let censored: ParsedRow["censored"];
    if (/^low$/i.test(rawValue)) [mmol, censored] = [LOW_MMOL, "below_range"];
    else if (/^high$/i.test(rawValue)) [mmol, censored] = [HIGH_MMOL, "above_range"];
    else {
      const v = Number(rawValue.replace(",", "."));
      if (!Number.isFinite(v)) {
        rejected.push({ line, reason: `Unreadable glucose "${rawValue.slice(0, 20)}"` });
        return;
      }
      mmol = rowUnit === "mg/dL" ? v / MGDL_PER_MMOL : v;
    }
    if (!(mmol >= 1 && mmol <= 40)) {
      rejected.push({ line, reason: "Glucose outside 1–40 mmol/L" });
      return;
    }
    rows.push({ at: instant.toISOString(), mmol: Math.round(mmol * 10) / 10, ...(censored ? { censored } : {}) });
  });
  rows.sort((a, b) => a.at.localeCompare(b.at));
  if (!rows.length) return { ok: false, format, unit, dateOrder, rows, rowsRead: data.length, rejected, problem: "No glucose readings found in this file." };
  return { ok: true, format, unit, dateOrder, rows, rowsRead: data.length, rejected };
}
