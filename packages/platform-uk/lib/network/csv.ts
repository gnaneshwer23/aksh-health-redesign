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
] as const;

export const PATIENT_CSV_TEMPLATE =
  PATIENT_CSV_COLUMNS.join(",") + "\n" + "MRN-0001,Amara,Okoye,1968-03-14,female,type_2,amara@example.com,+00 0000 000000,sms,62,2026-09-20\n";

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
    const hba1c = get(r, "latest_hba1c_mmol_mol");
    const hba1cDate = get(r, "hba1c_date");
    const email = get(r, "email");
    const phone = get(r, "phone");
    const channel = get(r, "preferred_channel");
    return {
      recordRef: get(r, "record_number"),
      givenName: get(r, "given_name"),
      familyName: get(r, "family_name"),
      dateOfBirth: get(r, "date_of_birth"),
      // Values pass through as written; the server schema reports anything outside the allowed set.
      ...(sex ? { sex } : {}),
      ...(type ? { diabetesType: type } : {}),
      ...(email || phone || channel ? { contact: { ...(email ? { email } : {}), ...(phone ? { phone } : {}), ...(channel ? { preferredChannel: channel } : {}) } } : {}),
      ...(hba1c
        ? { observations: [{ kind: "hba1c", value: Number(hba1c), unit: "mmol/mol", observedAt: hba1cDate ?? "", source: "lab" }] }
        : {}),
    };
  });
  return { patients, missingColumns };
}
