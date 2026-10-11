/**
 * Care-network write operations. Tenant operations run under row-level security (withTenant); the few privileged
 * operations (create organisation, accept invite) run as owner and are audited. Roles are checked here too:
 * RLS decides which rows, the service decides which actions.
 */
import { z } from "zod";

import { getDeploymentEnvironment } from "@/lib/env/deployment";

import { generateInviteCode, hashInviteCode } from "./codes";
import { audit, withPrivileged, withTenant, type NetworkContext } from "./db";

export class NetworkError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 409 | 410 | 413 = 400
  ) {
    super(message);
  }
}

export const ORG_KINDS = ["clinic", "diabetes_centre", "hospital", "pharmacy", "lab", "payer", "research", "device_partner", "other"] as const;

/** Roles that may create and update patient records and clinical data in their own organisation. */
const CLINICAL_ROLES = new Set(["gp", "nurse", "clinical-pharmacist"]);
/** Roles that may administer patients (demographics, invites) without clinical data entry. */
const PATIENT_ADMIN_ROLES = new Set(["gp", "nurse", "clinical-pharmacist", "practice-manager"]);

const localeSchema = z
  .object({
    timezone: z.string().max(64).optional(),
    language: z.string().max(16).optional(),
    glucoseUnit: z.enum(["mmol/L", "mg/dL"]).optional(),
    hba1cUnit: z.enum(["mmol/mol", "%"]).optional(),
    emergencyNumber: z.string().max(16).optional(),
    urgentAdviceLine: z.string().max(32).optional(),
    crisisLine: z.string().max(64).optional(),
  })
  .strict();

/** Roles that hold a professional registration which must be checked before an organisation goes live. */
export const LICENSED_ROLES = new Set(["gp", "nurse", "clinical-pharmacist"]);

export const createOrganisationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  kind: z.enum(ORG_KINDS),
  region: z.string().trim().max(64).optional(),
  locale: localeSchema.optional(),
});

export async function createOrganisation(
  actor: { userId: string; email: string; displayName: string; role: string | null },
  input: z.infer<typeof createOrganisationSchema>
) {
  return withPrivileged(async (client) => {
    const org = await client.query<{ id: string; status: string }>(
      `INSERT INTO aksh.organisations (name, kind, region, locale, created_by) VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, status`,
      [input.name, input.kind, input.region ?? null, JSON.stringify(input.locale ?? {}), actor.userId]
    );
    const orgId = org.rows[0]!.id;
    await client.query(
      `INSERT INTO aksh.memberships (organisation_id, user_id, role, display_name, email, is_admin, registration_status)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
      [orgId, actor.userId, actor.role ?? "practice-manager", actor.displayName, actor.email, LICENSED_ROLES.has(actor.role ?? "") ? "unverified" : "not_applicable"]
    );
    await audit(client, { organisationId: orgId, actorUserId: actor.userId, action: "organisation.created", resourceType: "organisation", resourceId: orgId, detail: { kind: input.kind } });
    return { id: orgId, status: org.rows[0]!.status };
  });
}

export const createInviteSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("staff"),
    role: z.enum(["gp", "nurse", "clinical-pharmacist", "practice-manager", "ics-lead", "hospital-executive", "researcher"]),
    isAdmin: z.boolean().optional(),
    email: z.string().email().optional(),
    expiresInDays: z.number().int().min(1).max(30).optional(),
  }),
  z.object({
    kind: z.literal("patient"),
    patientId: z.string().min(1).max(64),
    email: z.string().email().optional(),
    expiresInDays: z.number().int().min(1).max(30).optional(),
  }),
]);

/** Create a single-use invite. The code is returned once and only its hash is stored. */
export async function createInvite(ctx: NetworkContext, orgId: string, input: z.infer<typeof createInviteSchema>) {
  if (input.kind === "staff" && !ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can invite staff", 403);
  if (input.kind === "patient" && !(ctx.orgIds.includes(orgId) && PATIENT_ADMIN_ROLES.has(ctx.role ?? ""))) {
    throw new NetworkError("Your role cannot invite patients", 403);
  }
  const code = generateInviteCode();
  const expires = new Date(Date.now() + (input.expiresInDays ?? 14) * 86_400_000);
  return withTenant(ctx, async (client) => {
    if (input.kind === "patient") {
      const p = await client.query(`SELECT 1 FROM aksh.network_patients WHERE id = $1 AND organisation_id = $2`, [input.patientId, orgId]);
      if (!p.rowCount) throw new NetworkError("Patient not found in this organisation", 404);
    }
    const row = await client.query<{ id: string }>(
      `INSERT INTO aksh.invites (organisation_id, kind, role, is_admin, email, patient_id, code_hash, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        orgId,
        input.kind,
        input.kind === "staff" ? input.role : null,
        input.kind === "staff" ? Boolean(input.isAdmin) : false,
        input.email?.toLowerCase() ?? null,
        input.kind === "patient" ? input.patientId : null,
        hashInviteCode(code),
        expires.toISOString(),
        ctx.userId,
      ]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: `invite.created.${input.kind}`, resourceType: "invite", resourceId: row.rows[0]!.id });
    return { id: row.rows[0]!.id, code, expiresAt: expires.toISOString() };
  });
}

