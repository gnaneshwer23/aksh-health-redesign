/**
 * Care-network reads. Every query runs under row-level security (withTenant), so the database decides which
 * organisations, members and patients the caller can see. Risk and care gaps are derived from stored data with
 * the shared rules in derive.ts.
 */
import type { PoolClient } from "pg";

import { LAB_CATALOG, type LabKind } from "../labs/catalog";
import { observationProvenance, type Provenance } from "../provenance";
import { ageOn, deriveCareGaps, deriveRisk } from "./derive";
import { withTenant, type NetworkContext } from "./db";

export const TYPE_LABEL: Record<string, string> = {
  type_2: "Type 2",
  type_1: "Type 1",
  prediabetes: "Prediabetes",
  gestational: "Gestational",
  lada: "LADA",
  mody: "MODY",
};

/** Population summaries only: HbA1c ≤ 53 mmol/mol (7.0%). Individual targets are a clinician's decision. */
export const HBA1C_TARGET_MMOL = 53;

export const ROLE_LABEL: Record<string, string> = {
  gp: "Physician",
  nurse: "Nurse / educator",
  "clinical-pharmacist": "Pharmacist",
  "practice-manager": "Manager / admin",
  "ics-lead": "Population health lead",
  "hospital-executive": "Executive",
  researcher: "Researcher",
};

const mmolToPercent = (mmol: number) => Math.round((mmol / 10.929 + 2.15) * 10) / 10;

type FactRow = {
  id: string;
  organisation_id: string;
  record_ref: string | null;
  given_name: string;
  family_name: string;
  dob: string;
  sex: string | null;
  diabetes_type: string | null;
  diagnosed_on: string | null;
  conditions: string[];
  foot_risk: string | null;
  last_eye_screening: string | null;
  next_appointment: string | null;
  contact: Record<string, string>;
  org_name: string | null;
  org_kind: string | null;
  region: string | null;
  locale: Record<string, string> | null;
  hba1c: { value: number; observedAt: string }[] | null;
  egfr: number | null;
  acr: number | null;
  sbp: number | null;
  dbp: number | null;
  bmi: number | null;
  ldl: number | null;
  tir: number | null;
  tbr: number | null;
  hypos90: number;
  on_statin: boolean;
  app_user: boolean;
};

/**
 * Readings that count clinically: not entered in error, and patient-reported or device values only once verified
 * (device data from staff imports and device feeds is verified on entry; a patient's own export is not). Unverified patient readings are shown separately (review list), never folded into risk or care gaps.
 */
// Corrected lab results (041) keep the original row; a row that has been replaced no longer counts.
/** Laboratory results shown in the patient record; HbA1c has its own trend above the table. */
const LAB_TABLE_KINDS: LabKind[] = ["egfr", "acr", "creatinine", "ldl", "total_cholesterol", "hdl", "triglycerides", "alt", "glucose"];
/** Shown as "not on record" when absent: the checks every diabetes review needs. */
const EXPECTED_LABS: LabKind[] = ["egfr", "acr", "ldl"];

export type LabRow = {
  kind: LabKind;
  label: string;
  unit: string;
  latest: { value: number; observedAt: string; channel: string | null; code: string | null; corrected: boolean; asSent: string | null; provenance: Provenance } | null;
  history: { value: number; observedAt: string }[];
  change: number | null;
};

type LabDbRow = { kind: LabKind; value: number; observed_at: Date; channel: string | null; code: string | null; corrected: boolean; source: string; verified: boolean; original_value: number | null; original_unit: string | null };

