"use client";

import { useCallback, useEffect, useState } from "react";

import { CgmPanel } from "@/components/cgm/CgmPanel";
import { ClinicalReviewPanel } from "@/components/network/ClinicalReviewPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getPatientDetail, listOrganisations, listPatients, listProfessionals, networkSummary } from "@/lib/network/read";
import { formatHba1c } from "@/lib/units";
import { cn } from "@/lib/utils";

type Summary = Awaited<ReturnType<typeof networkSummary>>;
type PatientPage = Awaited<ReturnType<typeof listPatients>>;
type PatientDetail = NonNullable<Awaited<ReturnType<typeof getPatientDetail>>>;
type Pro = Awaited<ReturnType<typeof listProfessionals>>[number];
type Org = Awaited<ReturnType<typeof listOrganisations>>[number];
type Tab = "overview" | "patients" | "professionals" | "organisations";

const ORG_KIND_LABEL: Record<string, string> = {
  clinic: "Clinics",
  diabetes_centre: "Diabetes centres",
  hospital: "Hospitals",
  pharmacy: "Pharmacies",
  lab: "Laboratories",
  payer: "Payers",
  research: "Research",
  device_partner: "Device partners",
  other: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  sandbox: "Sandbox",
  onboarding: "Onboarding",
  live_read_only: "Live (read only)",
  live: "Live",
  suspended: "Suspended",
};

function bandBadge(band: string) {
  const v = band === "VeryHigh" ? "danger" : band === "High" ? "warning" : band === "Medium" ? "clinical" : "outline";
  return <Badge variant={v as "danger"}>{band === "VeryHigh" ? "Very high" : band}</Badge>;
}

function hba1cText(h: { hba1cMmolMol: number; hba1cPercent: number } | null, unit: "mmol/mol" | "%") {
  if (!h) return "no HbA1c on record";
  return unit === "%" ? `${h.hba1cPercent}% (${h.hba1cMmolMol})` : `${h.hba1cMmolMol} mmol/mol (${h.hba1cPercent}%)`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 3;
  const max = Math.max(...values) + 3;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 120},${36 - ((v - min) / (max - min)) * 32}`).join(" ");
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary" />
    </svg>
  );
}

/** A small trend line scaled to the values themselves (lab results span very different ranges). */
function MiniTrend({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.2;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 56},${18 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 16}`).join(" ");
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary" />
    </svg>
  );
}

const CHANNEL_LABEL: Record<string, string> = { connector: "Lab feed", manual: "Entered by staff", csv_import: "Imported", patient_app: "Patient app", cgm: "CGM" };

