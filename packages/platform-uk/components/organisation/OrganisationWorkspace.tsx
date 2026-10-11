"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";
import { csvToPatients, PATIENT_CSV_TEMPLATE } from "@/lib/network/csv";

import { ConnectionsTab } from "./ConnectionsTab";
import { GoLiveTab } from "./GoLiveTab";
import { RegistrationCheckForm } from "./RegistrationCheckForm";
import { cn } from "@/lib/utils";

type Org = { id: string; name: string; kind: string; status: string; region: string | null; locale: Record<string, string>; isAdmin: boolean };
type Member = { id: string; user_id: string; registration_number: string | null; registration_body: string | null; display_name: string; email: string; role: string; professional_title: string | null; is_admin: boolean; status: string; registration_status: string; caseload: number };
type Invite = { id: string; kind: string; role: string | null; is_admin: boolean; email: string | null; patient_name: string | null; expires_at: string };
type PatientRow = { id: string; recordRef: string | null; name: string; age: number; type: string; appLinked: boolean };
type Tab = "settings" | "staff" | "patients" | "connections" | "go-live";
const LICENSED = new Set(["gp", "nurse", "clinical-pharmacist"]);

const ROLE_OPTIONS: [string, string][] = [
  ["gp", "Physician"],
  ["nurse", "Nurse / educator"],
  ["clinical-pharmacist", "Pharmacist"],
  ["practice-manager", "Manager / admin"],
];
const STATUS_LABEL: Record<string, string> = { sandbox: "Sandbox", onboarding: "Onboarding", live_read_only: "Live (read only)", live: "Live", suspended: "Suspended" };

async function api<T = unknown>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  return { ok: r.ok, data };
}

/** Shown once: codes are stored hashed and cannot be displayed again. */
function CodeOnce({ code, label, onClose }: { code: string; label: string; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-4" role="status" data-invite-code>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl tracking-wider text-foreground">{code}</p>
      <p className="mt-1 text-xs text-muted">Single use. Shown only now; it cannot be displayed again. Expires in 14 days.</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(code)}>Copy code</Button>
        <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

export function OrganisationWorkspace() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("settings");
  const [message, setMessage] = useState<string | null>(null);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) ?? null, [orgs, orgId]);

  const loadOrgs = useCallback(async () => {
    const r = await api<{ rows: Org[] }>("/api/orgs");
    if (r.ok) {
      setOrgs(r.data.rows);
      setOrgId((cur) => cur ?? r.data.rows[0]?.id ?? null);
    }
  }, []);
  useEffect(() => void loadOrgs(), [loadOrgs]);

  if (!orgs.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Organisation</h1>
        <p className="mt-2 text-sm text-muted" data-no-organisation>
          You are not part of an organisation yet. Join one with an invite code, or finish onboarding to create your own sandbox clinic.
        </p>
        <JoinWithCode onJoined={() => void loadOrgs()} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6" data-organisation-workspace>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{org?.name ?? "Organisation"}</h1>
          <p className="text-sm text-muted">
            {org ? <Badge variant="outline">{STATUS_LABEL[org.status] ?? org.status}</Badge> : null} {org?.isAdmin ? "You are an admin." : "Some changes need an admin."}
          </p>
        </div>
        {orgs.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Organisation</span>
            <select aria-label="Organisation" className="h-9 rounded-full border border-border-subtle bg-card px-3 text-sm" value={orgId ?? ""} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      {message ? <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm" role="status">{message}</p> : null}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Organisation sections">
        {(["settings", "staff", "patients", "connections", "go-live"] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setMessage(null); }} className={cn("rounded-full px-4 py-1.5 text-sm capitalize", tab === t ? "bg-foreground text-background" : "bg-surface-muted text-foreground")}>
            {t}
          </button>
        ))}
      </div>
      {org && tab === "settings" ? <SettingsTab org={org} onSaved={(m) => { setMessage(m); void loadOrgs(); }} /> : null}
      {org && tab === "staff" ? <StaffTab org={org} onMessage={setMessage} /> : null}
      {org && tab === "patients" ? <PatientsTab org={org} onMessage={setMessage} /> : null}
      {org && tab === "connections" ? <ConnectionsTab org={org} onMessage={setMessage} /> : null}
      {org && tab === "go-live" ? <GoLiveTab org={org} onMessage={setMessage} onStatusChange={() => void loadOrgs()} /> : null}
    </div>
  );
}

