import { MARKET_BY_CODE } from "./catalog";
import { getSyntheticWorld } from "./generate";
import type { DiabetesType, MarketCode, OrgKind, WorldPatient } from "./types";

export const TYPE_LABEL: Record<DiabetesType, string> = {
  type_2: "Type 2",
  type_1: "Type 1",
  prediabetes: "Prediabetes",
  gestational: "Gestational",
  lada: "LADA",
  mody: "MODY",
};

/** "At target" for summaries only: HbA1c ≤ 53 mmol/mol (7.0%). Individual targets are a clinician's call. */
export const HBA1C_TARGET_MMOL = 53;

const latest = (p: WorldPatient) => p.hba1c[p.hba1c.length - 1]!;

export function networkSummary(market?: MarketCode) {
  const w = getSyntheticWorld();
  const pts = market ? w.patients.filter((p) => p.market === market) : w.patients;
  const pros = market ? w.professionals.filter((p) => p.market === market) : w.professionals;
  const orgs = market ? w.organisations.filter((o) => o.market === market) : w.organisations;
  const count = <T,>(xs: T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
  const withDiabetes = pts.filter((p) => p.diabetesType !== "prediabetes");
  const atTarget = withDiabetes.filter((p) => latest(p).hba1cMmolMol <= HBA1C_TARGET_MMOL).length;
  const mean = withDiabetes.length ? Math.round(withDiabetes.reduce((n, p) => n + latest(p).hba1cMmolMol, 0) / withDiabetes.length) : 0;
  const cgm = pts.filter((p) => p.cgm);
  return {
    market: market ?? null,
    markets: w.markets.map((m) => ({
      ...m,
      patients: w.patients.filter((p) => p.market === m.code).length,
      professionals: w.professionals.filter((p) => p.market === m.code).length,
      organisations: w.organisations.filter((o) => o.market === m.code).length,
    })),
    totals: { patients: pts.length, professionals: pros.length, organisations: orgs.length },
    byType: count(pts, (p) => TYPE_LABEL[p.diabetesType]),
    byRisk: count(pts, (p) => p.risk.band),
    byOrgKind: count(orgs, (o) => o.kind),
    byRole: count(pros, (p) => p.roleLabel),
    glycaemia: {
      meanHba1cMmolMol: mean,
      atTargetPct: withDiabetes.length ? Math.round((atTarget / withDiabetes.length) * 100) : 0,
      cgmUsers: cgm.length,
      meanTimeInRangePct: cgm.length ? Math.round(cgm.reduce((n, p) => n + p.cgm!.timeInRangePct, 0) / cgm.length) : 0,
    },
    careGaps: Object.entries(count(pts.flatMap((p) => p.openCareGaps), (g) => g))
      .sort((a, b) => b[1] - a[1])
      .map(([gap, n]) => ({ gap, patients: n })),
    engagement: {
      appUsers: pts.filter((p) => p.appUser).length,
      byContactPreference: count(pts, (p) => p.contactPreference),
    },
    honesty: w.honesty,
  };
}

export type PatientFilter = { market?: MarketCode; type?: DiabetesType; band?: string; gap?: string; q?: string; orgId?: string; professionalId?: string; page?: number; pageSize?: number };

export function listPatients(f: PatientFilter) {
  const w = getSyntheticWorld();
  const q = f.q?.trim().toLowerCase();
  let rows = w.patients.filter(
    (p) =>
      (!f.market || p.market === f.market) &&
      (!f.type || p.diabetesType === f.type) &&
      (!f.band || p.risk.band === f.band) &&
      (!f.gap || p.openCareGaps.includes(f.gap)) &&
      (!f.orgId || p.primaryOrganisationId === f.orgId || p.pharmacyId === f.orgId || p.payerId === f.orgId) &&
      (!f.professionalId || p.careTeam.some((t) => t.professionalId === f.professionalId)) &&
      (!q || `${p.givenName} ${p.familyName} ${p.id} ${p.marketId} ${p.city}`.toLowerCase().includes(q))
  );
  rows = rows.sort((a, b) => b.risk.score - a.risk.score);
  const pageSize = Math.min(100, Math.max(5, f.pageSize ?? 25));
  const page = Math.max(1, f.page ?? 1);
  return {
    total: rows.length,
    page,
    pageSize,
    rows: rows.slice((page - 1) * pageSize, page * pageSize).map((p) => ({
      id: p.id,
      name: `${p.title} ${p.givenName} ${p.familyName}`,
      age: p.age,
      sex: p.sex,
      market: p.market,
      city: p.city,
      type: TYPE_LABEL[p.diabetesType],
      hba1c: latest(p),
      unit: MARKET_BY_CODE[p.market].hba1cUnitPrimary,
      risk: p.risk,
      gaps: p.openCareGaps,
      cgm: p.cgm ? p.cgm.timeInRangePct : null,
      nextAppointment: p.nextAppointment,
    })),
  };
}

export function getPatientDetail(id: string) {
  const w = getSyntheticWorld();
  const p = w.patients.find((x) => x.id === id);
  if (!p) return null;
  const org = (oid: string) => w.organisations.find((o) => o.id === oid) ?? null;
  return {
    ...p,
    typeLabel: TYPE_LABEL[p.diabetesType],
    marketInfo: MARKET_BY_CODE[p.market],
    primaryOrganisation: org(p.primaryOrganisationId),
    pharmacy: org(p.pharmacyId),
    payer: org(p.payerId),
    careTeamDetail: p.careTeam.map((t) => {
      const pro = w.professionals.find((x) => x.id === t.professionalId)!;
      return { ...t, name: `${pro.title} ${pro.givenName} ${pro.familyName}`, roleLabel: pro.roleLabel, organisation: org(pro.organisationId)?.name ?? null };
    }),
  };
}

export function listProfessionals(f: { market?: MarketCode; role?: string; q?: string }) {
  const w = getSyntheticWorld();
  const q = f.q?.trim().toLowerCase();
  return w.professionals
    .filter((p) => (!f.market || p.market === f.market) && (!f.role || p.role === f.role) && (!q || `${p.givenName} ${p.familyName} ${p.roleLabel}`.toLowerCase().includes(q)))
    .map((p) => ({ ...p, organisation: w.organisations.find((o) => o.id === p.organisationId)?.name ?? null }));
}

export function listOrganisations(f: { market?: MarketCode; kind?: OrgKind }) {
  const w = getSyntheticWorld();
  return w.organisations
    .filter((o) => (!f.market || o.market === f.market) && (!f.kind || o.kind === f.kind))
    .map((o) => ({
      ...o,
      professionals: w.professionals.filter((p) => p.organisationId === o.id).length,
      patients:
        o.kind === "community_pharmacy"
          ? w.patients.filter((p) => p.pharmacyId === o.id).length
          : o.kind === "payer"
            ? w.patients.filter((p) => p.payerId === o.id).length
            : w.patients.filter((p) => p.primaryOrganisationId === o.id).length,
    }));
}