/** Laboratory results: latest value, change, trend, date and where it came from. Missing core checks are shown as missing. */
function LabResults({ rows }: { rows: PatientDetail["labs"] }) {
  if (!rows.length) return null;
  return (
    <div data-lab-results>
      <p className="mb-1 text-xs font-medium text-foreground">Laboratory results</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-1 font-normal">Result</th>
            <th className="py-1 font-normal">Latest</th>
            <th className="py-1 font-normal">Trend</th>
            <th className="py-1 font-normal">Date · source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.kind} className="border-t border-border-subtle align-top" data-lab={r.kind}>
              <td className="py-1 pr-2 text-foreground">{r.label}</td>
              {r.latest ? (
                <>
                  <td className="py-1 pr-2 text-foreground">
                    {r.latest.value} {r.unit}
                    {r.change !== null && r.change !== 0 ? <span className="text-muted"> ({r.change > 0 ? "+" : ""}{r.change})</span> : null}
                    {r.latest.asSent ? <span className="block text-muted">sent as {r.latest.asSent}</span> : null}
                  </td>
                  <td className="py-1 pr-2"><MiniTrend values={r.history.map((h) => h.value)} /></td>
                  <td className="py-1 text-muted">
                    {r.latest.observedAt} · {r.latest.channel ? CHANNEL_LABEL[r.latest.channel] ?? r.latest.channel : "Recorded"}
                    {r.latest.code ? ` · LOINC ${r.latest.code}` : ""}
                    {r.latest.corrected ? <span className="ml-1 rounded bg-warning/15 px-1 text-warning">corrected</span> : null}
                  </td>
                </>
              ) : (
                <td colSpan={3} className="py-1 text-warning" data-lab-missing>Not on record</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = { overview: "Summary", patients: "Patients", professionals: "Care team", organisations: "Organisations" };

/** `simple` (real workspace): opens on the patient list; no cross-organisation directory tab. */
export function CareNetworkConsole({ simple = false }: { simple?: boolean }) {
  const [tab, setTab] = useState<Tab>(simple ? "patients" : "overview");
  const [region, setRegion] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientPage | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: "", band: "", type: "", gap: "", page: 1 });
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [pros, setPros] = useState<Pro[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);

  const qs = (o: Record<string, string | number>) =>
    new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => [k, String(v)])).toString();

  useEffect(() => {
    void fetch(`/api/network/summary?${qs({ region })}`).then(async (r) => {
      const data = await r.json();
      if (r.ok) {
        setSummary(data);
        setSummaryError(null);
      } else setSummaryError(data.error ?? "Not available");
    });
  }, [region]);

  const loadPatients = useCallback(async () => {
    const r = await fetch(`/api/network/patients?${qs({ region, ...filters })}`);
    const data = await r.json();
    if (!r.ok) {
      setPatientError(data.error ?? "Not available");
      setPatients(null);
    } else {
      setPatientError(null);
      setPatients(data);
    }
  }, [region, filters]);

  useEffect(() => {
    if (tab === "patients") void loadPatients();
    if (tab === "professionals") void fetch(`/api/network/professionals?${qs({ region })}`).then(async (r) => setPros(r.ok ? (await r.json()).rows : []));
    if (tab === "organisations") void fetch(`/api/network/organisations?${qs({ region })}`).then(async (r) => setOrgs(r.ok ? (await r.json()).rows : []));
  }, [tab, region, loadPatients]);

  async function openPatient(id: string) {
    const r = await fetch(`/api/network/patients/${id}`);
    if (r.ok) setDetail(await r.json());
  }

  // Deep link from Today: /dashboard/network?patient=<id> opens the patients tab with that patient.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("patient");
    if (!id || !/^[\w-]{1,64}$/.test(id)) return;
    setTab("patients");
    void fetch(`/api/network/patients/${id}`).then(async (r) => (r.ok ? setDetail(await r.json()) : undefined));
  }, []);

  const empty = summary && summary.totals.organisations === 0;

  return (
    <div className="space-y-5 p-4 md:p-6" data-care-network>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{simple ? "Patients" : "Care network"}</h1>
          <p className="text-sm text-muted">
            Your organisations, their patients and the care teams around them. You only see records your organisation holds or
            that a patient has consented to share with you.
          </p>
        </div>
        {summary && summary.regions.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Region</span>
            <select className="h-9 rounded-full border border-border-subtle bg-card px-3 text-sm" value={region} onChange={(e) => { setRegion(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }} aria-label="Region">
              <option value="">All regions</option>
              {summary.regions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      {summaryError ? <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-muted" role="status">{summaryError}</p> : null}
      {empty ? (
        <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-muted" role="status" data-network-empty>
          You are not part of an organisation yet. Create one, or ask your organisation’s admin for an invite code.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Care network views">
        {((simple ? ["patients", "overview", "professionals"] : ["overview", "patients", "professionals", "organisations"]) as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 text-sm", simple ? "" : "capitalize", tab === t ? "bg-foreground text-background" : "bg-surface-muted text-foreground")}>
            {simple ? TAB_LABEL[t] : t}
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
              { k: "Mean HbA1c (diabetes)", v: formatHba1c(summary.glycaemia.meanHba1cMmolMol, summary.glycaemia.hba1cUnit) },
              { k: summary.glycaemia.hba1cUnit === "%" ? "At HbA1c ≤ 7%" : "At HbA1c ≤ 53 mmol/mol", v: `${summary.glycaemia.atTargetPct}%` },
              { k: "CGM users", v: summary.glycaemia.cgmUsers },
              { k: "Mean time in range (CGM)", v: `${summary.glycaemia.meanTimeInRangePct}%` },
              { k: "Linked to the patient app", v: summary.engagement.appUsers },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-border-subtle bg-card p-3">
                <p className="text-xs text-muted">{x.k}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{x.v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Regions</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {summary.regions.length ? summary.regions.map((r) => (
                  <div key={r.name} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted">
                    <span className="text-foreground">{r.name}</span>
                    <span className="text-xs text-muted">{r.patients} patients · {r.professionals} staff · {r.organisations} orgs</span>
                  </div>
                )) : <p className="text-xs text-muted">No regions recorded.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Diabetes type and risk</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {Object.entries(summary.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-muted">{k}</span>
                    <span className="h-2 flex-1 rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-secondary" style={{ width: `${(v / Math.max(1, summary.totals.patients)) * 100}%` }} /></span>
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
                  <input className="h-9 flex-1 rounded-full border border-border-subtle px-3 text-sm" placeholder="Search name or record number" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))} aria-label="Search patients" />
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
                          <span className="block text-xs text-muted">{p.type} · {p.organisation ?? "Shared with you"} · HbA1c {hba1cText(p.hba1c, p.unit)}{p.cgm !== null ? ` · TIR ${p.cgm}%` : ""}</span>
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
              <CardHeader className="pb-2"><CardTitle className="text-base">{detail ? detail.name : "Select a patient"}</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm" data-patient-detail>
                {detail ? (
                  <>
                    <p className="text-xs text-muted">
                      {detail.typeLabel}{detail.diagnosedOn ? ` since ${detail.diagnosedOn.slice(0, 4)}` : ""} · {detail.age} · {detail.sex ?? "sex not recorded"} · {detail.organisation ?? "shared with you"}{detail.recordRef ? ` · record ${detail.recordRef}` : ""}{detail.contact.preferredChannel ? ` · prefers ${detail.contact.preferredChannel}` : ""}
                    </p>
                    <div className="flex items-center gap-3">
                      <Sparkline values={detail.hba1c.map((h) => h.hba1cMmolMol)} />
                      <div className="text-xs">
                        <p className="text-foreground">HbA1c {hba1cText(detail.hba1c[detail.hba1c.length - 1] ?? null, detail.unit)}</p>
                        {detail.hba1c.length > 1 ? <p className="text-muted">{detail.hba1c.map((h) => (detail.unit === "%" ? h.hba1cPercent : h.hba1cMmolMol)).join(" → ")} {detail.unit}</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">{bandBadge(detail.risk.band)}<span className="text-xs text-muted">score {detail.risk.score}: {detail.risk.drivers.join(", ") || "no major drivers"}</span></div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div><dt className="text-muted">BP</dt><dd className="m-0 text-foreground">{detail.vitals.systolic ?? "–"}/{detail.vitals.diastolic ?? "–"} mmHg</dd></div>
                      <div><dt className="text-muted">BMI</dt><dd className="m-0 text-foreground">{detail.vitals.bmi ?? "–"}</dd></div>
                      <div><dt className="text-muted">Hypos (90 days)</dt><dd className="m-0 text-foreground">{detail.vitals.hypos90d}</dd></div>
                      <div><dt className="text-muted">Foot risk</dt><dd className="m-0 text-foreground">{detail.vitals.footRisk ?? "not recorded"}</dd></div>
                    </dl>
                    <LabResults rows={detail.labs} />
                    {detail.cgm ? (
                      <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs">CGM: time in range {detail.cgm.timeInRangePct}%{detail.cgm.timeBelowRangePct !== null ? `, below range ${detail.cgm.timeBelowRangePct}%` : ""}</p>
                    ) : null}
                    {/* Renders nothing unless the caller may see this patient's CGM (staff of a visible organisation). */}
                    <CgmPanel key={detail.id} base={`/api/network/patients/${detail.id}/cgm`} audience="clinician" />
                    <ClinicalReviewPanel key={`review-${detail.id}`} patientId={detail.id} />
                    <div>
                      <p className="mb-1 text-xs font-medium text-foreground">Medicines</p>
                      <ul className="m-0 list-none p-0 space-y-0.5 text-xs text-muted">{detail.medications.length ? detail.medications.map((m) => <li key={m.name}>{m.name}{m.class ? ` (${m.class})` : ""}{m.dose ? `, ${m.dose}` : ""}</li>) : <li>None recorded</li>}</ul>
                    </div>
                    {detail.conditions.length ? <p className="text-xs text-muted"><span className="font-medium text-foreground">Conditions:</span> {detail.conditions.join(", ")}</p> : null}
                    {detail.openCareGaps.length ? <p className="text-xs text-muted"><span className="font-medium text-foreground">Care gaps:</span> {detail.openCareGaps.join(", ")}</p> : null}
                    <div>
                      <p className="mb-1 text-xs font-medium text-foreground">Care team</p>
                      <ul className="m-0 list-none p-0 space-y-0.5 text-xs text-muted">{detail.careTeam.length ? detail.careTeam.map((t, i) => <li key={i}>{t.careRole}: <span className="text-foreground">{t.name}</span>{t.sameOrganisation ? "" : " (other organisation)"}</li>) : <li>No care team recorded</li>}</ul>
                    </div>
                    {detail.consents.length ? (
                      <p className="text-xs text-muted"><span className="font-medium text-foreground">Sharing:</span> {detail.consents.map((c) => `${c.purpose.replace("_", " ")} ${c.status}`).join(", ")}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-muted">Choose someone from the registry to see their record, care team and sharing.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      ) : null}

      {tab === "professionals" ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{pros.length} team members</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-professionals>
                <thead className="text-xs text-muted"><tr><th className="py-2 pr-3 font-medium">Name</th><th className="pr-3 font-medium">Role</th><th className="pr-3 font-medium">Organisation</th><th className="pr-3 font-medium">Registration</th><th className="text-right font-medium">Patients</th></tr></thead>
                <tbody className="divide-y divide-border-subtle">
                  {pros.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3 text-foreground">{p.display_name}{p.is_admin ? <span className="ml-1 text-xs text-muted">(admin)</span> : null}</td>
                      <td className="pr-3 text-muted">{p.roleLabel}</td>
                      <td className="pr-3 text-muted">{p.organisation}</td>
                      <td className="pr-3 text-xs text-muted">{p.registration_status.replace("_", " ")}</td>
                      <td className="text-right text-foreground">{p.caseload}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      <span className="text-xs text-muted">{STATUS_LABEL[o.status] ?? o.status} · {o.professionals} staff · {o.patients} patients</span>
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
