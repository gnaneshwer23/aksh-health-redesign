"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getPatientDetail, listOrganisations, listPatients, listProfessionals, networkSummary } from "@/lib/synthetic-world/queries";
import { cn } from "@/lib/utils";

type Summary = ReturnType<typeof networkSummary>;
type PatientPage = ReturnType<typeof listPatients>;
type PatientDetail = NonNullable<ReturnType<typeof getPatientDetail>>;
type Pro = ReturnType<typeof listProfessionals>[number];
type Org = ReturnType<typeof listOrganisations>[number];
type Tab = "overview" | "patients" | "professionals" | "organisations";

const MARKET_OPTIONS = [
  { code: "", label: "All regions" },
  { code: "GB", label: "Europe" },
  { code: "IN", label: "South Asia" },
  { code: "US", label: "North America" },
  { code: "AE", label: "Middle East" },
];

const ORG_KIND_LABEL: Record<string, string> = {
  primary_care_clinic: "Primary care clinics",
  diabetes_centre: "Diabetes centres",
  hospital: "Hospitals",
  community_pharmacy: "Pharmacies",
  laboratory: "Laboratories",
  payer: "Payers",
  research_institute: "Research institutes",
  device_partner: "Device partners",
};

function bandBadge(band: string) {
  const v = band === "VeryHigh" ? "danger" : band === "High" ? "warning" : band === "Medium" ? "clinical" : "outline";
  return (
    <Badge variant={v as "danger"} className={band === "VeryHigh" ? "text-red-700" : band === "High" ? "text-amber-800" : undefined}>
      {band === "VeryHigh" ? "Very high" : band}
    </Badge>
  );
}

