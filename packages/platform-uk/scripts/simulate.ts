/**
 * Scenario runner: rehearses the full care-network story on a simulation deployment through the product's own APIs.
 *
 *   SIMULATION_RUNNER_TOKEN=... SIMULATION_PASSWORD=... \
 *     npx tsx --env-file=.env.local scripts/simulate.ts --base-url http://localhost:3000 [--scale small|full] [--patient-accounts 20]
 *
 * Story: each organisation's admin signs up and creates the organisation; professionals are invited and join with
 * single-use codes; clinicians import their patients with history; care teams span organisations and consent is
 * recorded before another organisation can see a record; some patients link their own accounts by invite and log a
 * reading. Every step goes through the same APIs, permissions and row-level security as real users.
 *
 * Re-runnable: existing accounts sign in, existing organisations and memberships are reused, imports are idempotent.
 * Accounts use the reserved aksh-simulation.example domain. The target deployment must not be production: the server
 * ignores the runner token there.
 */
import { assertSeedingAllowed } from "../lib/env/deployment";
import { getSyntheticWorld } from "../lib/synthetic-world/generate";
import type { MarketCode, OrgKind, Professional, WorldPatient } from "../lib/synthetic-world/types";

import { neutralOrgName } from "./simulation-names";

const DOMAIN = "aksh-simulation.example";

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const BASE = arg("base-url", "http://localhost:3000").replace(/\/$/, "");
const SCALE = arg("scale", "full") as "small" | "full";
const PATIENT_ACCOUNTS = Number(arg("patient-accounts", "20"));
const TOKEN = process.env.SIMULATION_RUNNER_TOKEN?.trim() ?? "";
const PASSWORD = process.env.SIMULATION_PASSWORD?.trim() ?? "";

const REGION: Record<MarketCode, string> = { GB: "Europe", IN: "South Asia", US: "North America", AE: "Middle East" };
const LOCALE: Record<MarketCode, Record<string, string>> = {
  GB: { timezone: "Europe/London", language: "en", glucoseUnit: "mmol/L", hba1cUnit: "mmol/mol", emergencyNumber: "999", urgentAdviceLine: "111" },
  IN: { timezone: "Asia/Kolkata", language: "en", glucoseUnit: "mg/dL", hba1cUnit: "%", emergencyNumber: "112", crisisLine: "14416" },
  US: { timezone: "America/New_York", language: "en", glucoseUnit: "mg/dL", hba1cUnit: "%", emergencyNumber: "911", crisisLine: "988" },
  AE: { timezone: "Asia/Dubai", language: "en", glucoseUnit: "mg/dL", hba1cUnit: "%", emergencyNumber: "998" },
};
const KIND: Record<OrgKind, string> = {
  primary_care_clinic: "clinic",
  diabetes_centre: "diabetes_centre",
  hospital: "hospital",
  community_pharmacy: "pharmacy",
  laboratory: "lab",
  payer: "payer",
  research_institute: "research",
  device_partner: "device_partner",
};
const CLINICAL = new Set(["gp", "nurse", "clinical-pharmacist"]);

// ------------------------------------------------------------------ HTTP session with a cookie jar

class Session {
  private cookies = new Map<string, string>();
  constructor(readonly email: string) {}

  async req(method: string, path: string, body?: unknown, form?: Record<string, string>) {
    const headers: Record<string, string> = { "x-aksh-simulation-token": TOKEN, cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") };
    let payload: string | undefined;
    if (form) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      payload = new URLSearchParams(form).toString();
    } else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const eq = pair!.indexOf("=");
      this.cookies.set(pair!.slice(0, eq).trim(), pair!.slice(eq + 1).trim());
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    return { status: res.status, json };
  }