export function JoinWithCode({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-4 flex max-w-md flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await api("/api/invites/accept", { method: "POST", body: JSON.stringify({ code }) });
        if (r.ok) onJoined();
        else setError(r.data.error ?? "That code did not work");
      }}
    >
      <label className="flex-1 text-sm">
        <span className="text-muted">Staff invite code</span>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-EFGH-JKLM-NPQR" aria-label="Staff invite code" />
      </label>
      <Button type="submit" disabled={code.trim().length < 8}>Join</Button>
      {error ? <p className="w-full text-sm text-red-700" role="alert">{error}</p> : null}
    </form>
  );
}

function SettingsTab({ org, onSaved }: { org: Org; onSaved: (m: string) => void }) {
  const [form, setForm] = useState({
    name: org.name,
    region: org.region ?? "",
    timezone: org.locale.timezone ?? "",
    glucoseUnit: org.locale.glucoseUnit ?? "mmol/L",
    hba1cUnit: org.locale.hba1cUnit ?? "mmol/mol",
    emergencyNumber: org.locale.emergencyNumber ?? "",
    urgentAdviceLine: org.locale.urgentAdviceLine ?? "",
    crisisLine: org.locale.crisisLine ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Organisation settings</CardTitle></CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          data-org-settings
          onSubmit={async (e) => {
            e.preventDefault();
            const { name, region, ...locale } = form;
            const r = await api(`/api/orgs/${org.id}`, { method: "PATCH", body: JSON.stringify({ name, region, locale }) });
            if (r.ok) {
              setError(null);
              onSaved("Settings saved");
            } else setError(r.data.error ?? "Could not save");
          }}
        >
          <label className="text-sm sm:col-span-2"><span className="text-muted">Name</span><Input value={form.name} onChange={set("name")} aria-label="Organisation name" /></label>
          <label className="text-sm"><span className="text-muted">Region</span><Input value={form.region} onChange={set("region")} aria-label="Region" placeholder="e.g. Europe" /></label>
          <label className="text-sm"><span className="text-muted">Time zone</span><Input value={form.timezone} onChange={set("timezone")} aria-label="Time zone" placeholder="e.g. Europe/Berlin" /></label>
          <label className="text-sm">
            <span className="text-muted">Glucose units</span>
            <select className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" value={form.glucoseUnit} onChange={set("glucoseUnit")} aria-label="Glucose units">
              <option>mmol/L</option><option>mg/dL</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted">HbA1c units</span>
            <select className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" value={form.hba1cUnit} onChange={set("hba1cUnit")} aria-label="HbA1c units">
              <option>mmol/mol</option><option>%</option>
            </select>
          </label>
          <label className="text-sm"><span className="text-muted">Emergency number</span><Input value={form.emergencyNumber} onChange={set("emergencyNumber")} aria-label="Emergency number" inputMode="tel" /></label>
          <label className="text-sm"><span className="text-muted">Urgent advice line (optional)</span><Input value={form.urgentAdviceLine} onChange={set("urgentAdviceLine")} aria-label="Urgent advice line" inputMode="tel" /></label>
          <label className="text-sm sm:col-span-2"><span className="text-muted">Mental health crisis line (optional)</span><Input value={form.crisisLine} onChange={set("crisisLine")} aria-label="Crisis line" /></label>
          <p className="text-xs text-muted sm:col-span-2">
            Asha uses these numbers in safety messages for your patients. Until an emergency number is set, it says “your local emergency number”.
            Organisation ID (for other organisations recording shared care): <span className="font-mono">{org.id}</span>
          </p>
          {error ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={!org.isAdmin}>Save settings</Button>
            {org.isAdmin ? (
              <a className="text-sm text-secondary underline underline-offset-2" href={`/api/orgs/${org.id}/export`} data-org-export>
                Download all organisation data (JSON)
              </a>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StaffTab({ org, onMessage }: { org: Org; onMessage: (m: string | null) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [invite, setInvite] = useState({ role: "nurse", isAdmin: false, email: "" });

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([api<{ rows: Member[] }>(`/api/orgs/${org.id}/members`), api<{ rows: Invite[] }>(`/api/orgs/${org.id}/invites`)]);
    if (m.ok) setMembers(m.data.rows);
    if (i.ok) setInvites(i.data.rows.filter((x) => x.kind === "staff"));
  }, [org.id]);
  useEffect(() => void load(), [load]);

  const { data: session } = useSession();
  const myUserId = (session?.user as { id?: string } | undefined)?.id;
  const [checking, setChecking] = useState<string | null>(null);

  async function patchMember(id: string, body: Record<string, unknown>) {
    const r = await api(`/api/orgs/${org.id}/members/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    onMessage(r.ok ? "Member updated" : r.data.error ?? "Could not update");
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Staff ({members.filter((m) => m.status === "active").length} active)</CardTitle></CardHeader>
        <CardContent>
          <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-members>
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm text-foreground">{m.display_name}{m.is_admin ? <span className="ml-1 text-xs text-muted">(admin)</span> : null}</span>
                  <span className="block text-xs text-muted">{m.professional_title ?? ROLE_OPTIONS.find(([v]) => v === m.role)?.[1] ?? m.role} · {m.email} · registration {m.registration_status.replace("_", " ")} · {m.caseload} patients</span>
                </span>
                <span className="flex items-center gap-1">
                  {m.status !== "active" ? <Badge variant="danger">{m.status}</Badge> : null}
                  {org.isAdmin ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => void patchMember(m.id, { status: m.status === "active" ? "suspended" : "active" })}>{m.status === "active" ? "Suspend" : "Reactivate"}</Button>
                      <Button size="sm" variant="outline" onClick={() => void patchMember(m.id, { isAdmin: !m.is_admin })}>{m.is_admin ? "Remove admin" : "Make admin"}</Button>
                      {m.user_id !== myUserId && m.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => setChecking(checking === m.id ? null : m.id)}>Check registration</Button>
                      ) : null}
                    </>
                  ) : null}
                </span>
                {checking === m.id ? (
                  <div className="w-full">
                    <RegistrationCheckForm
                      endpoint={`/api/orgs/${org.id}/members/${m.id}/registration`}
                      licensed={LICENSED.has(m.role)}
                      defaults={{ registry: m.registration_body, registrationNumber: m.registration_number }}
                      onDone={(msg) => { onMessage(msg); setChecking(null); void load(); }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Invite staff</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {code ? <CodeOnce code={code} label="Give this code to your colleague. They sign up, then enter it to join." onClose={() => setCode(null)} /> : null}
          <form
            className="space-y-3"
            data-invite-staff
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await api<{ code: string }>(`/api/orgs/${org.id}/invites`, {
                method: "POST",
                body: JSON.stringify({ kind: "staff", role: invite.role, isAdmin: invite.isAdmin, ...(invite.email.trim() ? { email: invite.email.trim() } : {}) }),
              });
              if (r.ok) {
                setCode(r.data.code);
                onMessage(null);
                await load();
              } else onMessage(r.data.error ?? "Could not create invite");
            }}
          >
            <label className="block">
              <span className="text-muted">Role</span>
              <select className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" value={invite.role} onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value }))} aria-label="Invite role">
                {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-muted">Their work email (optional, locks the code to it)</span><Input type="email" value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} aria-label="Invitee email" /></label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={invite.isAdmin} onChange={(e) => setInvite((v) => ({ ...v, isAdmin: e.target.checked }))} /> Make them an admin</label>
            <Button type="submit" disabled={!org.isAdmin}>Create invite code</Button>
            {!org.isAdmin ? <p className="text-xs text-muted">Only admins can invite staff.</p> : null}
          </form>
          {invites.length ? (
            <div>
              <p className="text-xs font-medium text-foreground">Pending invites</p>
              <ul className="m-0 mt-1 list-none space-y-1 p-0 text-xs text-muted">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span>{ROLE_OPTIONS.find(([v]) => v === i.role)?.[1] ?? i.role}{i.email ? ` · ${i.email}` : ""} · expires {new Date(i.expires_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline" onClick={async () => { await api(`/api/orgs/${org.id}/invites/${i.id}`, { method: "DELETE" }); await load(); }}>Revoke</Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function PatientsTab({ org, onMessage }: { org: Org; onMessage: (m: string | null) => void }) {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [mode, setMode] = useState<"list" | "add" | "import">("list");

  const load = useCallback(async () => {
    const r = await api<{ rows: PatientRow[] }>(`/api/orgs/${org.id}/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (r.ok) setRows(r.data.rows);
    else onMessage(r.data.error ?? "Patient list not available");
  }, [org.id, q, onMessage]);
  useEffect(() => void load(), [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === "list" ? "default" : "outline"} onClick={() => setMode("list")}>Patients</Button>
        <Button size="sm" variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")}>Add a patient</Button>
        <Button size="sm" variant={mode === "import" ? "default" : "outline"} onClick={() => setMode("import")}>Import CSV</Button>
      </div>
      {mode === "add" ? <AddPatient org={org} onDone={(m) => { onMessage(m); setMode("list"); void load(); }} /> : null}
      {mode === "import" ? <ImportPatients org={org} onDone={(m) => { onMessage(m); setMode("list"); void load(); }} /> : null}
      {mode === "list" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <Input placeholder="Search name or record number" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-muted">{rows.length} patients</p>
              <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-org-patients>
                {rows.map((p) => (
                  <li key={p.id}>
                    <button type="button" className={cn("flex w-full items-center justify-between gap-2 py-2 text-left hover:bg-surface-muted", selected?.id === p.id && "bg-surface-muted")} onClick={() => setSelected(p)}>
                      <span className="text-sm text-foreground">{p.name}, {p.age}</span>
                      <span className="text-xs text-muted">{p.recordRef ?? ""} · {p.type.replace("_", " ")}{p.appLinked ? " · app linked" : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {selected ? <PatientActions org={org} patient={selected} onMessage={onMessage} /> : <Card><CardContent className="p-5 text-sm text-muted">Choose a patient to invite them, add them to the waiting list, or record their care team and sharing.</CardContent></Card>}
        </div>
      ) : null}
    </div>
  );
}

function AddPatient({ org, onDone }: { org: Org; onDone: (m: string) => void }) {
  const [f, setF] = useState({ recordRef: "", givenName: "", familyName: "", dateOfBirth: "", diabetesType: "type_2", email: "", phone: "", preferredChannel: "sms" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Add a patient</CardTitle></CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-2"
          data-add-patient
          onSubmit={async (e) => {
            e.preventDefault();
            const patient = {
              recordRef: f.recordRef.trim(),
              givenName: f.givenName.trim(),
              familyName: f.familyName.trim(),
              dateOfBirth: f.dateOfBirth,
              diabetesType: f.diabetesType,
              contact: { ...(f.email ? { email: f.email.trim() } : {}), ...(f.phone ? { phone: f.phone.trim() } : {}), preferredChannel: f.preferredChannel },
            };
            const r = await api(`/api/orgs/${org.id}/patients`, { method: "POST", body: JSON.stringify({ patients: [patient] }) });
            if (r.ok) onDone(`${patient.givenName} ${patient.familyName} added`);
            else setError(r.data.error ?? "Check the details and try again");
          }}
        >
          <label className="text-sm"><span className="text-muted">Record number</span><Input required value={f.recordRef} onChange={set("recordRef")} aria-label="Record number" /></label>
          <label className="text-sm"><span className="text-muted">Date of birth</span><Input required type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} aria-label="Date of birth" /></label>
          <label className="text-sm"><span className="text-muted">First name</span><Input required value={f.givenName} onChange={set("givenName")} aria-label="First name" /></label>
          <label className="text-sm"><span className="text-muted">Last name</span><Input required value={f.familyName} onChange={set("familyName")} aria-label="Last name" /></label>
          <label className="text-sm">
            <span className="text-muted">Diabetes type</span>
            <select className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" value={f.diabetesType} onChange={set("diabetesType")} aria-label="Diabetes type">
              {[["type_2", "Type 2"], ["type_1", "Type 1"], ["prediabetes", "Prediabetes"], ["gestational", "Gestational"], ["lada", "LADA"], ["mody", "MODY"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted">Preferred contact</span>
            <select className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" value={f.preferredChannel} onChange={set("preferredChannel")} aria-label="Preferred contact">
              {["sms", "phone", "email", "app", "whatsapp"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm"><span className="text-muted">Email (optional)</span><Input type="email" value={f.email} onChange={set("email")} aria-label="Patient email" /></label>
          <label className="text-sm"><span className="text-muted">Phone (optional)</span><Input value={f.phone} onChange={set("phone")} aria-label="Patient phone" inputMode="tel" /></label>
          {error ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
          <div className="sm:col-span-2"><Button type="submit">Add patient</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function ImportPatients({ org, onDone }: { org: Org; onDone: (m: string) => void }) {
  const [text, setText] = useState("");
  const [report, setReport] = useState<{ total: number; valid: number; errors: { row: number; field: string; message: string }[]; existing: string[]; missingColumns: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => (text.trim() ? csvToPatients(text) : null), [text]);

  async function validate() {
    if (!parsed) return;
    setBusy(true);
    const r = await api<{ total: number; valid: number; errors: { row: number; field: string; message: string }[]; existing: string[] }>(`/api/orgs/${org.id}/patients?dryRun=1`, { method: "POST", body: JSON.stringify({ patients: parsed.patients }) });
    setBusy(false);
    if (r.ok) setReport({ ...r.data, missingColumns: parsed.missingColumns });
  }

  async function commit() {
    if (!parsed) return;
    setBusy(true);
    const bad = new Set(report?.errors.map((e) => e.row));
    const good = parsed.patients.filter((_, i) => !bad.has(i + 1));
    for (let i = 0; i < good.length; i += 100) {
      const r = await api(`/api/orgs/${org.id}/patients`, { method: "POST", body: JSON.stringify({ patients: good.slice(i, i + 100) }) });
      if (!r.ok) {
        setBusy(false);
        return onDone(r.data.error ?? `Import stopped at row ${i + 1}`);
      }
    }
    setBusy(false);
    onDone(`Imported ${good.length} patients${bad.size ? `; ${bad.size} rows with errors were skipped` : ""}`);
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Import patients from a spreadsheet</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm" data-import-patients>
        <p className="text-xs text-muted">
          Columns: record_number, given_name, family_name, date_of_birth (YYYY-MM-DD), and optionally sex, diabetes_type, email, phone,
          preferred_channel, latest_hba1c_mmol_mol, hba1c_date. Existing record numbers are updated, not duplicated.{" "}
          <a className="underline" href={`data:text/csv;charset=utf-8,${encodeURIComponent(PATIENT_CSV_TEMPLATE)}`} download="aksh-patients-template.csv">Download template</a>
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setText(await file.text());
            setReport(null);
          }}
        />
        <label className="block">
          <span className="text-muted">Or paste CSV</span>
          <textarea className="mt-1 h-32 w-full rounded-lg border border-border-subtle p-2 font-mono text-xs" value={text} onChange={(e) => { setText(e.target.value); setReport(null); }} aria-label="CSV text" />
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!parsed || busy} onClick={() => void validate()}>Check file</Button>
          <Button type="button" disabled={!report || report.valid === 0 || report.missingColumns.length > 0 || busy} onClick={() => void commit()}>Import {report ? report.valid : ""} patients</Button>
        </div>
        {report ? (
          <div className="rounded-lg border border-border-subtle p-3 text-xs" role="status" data-import-report>
            <p className="text-foreground">{report.valid} of {report.total} rows ready{report.existing.length ? ` (${report.existing.length} already exist and will be updated)` : ""}.</p>
            {report.missingColumns.length ? <p className="text-red-700">Missing columns: {report.missingColumns.join(", ")}</p> : null}
            {report.errors.length ? (
              <table className="mt-2 w-full text-left">
                <thead className="text-muted"><tr><th className="pr-2">Row</th><th className="pr-2">Field</th><th>Problem</th></tr></thead>
                <tbody>{report.errors.slice(0, 50).map((er, i) => <tr key={i}><td className="pr-2">{er.row}</td><td className="pr-2">{er.field}</td><td>{er.message}</td></tr>)}</tbody>
              </table>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PatientActions({ org, patient, onMessage }: { org: Org; patient: PatientRow; onMessage: (m: string | null) => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [wl, setWl] = useState({ appointmentType: "diabetes_review", reason: "overdue_care", contactChannel: "sms" });
  const [team, setTeam] = useState({ membershipId: "", careRole: "" });
  const [share, setShare] = useState({ granteeOrganisationId: "", purpose: "care_coordination", status: "granted" });

  useEffect(() => {
    void api<{ rows: Member[] }>(`/api/orgs/${org.id}/members`).then((r) => r.ok && setMembers(r.data.rows.filter((m) => m.status === "active")));
    setCode(null);
  }, [org.id, patient.id]);

  const record = async (body: Record<string, unknown>, ok: string) => {
    const r = await api(`/api/network/patients/${patient.id}/records`, { method: "POST", body: JSON.stringify(body) });
    onMessage(r.ok ? ok : r.data.error ?? "Could not save");
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{patient.name}</CardTitle></CardHeader>
      <CardContent className="space-y-5 text-sm" data-patient-actions>
        <section>
          <p className="font-medium text-foreground">Patient app</p>
          {code ? (
            <CodeOnce code={code} label={`Give this code to ${patient.name.split(" ")[0]}. With their date of birth it links their account to this record.`} onClose={() => setCode(null)} />
          ) : (
            <Button size="sm" variant="outline" onClick={async () => {
              const r = await api<{ code: string }>(`/api/orgs/${org.id}/invites`, { method: "POST", body: JSON.stringify({ kind: "patient", patientId: patient.id }) });
              if (r.ok) setCode(r.data.code);
              else onMessage(r.data.error ?? "Could not create invite");
            }}>Create patient invite code</Button>
          )}
        </section>

        <form className="space-y-2" data-add-waitlist onSubmit={async (e) => {
          e.preventDefault();
          const r = await api<{ duplicate: boolean }>(`/api/orgs/${org.id}/waitlist`, { method: "POST", body: JSON.stringify({ patientId: patient.id, ...wl }) });
          onMessage(r.ok ? (r.data.duplicate ? "Already on the waiting list for that appointment" : "Added to the waiting list") : r.data.error ?? "Could not add");
        }}>
          <p className="font-medium text-foreground">Waiting list</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <select aria-label="Appointment type" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={wl.appointmentType} onChange={(e) => setWl((v) => ({ ...v, appointmentType: e.target.value }))}>
              {Object.entries(APPOINTMENT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select aria-label="Reason" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={wl.reason} onChange={(e) => setWl((v) => ({ ...v, reason: e.target.value }))}>
              <option value="overdue_care">Overdue care</option><option value="patient_request">Patient asked</option><option value="clinician_request">Clinician asked</option>
            </select>
            <select aria-label="Contact channel" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={wl.contactChannel} onChange={(e) => setWl((v) => ({ ...v, contactChannel: e.target.value }))}>
              {["sms", "phone", "email", "app", "whatsapp"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Button size="sm" type="submit">Add to waiting list</Button>
        </form>

        <form className="space-y-2" data-add-care-team onSubmit={async (e) => { e.preventDefault(); await record({ type: "care_team", ...team }, "Added to the care team"); }}>
          <p className="font-medium text-foreground">Care team</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select aria-label="Team member" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={team.membershipId} onChange={(e) => setTeam((v) => ({ ...v, membershipId: e.target.value }))}>
              <option value="">Choose a colleague</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
            <Input aria-label="Care role" placeholder="e.g. Lead clinician" value={team.careRole} onChange={(e) => setTeam((v) => ({ ...v, careRole: e.target.value }))} />
          </div>
          <Button size="sm" type="submit" disabled={!team.membershipId || team.careRole.trim().length < 2}>Add to care team</Button>
        </form>

        <form className="space-y-2" data-record-consent onSubmit={async (e) => { e.preventDefault(); await record({ type: "consent", ...share, basis: "Recorded by the care team" }, share.status === "granted" ? "Sharing recorded" : "Sharing withdrawn"); }}>
          <p className="font-medium text-foreground">Sharing with another organisation</p>
          <p className="text-xs text-muted">Only with the patient’s agreement. The other organisation gives you its organisation ID (in its settings). Withdrawing takes effect immediately.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input aria-label="Other organisation ID" placeholder="Organisation ID" value={share.granteeOrganisationId} onChange={(e) => setShare((v) => ({ ...v, granteeOrganisationId: e.target.value.trim() }))} />
            <select aria-label="Purpose" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={share.purpose} onChange={(e) => setShare((v) => ({ ...v, purpose: e.target.value }))}>
              <option value="care_coordination">Care coordination</option><option value="direct_care">Direct care</option>
            </select>
            <select aria-label="Sharing status" className="h-10 rounded-xl border border-border bg-card px-2 text-sm" value={share.status} onChange={(e) => setShare((v) => ({ ...v, status: e.target.value }))}>
              <option value="granted">Agreed</option><option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <Button size="sm" type="submit" disabled={share.granteeOrganisationId.length < 8}>Record</Button>
        </form>
      </CardContent>
    </Card>
  );
}