function labTable(rows: LabDbRow[]): LabRow[] {
  const kinds = LAB_TABLE_KINDS.filter((k) => EXPECTED_LABS.includes(k) || rows.some((r) => r.kind === k));
  return kinds.map((kind) => {
    const series = rows.filter((r) => r.kind === kind);
    const last = series.at(-1);
    const prev = series.at(-2);
    const d = LAB_CATALOG[kind];
    return {
      kind,
      label: d.label,
      unit: d.displayUnit,
      latest: last
        ? {
            value: last.value,
            observedAt: last.observed_at.toISOString().slice(0, 10),
            channel: last.channel,
            code: last.code,
            corrected: last.corrected,
            provenance: observationProvenance(last),
            asSent: last.original_value !== null && last.original_unit && last.original_unit.toLowerCase() !== d.unit.toLowerCase() ? `${last.original_value} ${last.original_unit}` : null,
          }
        : null,
      history: series.slice(-6).map((r) => ({ value: r.value, observedAt: r.observed_at.toISOString().slice(0, 10) })),
      change: last && prev ? Math.round((last.value - prev.value) * 100) / 100 : null,
    };
  });
}

const COUNTS = `x.status = 'final' AND (x.source NOT IN ('patient_reported', 'device') OR x.verified) AND NOT EXISTS (SELECT 1 FROM aksh.network_observations c WHERE c.replaces_id = x.id)`;
const latestOf = (kind: string) =>
  `(SELECT value::float FROM aksh.network_observations x WHERE x.patient_id = p.id AND x.kind = '${kind}' AND ${COUNTS} ORDER BY observed_at DESC, recorded_at DESC LIMIT 1)`;

/** One row of derived facts per visible patient. `kind` values are fixed literals above, never user input. */
async function loadFacts(client: PoolClient, where = "TRUE", params: unknown[] = []): Promise<FactRow[]> {
  const { rows } = await client.query<FactRow>(
    `SELECT p.id, p.organisation_id, p.record_ref, p.given_name, p.family_name, to_char(p.date_of_birth, 'YYYY-MM-DD') AS dob,
            p.sex, p.diabetes_type, to_char(p.diagnosed_on, 'YYYY-MM-DD') AS diagnosed_on, p.conditions, p.foot_risk,
            to_char(p.last_eye_screening, 'YYYY-MM-DD') AS last_eye_screening, p.next_appointment::text, p.contact,
            o.name AS org_name, o.kind AS org_kind, o.region, o.locale,
            (SELECT json_agg(json_build_object('value', value::float, 'observedAt', observed_at) ORDER BY observed_at)
               FROM aksh.network_observations x WHERE x.patient_id = p.id AND x.kind = 'hba1c' AND ${COUNTS}) AS hba1c,
            ${latestOf("egfr")} AS egfr, ${latestOf("acr")} AS acr, ${latestOf("systolic_bp")} AS sbp,
            ${latestOf("diastolic_bp")} AS dbp, ${latestOf("bmi")} AS bmi, ${latestOf("ldl")} AS ldl,
            ${latestOf("cgm_time_in_range")} AS tir, ${latestOf("cgm_time_below_range")} AS tbr,
            (SELECT count(*)::int FROM aksh.network_observations x WHERE x.patient_id = p.id AND x.kind = 'hypo_event'
               AND x.observed_at > NOW() - INTERVAL '90 days' AND ${COUNTS}) AS hypos90,
            EXISTS (SELECT 1 FROM aksh.network_medications m WHERE m.patient_id = p.id AND m.ended_on IS NULL AND m.drug_class ILIKE 'statin%') AS on_statin,
            EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = p.id) AS app_user
     FROM aksh.network_patients p
     -- Only the fields the caller may see: members see their organisation; a patient sees name and public locale.
     LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE
     WHERE ${where}`,
    params
  );
  return rows;
}

function derived(f: FactRow, asOf = new Date()) {
  const age = ageOn(f.dob, asOf);
  const series = f.hba1c ?? [];
  const last = series[series.length - 1] ?? null;
  const input = {
    asOf,
    diabetesType: f.diabetes_type,
    age,
    conditions: f.conditions ?? [],
    footRisk: f.foot_risk,
    lastEyeScreening: f.last_eye_screening,
    latestHba1c: last ? { value: last.value, observedAt: last.observedAt } : null,
    egfr: f.egfr,
    uacr: f.acr,
    systolicBp: f.sbp,
    hypos90d: f.hypos90,
    usesCgm: f.tir !== null,
    onStatin: f.on_statin,
  };
  return { age, last, risk: deriveRisk(input), gaps: deriveCareGaps(input) };
}