function hba1cText(h: { hba1cMmolMol: number; hba1cPercent: number }, unit: "mmol/mol" | "%") {
  return unit === "%" ? `${h.hba1cPercent}% (${h.hba1cMmolMol})` : `${h.hba1cMmolMol} mmol/mol (${h.hba1cPercent}%)`;
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values) - 3;
  const max = Math.max(...values) + 3;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 120},${36 - ((v - min) / (max - min)) * 32}`).join(" ");
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" />
    </svg>
  );
}

export function CareNetworkConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const [market, setMarket] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [patients, setPatients] = useState<PatientPage | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: "", band: "", type: "", gap: "", page: 1 });
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [pros, setPros] = useState<Pro[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [proRole, setProRole] = useState("");

  const qs = (o: Record<string, string | number>) =>
    new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => [k, String(v)])).toString();

  useEffect(() => {
    void fetch(`/api/network/summary?${qs({ market })}`).then(async (r) => setSummary(await r.json()));
  }, [market]);

  const loadPatients = useCallback(async () => {
    const r = await fetch(`/api/network/patients?${qs({ market, ...filters })}`);
    const data = await r.json();
    if (!r.ok) {
      setPatientError(data.error ?? "Not available");
      setPatients(null);
    } else {
      setPatientError(null);
      setPatients(data);
    }
  }, [market, filters]);

  useEffect(() => {
    if (tab === "patients") void loadPatients();
    if (tab === "professionals") void fetch(`/api/network/professionals?${qs({ market, role: proRole })}`).then(async (r) => setPros((await r.json()).rows));
    if (tab === "organisations") void fetch(`/api/network/organisations?${qs({ market })}`).then(async (r) => setOrgs((await r.json()).rows));
  }, [tab, market, proRole, loadPatients]);

  async function openPatient(id: string) {
    const r = await fetch(`/api/network/patients/${id}`);
    if (r.ok) setDetail(await r.json());
  }

  const roles = summary ? Object.keys(summary.byRole).sort() : [];

  return (
    <div className="space-y-5 p-4 md:p-6" data-care-network>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Care network</h1>
          <p className="text-sm text-muted">
            Synthetic diabetes care network across four markets: patients, clinicians, clinics, pharmacies, labs, payers and partners. Every person and organisation is fictional.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Market</span>
          <select className="h-9 rounded-full border border-border-subtle bg-card px-3 text-sm" value={market} onChange={(e) => { setMarket(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }} aria-label="Market">
            {MARKET_OPTIONS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Care network views">
        {(["overview", "patients", "professionals", "organisations"] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 text-sm capitalize", tab === t ? "bg-foreground text-background" : "bg-surface-muted text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && summary ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Patients", v: summary.totals.patients },
              { k: "Healthcare professionals", v: summary.totals.professionals },
              { k: "Organisations", v: summary.totals.organisations },
              { k: "Mean HbA1c (diabetes)", v: `${summary.glycaemia.meanHba1cMmolMol} mmol/mol` },
              { k: "At HbA1c ≤ 53 mmol/mol (7%)", v: `${summary.glycaemia.atTargetPct}%` },
              { k: "CGM users", v: summary.glycaemia.cgmUsers },
              { k: "Mean time in range (CGM)", v: `${summary.glycaemia.meanTimeInRangePct}%` },
              { k: "Using the patient app", v: summary.engagement.appUsers },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-border-subtle bg-card p-3">
                <p className="text-xs text-muted">{x.k}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{x.v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Markets</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {summary.markets.map((m) => (
                  <div key={m.code} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted">
                    <span className="text-foreground">{m.name}</span>
                    <span className="text-xs text-muted">{m.patients} patients · {m.professionals} clinicians · {m.organisations} orgs · {m.regulator}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Diabetes type and risk</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {Object.entries(summary.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-muted">{k}</span>
                    <span className="h-2 flex-1 rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-accent" style={{ width: `${(v / summary.totals.patients) * 100}%` }} /></span>
                    <span className="w-8 text-right text-xs text-foreground">{v}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1 pt-2">
                  {["VeryHigh", "High", "Medium", "Low"].map((b) => (
                    <span key={b} className="flex items-center gap-1 text-xs">{bandBadge(b)} {summary.byRisk[b] ?? 0}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Open care gaps</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {summary.careGaps.map((g) => (
                  <button key={g.gap} type="button" className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-surface-muted" onClick={() => { setFilters((f) => ({ ...f, gap: g.gap, page: 1 })); setTab("patients"); }}>
                    <span className="text-foreground">{g.gap}</span>
                    <span className="text-xs text-muted">{g.patients} patients →</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "patients" ? (
        patientError ? (
          <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-muted" role="status">{patientError}</p>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader className="space-y-3 pb-2">
                <div className="flex flex-wrap gap-2">
                  <input className="h-9 flex-1 rounded-full border border-border-subtle px-3 text-sm" placeholder="Search name, ID or city" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))} aria-label="Search patients" />
                  <select className="h-9 rounded-full border border-border-subtle px-3 text-sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))} aria-label="Diabetes type">
                    <option value="">All types</option>
                    {[["type_2", "Type 2"], ["type_1", "Type 1"], ["prediabetes", "Prediabetes"], ["gestational", "Gestational"], ["lada", "LADA"], ["mody", "MODY"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select className="h-9 rounded-full border border-border-subtle px-3 text-sm" value={filters.band} onChange={(e) => setFilters((f) => ({ ...f, band: e.target.value, page: 1 }))} aria-label="Risk band">
                    <option value="">All risk</option>
                    {["VeryHigh", "High", "Medium", "Low"].map((b) => <option key={b} value={b}>{b === "VeryHigh" ? "Very high" : b}</option>)}
                  </select>
                </div>
                {filters.gap ? (
                  <p className="text-xs text-muted">Care gap: <strong className="text-foreground">{filters.gap}</strong> <button type="button" className="ml-1 underline" onClick={() => setFilters((f) => ({ ...f, gap: "", page: 1 }))}>clear</button></p>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs text-muted">{patients?.total ?? 0} patients · sorted by risk</p>
                <ul className="m-0 list-none p-0 divide-y divide-border-subtle" data-registry>
                  {patients?.rows.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => void openPatient(p.id)} className={cn("flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left hover:bg-surface-muted", detail?.id === p.id && "bg-surface-muted")}>
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground">{p.name}, {p.age}</span>
                          <span className="block text-xs text-muted">{p.type} · {p.city}, {p.market} · HbA1c {hba1cText(p.hba1c, p.unit)}{p.cgm !== null ? ` · TIR ${p.cgm}%` : ""}</span>
                        </span>
                        <span className="flex items-center gap-1">{p.gaps.length ? <Badge variant="outline">{p.gaps.length} gaps</Badge> : null}{bandBadge(p.risk.band)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {patients && patients.total > patients.pageSize ? (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <button type="button" disabled={filters.page <= 1} className="rounded-full border px-3 py-1 disabled:opacity-40" onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
                    <span className="text-muted">Page {patients.page} of {Math.ceil(patients.total / patients.pageSize)}</span>
                    <button type="button" disabled={patients.page * patients.pageSize >= patients.total} className="rounded-full border px-3 py-1 disabled:opacity-40" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{detail ? `${detail.title} ${detail.givenName} ${detail.familyName}` : "Select a patient"}</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm" data-patient-detail>
                {detail ? (
                  <>
                    <p className="text-xs text-muted">
                      {detail.typeLabel} since {detail.diagnosedYear} · {detail.age} · {detail.sex} · {detail.city}, {detail.marketInfo.name} · {detail.marketInfo.patientIdLabel} {detail.marketId} · prefers {detail.contactPreference} · {detail.language}
                    </p>
                    <div className="flex items-center gap-3">
                      <Sparkline values={detail.hba1c.map((h) => h.hba1cMmolMol)} />
                      <div className="text-xs">
                        <p className="text-foreground">HbA1c {hba1cText(detail.hba1c[detail.hba1c.length - 1]!, detail.marketInfo.hba1cUnitPrimary)}</p>
                        <p className="text-muted">{detail.hba1c.map((h) => h.hba1cMmolMol).join(" → ")} mmol/mol over 12 months</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">{bandBadge(detail.risk.band)}<span className="text-xs text-muted">score {detail.risk.score}: {detail.risk.drivers.join(", ") || "no major drivers"}</span></div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div><dt className="text-muted">BP</dt><dd className="m-0 text-foreground">{detail.bloodPressure.systolic}/{detail.bloodPressure.diastolic} mmHg</dd></div>
                      <div><dt className="text-muted">BMI</dt><dd className="m-0 text-foreground">{detail.bmi}</dd></div>
                      <div><dt className="text-muted">eGFR · urine ACR</dt><dd className="m-0 text-foreground">{detail.egfr} · {detail.uacr} mg/mmol</dd></div>
                      <div><dt className="text-muted">LDL</dt><dd className="m-0 text-foreground">{detail.ldl} mmol/L</dd></div>
                      <div><dt className="text-muted">Hypos (90 days)</dt><dd className="m-0 text-foreground">{detail.hypoEvents90d}</dd></div>
                      <div><dt className="text-muted">Foot risk</dt><dd className="m-0 text-foreground">{detail.footRisk}</dd></div>
                    </dl>
                    {detail.cgm ? (
                      <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs">
                        CGM {detail.cgm.device}: time in range {detail.cgm.timeInRangePct}%, below {detail.cgm.timeBelowRangePct}%, above {detail.cgm.timeAboveRangePct}% · wear {detail.cgm.wearPct}% · synced {detail.cgm.lastSync}
                      </p>
                    ) : null}
                    <div>
                      <p className="mb-1 text-xs font-medium text-foreground">Medicines</p>
                      <ul className="m-0 list-none p-0 space-y-0.5 text-xs text-muted">{detail.medications.map((m) => <li key={m.name}>{m.name} ({m.class}), {m.dose}</li>)}</ul>
                    </div>
                    {detail.comorbidities.length ? <p className="text-xs text-muted"><span className="font-medium text-foreground">Conditions:</span> {detail.comorbidities.join(", ")}</p> : null}
                    {detail.openCareGaps.length ? <p className="text-xs text-muted"><span className="font-medium text-foreground">Care gaps:</span> {detail.openCareGaps.join(", ")}</p> : null}
                    <div>
                      <p className="mb-1 text-xs font-medium text-foreground">Care team</p>
                      <ul className="m-0 list-none p-0 space-y-0.5 text-xs text-muted">{detail.careTeamDetail.map((t) => <li key={t.professionalId + t.role}>{t.roleLabel}: <span className="text-foreground">{t.name}</span>{t.organisation ? `, ${t.organisation}` : ""}</li>)}</ul>
                    </div>
                    <p className="text-xs text-muted">Clinic: {detail.primaryOrganisation?.name} · Pharmacy: {detail.pharmacy?.name} · Payer: {detail.payer?.name}{detail.nextAppointment ? ` · Next appointment ${detail.nextAppointment}` : ""}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted">Choose someone from the registry to see their record, care team, pharmacy and payer.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      ) : null}

      {tab === "professionals" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{pros.length} healthcare professionals</CardTitle>
            <select className="h-9 rounded-full border border-border-subtle px-3 text-sm" value={proRole} onChange={(e) => setProRole(e.target.value)} aria-label="Role">
              <option value="">All roles</option>
              {[...new Set(pros.map((p) => p.role))].sort().map((r) => <option key={r} value={r}>{pros.find((p) => p.role === r)?.roleLabel}</option>)}
            </select>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-professionals>
                <thead className="text-xs text-muted"><tr><th className="py-2 pr-3 font-medium">Name</th><th className="pr-3 font-medium">Role</th><th className="pr-3 font-medium">Organisation</th><th className="pr-3 font-medium">Market</th><th className="pr-3 font-medium">Registration</th><th className="text-right font-medium">Patients</th></tr></thead>
                <tbody className="divide-y divide-border-subtle">
                  {pros.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3 text-foreground">{p.title} {p.givenName} {p.familyName}</td>
                      <td className="pr-3 text-muted">{p.roleLabel}</td>
                      <td className="pr-3 text-muted">{p.organisation}</td>
                      <td className="pr-3 text-muted">{p.market}</td>
                      <td className="pr-3 font-mono text-xs text-muted">{p.registration}</td>
                      <td className="text-right text-foreground">{p.caseload}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {roles.length ? <p className="mt-3 text-xs text-muted">Registration numbers are synthetic and do not correspond to any real register.</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "organisations" ? (
        <div className="grid gap-5 lg:grid-cols-2" data-organisations>
          {Object.entries(ORG_KIND_LABEL).map(([kind, label]) => {
            const rows = orgs.filter((o) => o.kind === kind);
            if (!rows.length) return null;
            return (
              <Card key={kind}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{label} ({rows.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {rows.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted">
                      <span className="text-foreground">{o.name}</span>
                      <span className="text-xs text-muted">{o.market} · {o.professionals} staff · {o.patients} patients</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
