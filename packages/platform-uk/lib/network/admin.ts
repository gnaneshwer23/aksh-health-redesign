/**
 * Organisation administration: settings, members, pending invites, and patient-import validation. Admin actions are
 * checked here (role) and the rows are scoped by row-level security (tenant role), like every other network write.
 */
import { z } from "zod";

import { withTenant, type NetworkContext } from "./db";
import { audit } from "./db";
import { importPatientSchema, NetworkError } from "./service";

function requireMember(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
}
function requireAdmin(ctx: NetworkContext, orgId: string) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can do this", 403);
}

export async function getOrganisation(ctx: NetworkContext, orgId: string) {
  requireMember(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const r = await client.query(`SELECT id, name, kind, status, region, locale, created_at FROM aksh.organisations WHERE id = $1`, [orgId]);
    if (!r.rows[0]) throw new NetworkError("Organisation not found", 404);
    return { ...r.rows[0], isAdmin: ctx.adminOrgIds.includes(orgId) };
  });
}

const phoneish = z.string().trim().regex(/^[0-9+\s()-]{2,20}$/, "Use digits only, e.g. 112");

export const updateOrganisationSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  region: z.string().trim().max(64).optional(),
  locale: z
    .object({
      timezone: z.string().trim().max(64).refine((tz) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "Unknown time zone, e.g. Europe/Berlin").optional(),
      language: z.string().trim().max(16).optional(),
      glucoseUnit: z.enum(["mmol/L", "mg/dL"]).optional(),
      hba1cUnit: z.enum(["mmol/mol", "%"]).optional(),
      emergencyNumber: phoneish.optional().or(z.literal("")),
      urgentAdviceLine: phoneish.optional().or(z.literal("")),
      crisisLine: z.string().trim().max(64).optional().or(z.literal("")),
      /** The clinical guideline this organisation follows, by name and version (any country). Cited by rules. */
      guidelineName: z.string().trim().max(120).optional().or(z.literal("")),
      guidelineVersion: z.string().trim().max(40).optional().or(z.literal("")),
    })
    .optional(),
});

/** Name, region and locale. The locale drives units and the emergency wording Asha uses for this organisation. */
export async function updateOrganisation(ctx: NetworkContext, orgId: string, input: z.infer<typeof updateOrganisationSchema>) {
  requireAdmin(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const current = (await client.query<{ locale: Record<string, string> }>(`SELECT locale FROM aksh.organisations WHERE id = $1`, [orgId])).rows[0];
    if (!current) throw new NetworkError("Organisation not found", 404);
    const locale: Record<string, string | undefined> = { ...current.locale, ...(input.locale ?? {}) };
    for (const k of Object.keys(locale)) if (locale[k] === "") delete locale[k];
    const r = await client.query(
      `UPDATE aksh.organisations SET name = COALESCE($2, name), region = COALESCE($3, region), locale = $4::jsonb WHERE id = $1
       RETURNING id, name, kind, status, region, locale`,
      [orgId, input.name ?? null, input.region ?? null, JSON.stringify(locale)]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "organisation.updated", resourceType: "organisation", resourceId: orgId, detail: { fields: Object.keys(input) } });
    return r.rows[0];
  });
}

export async function listMembers(ctx: NetworkContext, orgId: string) {
  requireMember(ctx, orgId);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT m.id, m.user_id, m.display_name, m.email, m.role, m.professional_title, m.is_admin, m.status, m.registration_number,
              m.registration_body, m.registration_status, m.created_at,
              (SELECT count(*)::int FROM aksh.care_team_members ct WHERE ct.membership_id = m.id AND ct.ended_at IS NULL) AS caseload
       FROM aksh.memberships m WHERE m.organisation_id = $1 ORDER BY m.status, m.display_name`,
      [orgId]
    )).rows
  );
}

export const updateMemberSchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  role: z.enum(["gp", "nurse", "clinical-pharmacist", "practice-manager", "ics-lead", "hospital-executive", "researcher"]).optional(),
  isAdmin: z.boolean().optional(),
});

/** Suspend/reactivate, change role, grant/revoke admin. An organisation can never be left without an active admin. */
export async function updateMember(ctx: NetworkContext, orgId: string, membershipId: string, input: z.infer<typeof updateMemberSchema>) {
  requireAdmin(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const m = (await client.query<{ id: string; is_admin: boolean; status: string }>(
      `SELECT id, is_admin, status FROM aksh.memberships WHERE id = $1 AND organisation_id = $2 FOR UPDATE`,
      [membershipId, orgId]
    )).rows[0];
    if (!m) throw new NetworkError("Member not found", 404);
    const losesAdmin = m.is_admin && m.status === "active" && (input.isAdmin === false || input.status === "suspended");
    if (losesAdmin) {
      const admins = (await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM aksh.memberships WHERE organisation_id = $1 AND is_admin AND status = 'active'`,
        [orgId]
      )).rows[0]!.n;
      if (admins <= 1) throw new NetworkError("LAST_ADMIN: make someone else an admin first", 409);
    }
    const r = await client.query(
      `UPDATE aksh.memberships SET status = COALESCE($2, status), role = COALESCE($3, role), is_admin = COALESCE($4, is_admin)
       WHERE id = $1 RETURNING id, display_name, role, is_admin, status`,
      [membershipId, input.status ?? null, input.role ?? null, input.isAdmin ?? null]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "membership.updated", resourceType: "membership", resourceId: membershipId, detail: input });
    return r.rows[0];
  });
}