type InviteRow = {
  id: string;
  organisation_id: string;
  kind: "staff" | "patient";
  role: string | null;
  is_admin: boolean;
  email: string | null;
  patient_id: string | null;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
};

async function loadUsableInvite(client: import("pg").PoolClient, code: string, kind: "staff" | "patient") {
  const { rows } = await client.query<InviteRow>(
    `SELECT id, organisation_id, kind, role, is_admin, email, patient_id, expires_at, used_at, revoked_at
     FROM aksh.invites WHERE code_hash = $1 FOR UPDATE`,
    [hashInviteCode(code)]
  );
  const invite = rows[0];
  // One message for every failure so codes cannot be probed.
  if (!invite || invite.kind !== kind || invite.used_at || invite.revoked_at || invite.expires_at.getTime() < Date.now()) {
    throw new NetworkError("This invite code is not valid. Ask the organisation for a new one.", 410);
  }
  return invite;
}

export async function acceptStaffInvite(
  actor: { userId: string; email: string; displayName: string; role: string | null },
  input: { code: string; registrationNumber?: string; registrationBody?: string; professionalTitle?: string }
) {
  return withPrivileged(async (client) => {
    const invite = await loadUsableInvite(client, input.code, "staff");
    if (invite.email && invite.email !== actor.email.toLowerCase()) {
      throw new NetworkError("This invite code is not valid. Ask the organisation for a new one.", 410);
    }
    const licensed = LICENSED_ROLES.has(invite.role ?? "");
    const membership = await client.query<{ id: string }>(
      `INSERT INTO aksh.memberships (organisation_id, user_id, role, professional_title, display_name, email, is_admin,
         registration_number, registration_body, registration_status, invited_by)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, created_by FROM aksh.invites WHERE id = $11
       ON CONFLICT (organisation_id, user_id) DO UPDATE SET status = 'active', role = EXCLUDED.role
       RETURNING id`,
      [
        invite.organisation_id,
        actor.userId,
        invite.role,
        input.professionalTitle ?? null,
        actor.displayName,
        actor.email,
        invite.is_admin,
        input.registrationNumber ?? null,
        input.registrationBody ?? null,
        licensed ? "unverified" : "not_applicable",
        invite.id,
      ]
    );
    await client.query(`UPDATE aksh.invites SET used_at = NOW(), used_by = $2 WHERE id = $1`, [invite.id, actor.userId]);
    await audit(client, { organisationId: invite.organisation_id, actorUserId: actor.userId, action: "invite.accepted.staff", resourceType: "membership", resourceId: membership.rows[0]!.id });
    return { organisationId: invite.organisation_id, membershipId: membership.rows[0]!.id, role: invite.role };
  });
}