const hba1cPoint = (h: { value: number; observedAt: string }) => ({
  date: String(h.observedAt).slice(0, 10),
  hba1cMmolMol: Math.round(h.value),
  hba1cPercent: mmolToPercent(h.value),
});

const count = <T,>(xs: T[], f: (x: T) => string) =>
  xs.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});

export async function networkSummary(ctx: NetworkContext, region?: string) {
  return withTenant(ctx, async (client) => {
    const orgs = (await client.query<{ id: string; kind: string; region: string | null; hba1c_unit: string | null }>(`SELECT id, kind, region, locale->>'hba1cUnit' AS hba1c_unit FROM aksh.organisations`)).rows;
    // Show figures in the caller's own organisation's unit (first membership), mmol/mol if none was chosen.
    const ownUnit = (orgs.find((o) => ctx.orgIds.includes(o.id) && o.hba1c_unit)?.hba1c_unit ?? "mmol/mol") as "mmol/mol" | "%";
    const members = (await client.query<{ role: string; organisation_id: string }>(`SELECT role, organisation_id FROM aksh.memberships WHERE status = 'active'`)).rows;
    const facts = await loadFacts(client);
    const inRegion = (r: string | null) => !region || r === region;
    const orgRegion = new Map(orgs.map((o) => [o.id, o.region]));
    const pts = facts.filter((f) => inRegion(f.region));
    const rows = pts.map((f) => ({ f, d: derived(f) }));
    const withDiabetes = rows.filter((r) => r.f.diabetes_type !== "prediabetes" && r.d.last);
    const atTarget = withDiabetes.filter((r) => r.d.last!.value <= HBA1C_TARGET_MMOL).length;
    const cgm = pts.filter((f) => f.tir !== null);
    const regions = [...new Set(orgs.map((o) => o.region).filter(Boolean) as string[])].sort();
    return {
      region: region ?? null,
      regions: regions.map((r) => ({
        name: r,
        patients: facts.filter((f) => f.region === r).length,
        professionals: members.filter((m) => orgRegion.get(m.organisation_id) === r).length,
        organisations: orgs.filter((o) => o.region === r).length,
      })),
      totals: {
        patients: pts.length,
        professionals: members.filter((m) => inRegion(orgRegion.get(m.organisation_id) ?? null)).length,
        organisations: orgs.filter((o) => inRegion(o.region)).length,
      },
      byType: count(pts, (f) => TYPE_LABEL[f.diabetes_type ?? ""] ?? "Not recorded"),
      byRisk: count(rows, (r) => r.d.risk.band),
      byOrgKind: count(orgs.filter((o) => inRegion(o.region)), (o) => o.kind),
      byRole: count(members, (m) => ROLE_LABEL[m.role] ?? m.role),
      glycaemia: {
        hba1cUnit: ownUnit,
        meanHba1cMmolMol: withDiabetes.length ? Math.round(withDiabetes.reduce((n, r) => n + r.d.last!.value, 0) / withDiabetes.length) : 0,
        atTargetPct: withDiabetes.length ? Math.round((atTarget / withDiabetes.length) * 100) : 0,
        cgmUsers: cgm.length,
        meanTimeInRangePct: cgm.length ? Math.round(cgm.reduce((n, f) => n + (f.tir ?? 0), 0) / cgm.length) : 0,
      },
      careGaps: Object.entries(count(rows.flatMap((r) => r.d.gaps), (g) => g))
        .sort((a, b) => b[1] - a[1])
        .map(([gap, n]) => ({ gap, patients: n })),
      engagement: {
        appUsers: pts.filter((f) => f.app_user).length,
        byContactPreference: count(pts, (f) => f.contact?.preferredChannel ?? "not set"),
      },
    };
  });
}