/** Pending invites (unused, unrevoked, unexpired). Codes are never returned: only their metadata. */
export async function listInvites(ctx: NetworkContext, orgId: string) {
  requireMember(ctx, orgId);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT i.id, i.kind, i.role, i.is_admin, i.email, i.patient_id, i.expires_at, i.created_at,
              p.given_name || ' ' || p.family_name AS patient_name
       FROM aksh.invites i LEFT JOIN aksh.network_patients p ON p.id = i.patient_id
       WHERE i.organisation_id = $1 AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [orgId]
    )).rows
  );
}

export async function revokeInvite(ctx: NetworkContext, orgId: string, inviteId: string) {
  requireMember(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const inv = (await client.query<{ kind: string }>(
      `SELECT kind FROM aksh.invites WHERE id = $1 AND organisation_id = $2 AND used_at IS NULL AND revoked_at IS NULL`,
      [inviteId, orgId]
    )).rows[0];
    if (!inv) throw new NetworkError("Invite not found or already used", 404);
    if (inv.kind === "staff" && !ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only admins can revoke staff invites", 403);
    await client.query(`UPDATE aksh.invites SET revoked_at = NOW() WHERE id = $1`, [inviteId]);
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "invite.revoked", resourceType: "invite", resourceId: inviteId });
    return { id: inviteId, revoked: true };
  });
}

export type ImportRowError = { row: number; field: string; message: string };

/**
 * Dry run for a patient import: validates every row with the same schema the import uses, flags duplicate record
 * numbers within the file and records that already exist (they will be updated, not duplicated). Writes nothing.
 */
export async function validatePatientImport(ctx: NetworkContext, orgId: string, rows: unknown[]) {
  requireMember(ctx, orgId);
  if (rows.length > 500) throw new NetworkError("Import at most 500 patients at a time", 400);
  const errors: ImportRowError[] = [];
  const valid: z.infer<typeof importPatientSchema>[] = [];
  const seen = new Map<string, number>();
  rows.forEach((raw, i) => {
    const parsed = importPatientSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push({ row: i + 1, field: issue.path.join(".") || "row", message: issue.message });
      return;
    }
    const ref = parsed.data.recordRef;
    if (seen.has(ref)) {
      errors.push({ row: i + 1, field: "recordRef", message: `Duplicate record number (also row ${seen.get(ref)})` });
      return;
    }
    seen.set(ref, i + 1);
    valid.push(parsed.data);
  });
  const existing = valid.length
    ? await withTenant(ctx, async (client) =>
        (await client.query<{ record_ref: string }>(`SELECT record_ref FROM aksh.network_patients WHERE organisation_id = $1 AND record_ref = ANY($2)`, [orgId, valid.map((v) => v.recordRef)])).rows.map((r) => r.record_ref)
      )
    : [];
  return { total: rows.length, valid: valid.length, errors, existing };
}

/**
 * Operational patient list for any member (admins included): identity and record number only, no clinical data, so
 * front-office staff can invite patients and manage waiting lists. Clinical detail stays behind the clinical routes.
 */
export async function listOrgPatients(ctx: NetworkContext, orgId: string, q?: string) {
  requireMember(ctx, orgId);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT p.id, p.record_ref AS "recordRef", p.given_name || ' ' || p.family_name AS name,
              date_part('year', age(p.date_of_birth))::int AS age, COALESCE(p.diabetes_type, 'not recorded') AS type,
              EXISTS (SELECT 1 FROM aksh.patient_accounts a WHERE a.patient_id = p.id) AS "appLinked"
       FROM aksh.network_patients p
       WHERE p.organisation_id = $1 AND ($2::text IS NULL OR (p.given_name || ' ' || p.family_name || ' ' || COALESCE(p.record_ref, '')) ILIKE '%' || $2 || '%')
       ORDER BY p.family_name, p.given_name LIMIT 500`,
      [orgId, q?.trim() || null]
    )).rows
  );
}