  async ok(method: string, path: string, body?: unknown) {
    const r = await this.req(method, path, body);
    if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.json).slice(0, 300)} (${this.email})`);
    return r.json;
  }
}

async function account(email: string, role: string, fullName: string): Promise<Session> {
  const s = new Session(email);
  const signup = await s.req("POST", "/api/auth/signup", { email, password: PASSWORD, confirmPassword: PASSWORD, role, fullName, acceptedTerms: true });
  if (signup.status >= 400 && signup.status !== 409) throw new Error(`signup ${email} → ${signup.status} ${JSON.stringify(signup.json)}`);
  const csrf = await s.req("GET", "/api/auth/csrf");
  const login = await s.req("POST", "/api/auth/callback/credentials?json=true", undefined, { csrfToken: csrf.json.csrfToken, email, password: PASSWORD, callbackUrl: BASE, json: "true" });
  if (login.status >= 400) throw new Error(`sign-in ${email} → ${login.status}`);
  if (signup.status !== 409 && role !== "patient") {
    await s.ok("POST", "/api/onboarding/complete", { role, fullName, identity: { fullName, workEmail: email } });
  }
  return s;
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]!);
  }));
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
const cleanName = neutralOrgName;

function observationsFor(p: WorldPatient) {
  const obs: { kind: string; value: number; unit: string; observedAt: string; source: string }[] = p.hba1c.map((h) => ({ kind: "hba1c", value: h.hba1cMmolMol, unit: "mmol/mol", observedAt: h.date, source: "lab" }));
  const last = p.hba1c[p.hba1c.length - 1]?.date ?? "2026-09-01";
  obs.push(
    { kind: "egfr", value: p.egfr, unit: "mL/min/1.73m2", observedAt: last, source: "lab" },
    { kind: "acr", value: p.uacr, unit: "mg/mmol", observedAt: last, source: "lab" },
    { kind: "ldl", value: p.ldl, unit: "mmol/L", observedAt: last, source: "lab" },
    { kind: "systolic_bp", value: p.bloodPressure.systolic, unit: "mmHg", observedAt: last, source: "clinic" },
    { kind: "diastolic_bp", value: p.bloodPressure.diastolic, unit: "mmHg", observedAt: last, source: "clinic" },
    { kind: "bmi", value: p.bmi, unit: "kg/m2", observedAt: last, source: "clinic" }
  );
  if (p.cgm) {
    obs.push(
      { kind: "cgm_time_in_range", value: p.cgm.timeInRangePct, unit: "%", observedAt: p.cgm.lastSync, source: "device" },
      { kind: "cgm_time_below_range", value: p.cgm.timeBelowRangePct, unit: "%", observedAt: p.cgm.lastSync, source: "device" }
    );
  }
  for (let i = 0; i < p.hypoEvents90d; i++) {
    obs.push({ kind: "hypo_event", value: 1, unit: "event", observedAt: new Date(Date.now() - (5 + i * 7) * 86_400_000).toISOString(), source: "patient_reported" });
  }
  return obs;
}

async function main() {
  assertSeedingAllowed("simulate");
  if (TOKEN.length < 24) throw new Error("Set SIMULATION_RUNNER_TOKEN (24+ characters) here and on the target deployment.");
  if (PASSWORD.length < 16) throw new Error("Set SIMULATION_PASSWORD (16+ characters) for simulation accounts.");
  const started = Date.now();
  const world = getSyntheticWorld();

  // Small scale: one region's clinics, pharmacies and partners; full scale: everything.
  const orgs = SCALE === "small" ? world.organisations.filter((o) => o.market === "GB") : world.organisations;
  const orgIdsInScope = new Set(orgs.map((o) => o.id));
  const pros = world.professionals.filter((p) => orgIdsInScope.has(p.organisationId));
  const patients = world.patients.filter((p) => orgIdsInScope.has(p.primaryOrganisationId)).slice(0, SCALE === "small" ? 40 : undefined);
  console.log(`Target ${BASE} · scale ${SCALE}: ${orgs.length} organisations, ${pros.length} professionals, ${patients.length} patients`);

  // 1. Organisations, each created by its own admin.
  const orgDb = new Map<string, string>(); // world org id → database org id
  const admins = new Map<string, Session>();
  await pool(orgs, 6, async (o) => {
    const name = cleanName(o.name);
    const admin = await account(`admin.${slug(o.id)}@${DOMAIN}`, "practice-manager", `${name} admin`);
    const mine = (await admin.ok("GET", "/api/orgs")).rows as { id: string; name: string }[];
    const existing = mine.find((m) => m.name === name);
    const id = existing?.id ?? (await admin.ok("POST", "/api/orgs", { name, kind: KIND[o.kind], region: REGION[o.market], locale: LOCALE[o.market] })).id;
    orgDb.set(o.id, id);
    admins.set(o.id, admin);
  });
  console.log(`  organisations ready (${orgDb.size})`);

  // 2. Professionals join by invite.
  const memberOf = new Map<string, string>(); // professional id → membership id
  const sessions = new Map<string, Session>();
  await pool(pros, 6, async (p: Professional) => {
    const orgId = orgDb.get(p.organisationId)!;
    const s = await account(p.email.replace(/@.*/, `@${DOMAIN}`), p.platformRole, `${p.title} ${p.givenName} ${p.familyName}`);
    sessions.set(p.id, s);
    const mine = (await s.ok("GET", "/api/orgs")).rows as { id: string }[];
    if (!mine.some((m) => m.id === orgId)) {
      const invite = await admins.get(p.organisationId)!.ok("POST", `/api/orgs/${orgId}/invites`, { kind: "staff", role: p.platformRole });
      const joined = await s.ok("POST", "/api/invites/accept", { code: invite.code, registrationNumber: p.registration, professionalTitle: p.roleLabel });
      memberOf.set(p.id, joined.membershipId);
    }
  });
  // Memberships created on an earlier run: look them up by name as each organisation's admin.
  for (const o of orgs) {
    const staff = (await admins.get(o.id)!.ok("GET", "/api/network/professionals")).rows as { id: string; display_name: string; organisation: string }[];
    for (const p of pros.filter((x) => x.organisationId === o.id && !memberOf.has(x.id))) {
      const m = staff.find((r) => r.display_name === `${p.title} ${p.givenName} ${p.familyName}`);
      if (m) memberOf.set(p.id, m.id);
    }
  }
  console.log(`  professionals joined (${memberOf.size})`);

  // 3. Clinicians import their own organisation's patients with history.
  const clinicianFor = (worldOrgId: string) => {
    const p = pros.find((x) => x.organisationId === worldOrgId && CLINICAL.has(x.platformRole));
    return p ? sessions.get(p.id)! : null;
  };
  const patientDb = new Map<string, string>();
  const byOrg = new Map<string, WorldPatient[]>();
  for (const p of patients) byOrg.set(p.primaryOrganisationId, [...(byOrg.get(p.primaryOrganisationId) ?? []), p]);
  for (const [worldOrgId, list] of byOrg) {
    const s = clinicianFor(worldOrgId);
    if (!s) continue;
    for (let i = 0; i < list.length; i += 50) {
      const batch = list.slice(i, i + 50);
      const res = await s.ok("POST", `/api/orgs/${orgDb.get(worldOrgId)}/patients`, {
        patients: batch.map((p) => ({
          recordRef: p.id,
          givenName: p.givenName,
          familyName: p.familyName,
          dateOfBirth: p.dob,
          sex: p.sex,
          diabetesType: p.diabetesType,
          diagnosedOn: `${p.diagnosedYear}-01-01`,
          conditions: p.comorbidities,
          footRisk: p.footRisk,
          lastEyeScreening: p.lastEyeScreening,
          nextAppointment: p.nextAppointment ? new Date(p.nextAppointment).toISOString() : null,
          contact: { preferredChannel: p.contactPreference, language: p.language },
          observations: observationsFor(p),
          medications: p.medications.map((m) => ({ name: m.name, drugClass: m.class, dose: m.dose, startedOn: m.since })),
        })),
      });
      for (const row of res.rows as { recordRef: string; id: string }[]) patientDb.set(row.recordRef, row.id);
    }
  }
  console.log(`  patients imported (${patientDb.size})`);

  // 4. Care teams across organisations, with consent recorded for every other organisation involved.
  let teamLinks = 0;
  let consents = 0;
  await pool(patients.filter((p) => patientDb.has(p.id)), 8, async (p) => {
    const s = clinicianFor(p.primaryOrganisationId);
    if (!s) return;
    const pid = patientDb.get(p.id)!;
    // Re-runs skip what is already recorded: consent is append-only, so repeating it would add noise to the history.
    const current = await s.ok("GET", `/api/network/patients/${pid}`);
    const hasTeam = (current.careTeam as unknown[]).length > 0;
    const granted = new Set((current.consents as { grantee_organisation_id: string; status: string }[]).filter((c) => c.status === "granted").map((c) => c.grantee_organisation_id));
    const otherOrgs = new Set<string>();
    for (const t of p.careTeam) {
      const membershipId = memberOf.get(t.professionalId);
      const pro = world.professionals.find((x) => x.id === t.professionalId);
      if (!membershipId || !pro) continue;
      if (!hasTeam) {
        await s.ok("POST", `/api/network/patients/${pid}/records`, { type: "care_team", membershipId, careRole: pro.roleLabel });
        teamLinks += 1;
      }
      if (pro.organisationId !== p.primaryOrganisationId && orgDb.has(pro.organisationId)) otherOrgs.add(pro.organisationId);
    }
    if (orgDb.has(p.pharmacyId)) otherOrgs.add(p.pharmacyId);
    for (const o of otherOrgs) {
      if (granted.has(orgDb.get(o)!)) continue;
      await s.ok("POST", `/api/network/patients/${pid}/records`, { type: "consent", granteeOrganisationId: orgDb.get(o), purpose: "care_coordination", status: "granted", basis: "Explicit consent recorded at the clinic" });
      consents += 1;
    }
  });
  console.log(`  care-team links ${teamLinks}, consents ${consents}`);

  // 5. Some patients link their own accounts by invite and log a reading.
  let linked = 0;
  const appPatients = patients.filter((p) => p.appUser && patientDb.has(p.id)).slice(0, PATIENT_ACCOUNTS);
  for (const p of appPatients) {
    const clinician = clinicianFor(p.primaryOrganisationId);
    if (!clinician) continue;
    const email = `patient.${p.id.toLowerCase()}@${DOMAIN}`;
    const s = await account(email, "patient", `${p.givenName} ${p.familyName}`);
    const own = await s.req("GET", "/api/me/record");
    if (own.json?.linked) continue;
    const invite = await clinician.ok("POST", `/api/orgs/${orgDb.get(p.primaryOrganisationId)}/invites`, { kind: "patient", patientId: patientDb.get(p.id) });
    const done = await s.ok("POST", "/api/onboarding/complete", {
      role: "patient",
      fullName: `${p.givenName} ${p.familyName}`,
      identity: { firstName: p.givenName, lastName: p.familyName, dateOfBirth: p.dob, inviteCode: invite.code, email },
    });
    if (done.patientBinding === "linked") {
      linked += 1;
      await s.ok("POST", `/api/network/patients/${patientDb.get(p.id)}/records`, {
        type: "observation",
        observation: { kind: "glucose", value: 7.2, unit: "mmol/L", observedAt: new Date().toISOString(), source: "patient_reported" },
      });
    }
  }
  console.log(`  patient accounts linked ${linked}`);

  // 6. One clinic and its pharmacies are visible to signed-out visitors of this simulation deployment.
  const demoClinic = orgs.find((o) => o.kind === "primary_care_clinic");
  if (demoClinic) {
    const demoOrgIds = [orgDb.get(demoClinic.id)!, ...orgs.filter((o) => o.kind === "community_pharmacy" && o.market === demoClinic.market).slice(0, 2).map((o) => orgDb.get(o.id)!)];
    await new Session("runner").ok("POST", "/api/simulation/public-demo", { orgIds: demoOrgIds });
  }

  console.log(JSON.stringify({ ok: true, organisations: orgDb.size, professionals: memberOf.size, patients: patientDb.size, careTeamLinks: teamLinks, consents, patientAccountsLinked: linked, seconds: Math.round((Date.now() - started) / 1000) }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