export type PatientFilter = { region?: string; type?: string; band?: string; gap?: string; q?: string; orgId?: string; page?: number; pageSize?: number };

export async function listPatients(ctx: NetworkContext, filter: PatientFilter) {
  return withTenant(ctx, async (client) => {
    const facts = await loadFacts(client);
    const q = filter.q?.trim().toLowerCase();
    let rows = facts
      .map((f) => ({ f, d: derived(f) }))
      .filter(
        ({ f, d }) =>
          (!filter.region || f.region === filter.region) &&
          (!filter.type || f.diabetes_type === filter.type) &&
          (!filter.band || d.risk.band === filter.band) &&
          (!filter.gap || d.gaps.includes(filter.gap)) &&
          (!filter.orgId || f.organisation_id === filter.orgId) &&
          (!q || `${f.given_name} ${f.family_name} ${f.record_ref ?? ""}`.toLowerCase().includes(q))
      );
    rows = rows.sort((a, b) => b.d.risk.score - a.d.risk.score);
    const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? 25));
    const page = Math.max(1, filter.page ?? 1);
    return {
      total: rows.length,
      page,
      pageSize,
      rows: rows.slice((page - 1) * pageSize, page * pageSize).map(({ f, d }) => ({
        id: f.id,
        recordRef: f.record_ref,
        name: `${f.given_name} ${f.family_name}`,
        age: d.age,
        sex: f.sex,
        organisation: f.org_name,
        region: f.region,
        type: TYPE_LABEL[f.diabetes_type ?? ""] ?? "Not recorded",
        hba1c: d.last ? hba1cPoint(d.last) : null,
        unit: (f.locale?.hba1cUnit as "mmol/mol" | "%" | undefined) ?? "mmol/mol",
        risk: d.risk,
        gaps: d.gaps,
        cgm: f.tir,
        nextAppointment: f.next_appointment,
      })),
    };
  });
}

export async function getPatientDetail(ctx: NetworkContext, id: string) {
  return withTenant(ctx, async (client) => {
    const facts = await loadFacts(client, "p.id = $1", [id]);
    const f = facts[0];
    if (!f) return null;
    const d = derived(f);
    const meds = await client.query<{ name: string; drug_class: string | null; dose: string | null; started_on: string | null }>(
      `SELECT name, drug_class, dose, to_char(started_on, 'YYYY-MM-DD') AS started_on FROM aksh.network_medications
       WHERE patient_id = $1 AND ended_on IS NULL ORDER BY name`,
      [id]
    );
    const team = await client.query<{ care_role: string; display_name: string; role: string; organisation_id: string }>(
      `SELECT ct.care_role, m.display_name, m.role, m.organisation_id FROM aksh.care_team_members ct
       LEFT JOIN aksh.memberships m ON m.id = ct.membership_id WHERE ct.patient_id = $1 AND ct.ended_at IS NULL ORDER BY ct.added_at`,
      [id]
    );
    // Laboratory results: trusted, corrections applied, newest last per kind (lib/labs/catalog.ts).
    const labRows = (await client.query<LabDbRow>(
      `SELECT x.kind, x.value::float AS value, x.observed_at, x.channel, x.code, (x.replaces_id IS NOT NULL) AS corrected, x.source, x.verified,
              x.original_value::float AS original_value, x.original_unit
         FROM aksh.network_observations x
        WHERE x.patient_id = $1 AND x.kind = ANY($2) AND (x.kind <> 'glucose' OR x.source = 'lab') AND ${COUNTS}
        ORDER BY x.observed_at, x.recorded_at`,
      [id, LAB_TABLE_KINDS]
    )).rows;
    const consents = await client.query<{ grantee_organisation_id: string; purpose: string; status: string; recorded_at: string }>(
      `SELECT DISTINCT ON (grantee_organisation_id, purpose) grantee_organisation_id, purpose, status, recorded_at::text
       FROM aksh.consent_records WHERE patient_id = $1 ORDER BY grantee_organisation_id, purpose, recorded_at DESC`,
      [id]
    );
    return {
      id: f.id,
      recordRef: f.record_ref,
      name: `${f.given_name} ${f.family_name}`,
      age: d.age,
      sex: f.sex,
      typeLabel: TYPE_LABEL[f.diabetes_type ?? ""] ?? "Not recorded",
      diagnosedOn: f.diagnosed_on,
      organisation: f.org_name,
      region: f.region,
      unit: (f.locale?.hba1cUnit as "mmol/mol" | "%" | undefined) ?? "mmol/mol",
      contact: { preferredChannel: f.contact?.preferredChannel ?? null, language: f.contact?.language ?? null },
      hba1c: (f.hba1c ?? []).map(hba1cPoint),
      risk: d.risk,
      openCareGaps: d.gaps,
      vitals: { systolic: f.sbp, diastolic: f.dbp, bmi: f.bmi, egfr: f.egfr, acr: f.acr, ldl: f.ldl, hypos90d: f.hypos90, footRisk: f.foot_risk },
      cgm: f.tir !== null ? { timeInRangePct: f.tir, timeBelowRangePct: f.tbr } : null,
      labs: labTable(labRows),
      conditions: f.conditions ?? [],
      medications: meds.rows.map((m) => ({ name: m.name, class: m.drug_class, dose: m.dose, since: m.started_on })),
      careTeam: team.rows.map((t) => ({
        careRole: t.care_role,
        // A member from another organisation is only named if their organisation is visible to the caller.
        name: t.display_name ?? "Care team member (other organisation)",
        roleLabel: ROLE_LABEL[t.role] ?? t.role ?? null,
        sameOrganisation: t.organisation_id === f.organisation_id,
      })),
      consents: consents.rows,
      appLinked: f.app_user,
      nextAppointment: f.next_appointment,
      emergencyNumber: f.locale?.emergencyNumber ?? null,
    };
  });
}

