/**
 * Patient CSV import: a small RFC 4180 parser (quoted fields, embedded commas/quotes/newlines) and a mapping from
 * spreadsheet columns to the import schema. Validation happens server-side with the same schema the import uses.
 */
export const PATIENT_CSV_COLUMNS = [
  "record_number",
  "given_name",
  "family_name",
  "date_of_birth",
  "sex",
  "diabetes_type",
  "email",
  "phone",
  "preferred_channel",
  "latest_hba1c_mmol_mol",
  "hba1c_date",
  "egfr",
  "urine_acr_mg_mmol",
  "creatinine_umol_l",
  "ldl_mmol_l",
  "total_cholesterol_mmol_l",
  "hdl_mmol_l",
  "triglycerides_mmol_l",
  "alt_u_l",
  "labs_date",
] as const;

/**
 * Latest laboratory results, one column per result, in the unit named in the column (lib/labs/catalog.ts converts and
 * range-checks them). labs_date is the date of these results; a result without a date is refused, not guessed.
 */
export const LAB_CSV_COLUMNS: { column: (typeof PATIENT_CSV_COLUMNS)[number]; kind: string; unit: string }[] = [
  { column: "egfr", kind: "egfr", unit: "mL/min/{1.73_m2}" },
  { column: "urine_acr_mg_mmol", kind: "acr", unit: "mg/mmol" },
  { column: "creatinine_umol_l", kind: "creatinine", unit: "umol/L" },
  { column: "ldl_mmol_l", kind: "ldl", unit: "mmol/L" },
  { column: "total_cholesterol_mmol_l", kind: "total_cholesterol", unit: "mmol/L" },
  { column: "hdl_mmol_l", kind: "hdl", unit: "mmol/L" },
  { column: "triglycerides_mmol_l", kind: "triglycerides", unit: "mmol/L" },
  { column: "alt_u_l", kind: "alt", unit: "U/L" },
];

export const PATIENT_CSV_TEMPLATE =
  PATIENT_CSV_COLUMNS.join(",") + "\n" + "MRN-0001,Amara,Okoye,1968-03-14,female,type_2,amara@example.com,+00 0000 000000,sms,62,2026-09-20,58,4.2,110,2.9,4.8,1.1,1.9,32,2026-09-20\n";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Map CSV rows (with a header row) to import payloads. Unknown columns are ignored; blanks become undefined. */
export function csvToPatients(text: string): { patients: Record<string, unknown>[]; missingColumns: string[] } {
  const [header, ...body] = parseCsv(text);
  if (!header) return { patients: [], missingColumns: ["record_number", "given_name", "family_name", "date_of_birth"] };
  const idx = new Map(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const required = ["record_number", "given_name", "family_name", "date_of_birth"];
  const missingColumns = required.filter((c) => !idx.has(c));
  const get = (r: string[], c: string) => {
    const i = idx.get(c);
    const v = i === undefined ? "" : (r[i] ?? "").trim();
    return v === "" ? undefined : v;
  };
  const patients = body.map((r) => {
    const sex = get(r, "sex")?.toLowerCase();
    const type = get(r, "diabetes_type")?.toLowerCase().replace(/\s+/g, "_");
    // HbA1c in mmol/mol (IFCC), or in % (NGSP/DCCT) via the optional latest_hba1c_percent column, stored as mmol/mol.
    const pct = get(r, "latest_hba1c_percent");
    const hba1c = get(r, "latest_hba1c_mmol_mol") ?? (pct && Number.isFinite(Number(pct)) ? String(Math.round((Number(pct) - 2.15) * 10.929)) : pct);
    const hba1cDate = get(r, "hba1c_date");
    const email = get(r, "email");
    const phone = get(r, "phone");
    const channel = get(r, "preferred_channel");
    const labsDate = get(r, "labs_date") ?? "";
    const labs = LAB_CSV_COLUMNS.flatMap(({ column, kind, unit }) => {
      const v = get(r, column);
      return v === undefined ? [] : [{ kind, value: Number(v), unit, observedAt: labsDate, source: "lab" }];
    });
    return {
      recordRef: get(r, "record_number"),
      givenName: get(r, "given_name"),
      familyName: get(r, "family_name"),
      dateOfBirth: get(r, "date_of_birth"),
      // Values pass through as written; the server schema reports anything outside the allowed set.
      ...(sex ? { sex } : {}),
      ...(type ? { diabetesType: type } : {}),
      ...(email || phone || channel ? { contact: { ...(email ? { email } : {}), ...(phone ? { phone } : {}), ...(channel ? { preferredChannel: channel } : {}) } } : {}),
      ...(hba1c || labs.length
        ? {
            observations: [
              ...(hba1c ? [{ kind: "hba1c", value: Number(hba1c), unit: "mmol/mol", observedAt: hba1cDate ?? "", source: "lab" }] : []),
              ...labs,
            ],
          }
        : {}),
    };
  });
  return { patients, missingColumns };
}