/**
 * Link a patient account to a record. Code AND date of birth must match, so a guessed or forwarded code cannot open
 * someone else's record. `consume: false` only checks (used during onboarding before the final step).
 */
export async function acceptPatientInvite(
  actor: { userId: string },
  input: { code: string; dateOfBirth: string },
  options: { consume: boolean } = { consume: true }
) {
  return withPrivileged(async (client) => {
    const invite = await loadUsableInvite(client, input.code, "patient");
    const { rows } = await client.query<{ dob: string }>(
      `SELECT to_char(date_of_birth, 'YYYY-MM-DD') AS dob FROM aksh.network_patients WHERE id = $1`,
      [invite.patient_id]
    );
    if (rows[0]?.dob !== input.dateOfBirth.trim()) {
      throw new NetworkError("This invite code is not valid. Ask the organisation for a new one.", 410);
    }
    if (!options.consume) return { patientId: invite.patient_id!, organisationId: invite.organisation_id };
    const existing = await client.query(`SELECT 1 FROM aksh.patient_accounts WHERE patient_id = $1 OR user_id = $2`, [invite.patient_id, actor.userId]);
    if (existing.rowCount) throw new NetworkError("This record or account is already linked", 409);
    await client.query(`INSERT INTO aksh.patient_accounts (patient_id, user_id, invite_id) VALUES ($1, $2, $3)`, [invite.patient_id, actor.userId, invite.id]);
    await client.query(`UPDATE aksh.invites SET used_at = NOW(), used_by = $2 WHERE id = $1`, [invite.id, actor.userId]);
    await audit(client, { organisationId: invite.organisation_id, actorUserId: actor.userId, action: "invite.accepted.patient", resourceType: "patient", resourceId: invite.patient_id });
    return { patientId: invite.patient_id!, organisationId: invite.organisation_id };
  });
}

const observationSchema = z.object({
  kind: z.enum(["hba1c", "glucose", "systolic_bp", "diastolic_bp", "weight", "bmi", "egfr", "acr", "ldl", "cgm_time_in_range", "cgm_time_below_range", "hypo_event"]),
  value: z.number().finite(),
  unit: z.string().min(1).max(16),
  observedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  source: z.enum(["lab", "clinic", "device", "patient_reported"]),
});