export async function listProfessionals(ctx: NetworkContext, filter: { role?: string; region?: string }) {
  return withTenant(ctx, async (client) => {
    const { rows } = await client.query<{
      id: string; display_name: string; role: string; professional_title: string | null; organisation: string; region: string | null;
      registration_status: string; is_admin: boolean; caseload: number;
    }>(
      `SELECT m.id, m.display_name, m.role, m.professional_title, o.name AS organisation, o.region, m.registration_status, m.is_admin,
              (SELECT count(*)::int FROM aksh.care_team_members ct WHERE ct.membership_id = m.id AND ct.ended_at IS NULL) AS caseload
       FROM aksh.memberships m JOIN aksh.organisations o ON o.id = m.organisation_id
       WHERE m.status = 'active' AND ($1::text IS NULL OR m.role = $1) AND ($2::text IS NULL OR o.region = $2)
       ORDER BY o.name, m.display_name`,
      [filter.role ?? null, filter.region ?? null]
    );
    return rows.map((r) => ({ ...r, roleLabel: r.professional_title ?? ROLE_LABEL[r.role] ?? r.role }));
  });
}

export async function listOrganisations(ctx: NetworkContext, filter: { region?: string }) {
  return withTenant(ctx, async (client) => {
    const { rows } = await client.query<{ id: string; name: string; kind: string; status: string; region: string | null; professionals: number; patients: number }>(
      `SELECT o.id, o.name, o.kind, o.status, o.region,
              (SELECT count(*)::int FROM aksh.memberships m WHERE m.organisation_id = o.id AND m.status = 'active') AS professionals,
              (SELECT count(*)::int FROM aksh.network_patients p WHERE p.organisation_id = o.id) AS patients
       FROM aksh.organisations o WHERE ($1::text IS NULL OR o.region = $1) ORDER BY o.kind, o.name`,
      [filter.region ?? null]
    );
    return rows;
  });
}

/** The signed-in patient's own record (self scope via patient_accounts). */
export async function getOwnRecord(ctx: NetworkContext) {
  const id = ctx.patientIds[0];
  return id ? getPatientDetail(ctx, id) : null;
}