const medicationSchema = z.object({
  name: z.string().min(1).max(120),
  drugClass: z.string().max(80).optional(),
  dose: z.string().max(120).optional(),
  startedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const importPatientSchema = z.object({
  recordRef: z.string().min(1).max(64),
  givenName: z.string().min(1).max(80),
  familyName: z.string().min(1).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(["female", "male", "other", "unknown"]).optional(),
  diabetesType: z.enum(["type_2", "type_1", "prediabetes", "gestational", "lada", "mody"]).optional(),
  diagnosedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  conditions: z.array(z.string().max(80)).max(30).optional(),
  footRisk: z.enum(["low", "moderate", "high"]).optional(),
  lastEyeScreening: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  nextAppointment: z.string().datetime({ offset: true }).nullable().optional(),
  contact: z
    .object({ email: z.string().email().optional(), phone: z.string().max(32).optional(), preferredChannel: z.string().max(16).optional(), language: z.string().max(16).optional() })
    .optional(),
  observations: z.array(observationSchema).max(200).optional(),
  medications: z.array(medicationSchema).max(40).optional(),
});

export const importPatientsSchema = z.object({ patients: z.array(importPatientSchema).min(1).max(100) });

/** Import or update patients for an organisation (idempotent on record reference), with history. */
export async function importPatients(ctx: NetworkContext, orgId: string, input: z.infer<typeof importPatientsSchema>) {
  if (!ctx.orgIds.includes(orgId) || (!CLINICAL_ROLES.has(ctx.role ?? "") && !ctx.adminOrgIds.includes(orgId))) {
    throw new NetworkError("Your role cannot import patients for this organisation", 403);
  }
  return withTenant(ctx, async (client) => {
    const ids: { recordRef: string; id: string; created: boolean }[] = [];
    for (const p of input.patients) {
      const row = await client.query<{ id: string; created: boolean }>(
        `INSERT INTO aksh.network_patients (organisation_id, record_ref, given_name, family_name, date_of_birth, sex, diabetes_type,
           diagnosed_on, conditions, foot_risk, last_eye_screening, next_appointment, contact, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)
         ON CONFLICT (organisation_id, record_ref) DO UPDATE SET
           given_name = EXCLUDED.given_name, family_name = EXCLUDED.family_name, conditions = EXCLUDED.conditions,
           foot_risk = EXCLUDED.foot_risk, last_eye_screening = EXCLUDED.last_eye_screening, next_appointment = EXCLUDED.next_appointment
         RETURNING id, (xmax = 0) AS created`,
        [
          orgId, p.recordRef, p.givenName, p.familyName, p.dateOfBirth, p.sex ?? null, p.diabetesType ?? null, p.diagnosedOn ?? null,
          p.conditions ?? [], p.footRisk ?? null, p.lastEyeScreening ?? null, p.nextAppointment ?? null, JSON.stringify(p.contact ?? {}), ctx.userId,
        ]
      );
      const { id, created } = row.rows[0]!;
      // History is only loaded on first import so re-running an import never duplicates observations.
      if (created) {
        for (const o of p.observations ?? []) {
          await client.query(
            `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, o.kind, o.value, o.unit, o.observedAt, o.source, o.source === "lab" || o.source === "clinic", ctx.userId]
          );
        }
        for (const m of p.medications ?? []) {
          await client.query(
            `INSERT INTO aksh.network_medications (patient_id, name, drug_class, dose, started_on, recorded_by) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, m.name, m.drugClass ?? null, m.dose ?? null, m.startedOn ?? null, ctx.userId]
          );
        }
      }
      ids.push({ recordRef: p.recordRef, id, created });
    }
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "patients.imported", resourceType: "organisation", resourceId: orgId, detail: { count: ids.length, created: ids.filter((x) => x.created).length } });
    return ids;
  });
}

export const patientRecordSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("observation"), observation: observationSchema }),
  z.object({ type: z.literal("medication"), medication: medicationSchema }),
  z.object({ type: z.literal("care_team"), membershipId: z.string().min(1).max(64), careRole: z.string().min(2).max(64) }),
  z.object({
    type: z.literal("consent"),
    granteeOrganisationId: z.string().min(1).max(64),
    purpose: z.enum(["direct_care", "care_coordination", "contact", "research"]),
    status: z.enum(["granted", "withdrawn"]),
    basis: z.string().max(120).optional(),
  }),
]);

/** Add an observation, medicine, care-team member or consent record to a patient. RLS enforces scope. */
export async function addPatientRecord(ctx: NetworkContext, patientId: string, input: z.infer<typeof patientRecordSchema>) {
  const isPatientSelf = ctx.patientIds.includes(patientId);
  if (input.type === "observation" && isPatientSelf && input.observation.source !== "patient_reported") {
    throw new NetworkError("Patients can only add patient-reported readings", 403);
  }
  if (!isPatientSelf && (input.type === "observation" || input.type === "medication") && !CLINICAL_ROLES.has(ctx.role ?? "")) {
    throw new NetworkError("Only clinicians can add clinical data", 403);
  }
  if (input.type === "medication" && isPatientSelf) throw new NetworkError("Medicines are recorded by the care team", 403);
  if ((input.type === "care_team") && !PATIENT_ADMIN_ROLES.has(ctx.role ?? "")) throw new NetworkError("Your role cannot change care teams", 403);
  if (input.type === "consent" && !isPatientSelf && !PATIENT_ADMIN_ROLES.has(ctx.role ?? "")) throw new NetworkError("Your role cannot record consent", 403);
  if (input.type === "consent") {
    const exists = await withPrivileged(async (client) => (await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1`, [input.granteeOrganisationId])).rowCount);
    if (!exists) throw new NetworkError("No organisation with that ID. Ask them for the ID shown in their settings.", 404);
  }
  // Resolve cross-organisation members before opening the tenant transaction: never hold two pool connections at once.
  if (input.type === "care_team" && !(await withPrivilegedLookup(input.membershipId))) throw new NetworkError("Care team member not found", 404);

  return withTenant(ctx, async (client) => {
    const visible = await client.query<{ organisation_id: string }>(`SELECT organisation_id FROM aksh.network_patients WHERE id = $1`, [patientId]);
    if (!visible.rowCount) throw new NetworkError("Patient not found", 404);
    const orgId = visible.rows[0]!.organisation_id;
    let id: string;
    if (input.type === "observation") {
      const o = input.observation;
      const r = await client.query<{ id: string }>(
        `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [patientId, o.kind, o.value, o.unit, o.observedAt, o.source, o.source === "lab" || o.source === "clinic", ctx.userId]
      );
      id = r.rows[0]!.id;
    } else if (input.type === "medication") {
      const m = input.medication;
      const r = await client.query<{ id: string }>(
        `INSERT INTO aksh.network_medications (patient_id, name, drug_class, dose, started_on, recorded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [patientId, m.name, m.drugClass ?? null, m.dose ?? null, m.startedOn ?? null, ctx.userId]
      );
      id = r.rows[0]!.id;
    } else if (input.type === "care_team") {
      // The member may belong to another organisation (e.g. a pharmacy); they only see the record once consent exists.
      const r = await client.query<{ id: string }>(
        `INSERT INTO aksh.care_team_members (patient_id, membership_id, care_role, added_by) VALUES ($1, $2, $3, $4)
         ON CONFLICT (patient_id, membership_id, care_role) DO UPDATE SET ended_at = NULL RETURNING id`,
        [patientId, input.membershipId, input.careRole, ctx.userId]
      );
      id = r.rows[0]!.id;
    } else {
      const r = await client.query<{ id: string }>(
        `INSERT INTO aksh.consent_records (patient_id, grantee_organisation_id, purpose, status, basis, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [patientId, input.granteeOrganisationId, input.purpose, input.status, input.basis ?? null, ctx.userId]
      );
      id = r.rows[0]!.id;
    }
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: `patient.${input.type}.added`, resourceType: "patient", resourceId: patientId, detail: { recordId: id } });
    return { id };
  });
}

/** Membership lookup across organisations (owner read: only confirms existence and status, returns no PHI). */
async function withPrivilegedLookup(membershipId: string) {
  return withPrivileged(async (client) => {
    const r = await client.query<{ id: string }>(`SELECT id FROM aksh.memberships WHERE id = $1 AND status = 'active'`, [membershipId]);
    return r.rows[0] ?? null;
  });
}

/** Simulation-only: mark organisations visible to signed-out visitors. Refused in production. */
export async function setPublicDemo(orgIds: string[], actorUserId: string | null) {
  if (getDeploymentEnvironment() === "production") throw new NetworkError("Not available in production", 403);
  return withPrivileged(async (client) => {
    await client.query(`UPDATE aksh.organisations SET public_demo = (id = ANY($1::text[]))`, [orgIds]);
    await audit(client, { actorUserId, action: "simulation.public_demo.set", resourceType: "organisation", detail: { orgIds } });
  });
}

/** Staff who joined with a code before finishing onboarding: carry the name they entered onto that membership. */
export async function setJoinedMemberName(userId: string, organisationId: string, displayName: string) {
  const name = displayName.trim().slice(0, 120);
  if (name.length < 2) return;
  await withPrivileged(async (client) => {
    await client.query(`UPDATE aksh.memberships SET display_name = $3 WHERE user_id = $1 AND organisation_id = $2`, [userId, organisationId, name]);
  });
}
