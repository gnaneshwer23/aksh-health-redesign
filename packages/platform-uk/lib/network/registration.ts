/**
 * Professional registration checks. Country-neutral: the checker looks the clinician up on the official register for
 * their profession and records what they found (register, number, date, reference). Checks are append-only; the
 * membership's registration status follows the latest check. Nobody checks their own registration (also enforced in
 * the database).
 */
import type { PoolClient } from "pg";
import { z } from "zod";

import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { isoDate, notFuture } from "@/lib/golive/checklist";

import { audit, withPrivileged, withTenant, type NetworkContext } from "./db";
import { LICENSED_ROLES, NetworkError } from "./service";

export const registrationCheckSchema = z
  .object({
    outcome: z.enum(["verified", "rejected", "not_applicable"]),
    registry: z.string().trim().min(2).max(160).optional(),
    registrationNumber: z.string().trim().min(2).max(40).optional(),
    checkedOn: isoDate.refine(notFuture, "Cannot be in the future"),
    evidenceRef: z.string().trim().max(300).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((c) => c.outcome !== "verified" || (c.registry && c.registrationNumber), { message: "A verified check needs the register and the registration number", path: ["registry"] })
  .refine((c) => c.outcome !== "rejected" || Boolean(c.note), { message: "Say what did not match", path: ["note"] })
  .transform((c) => (c.outcome === "not_applicable" ? { ...c, registry: undefined, registrationNumber: undefined } : c));

export type RegistrationCheckInput = z.infer<typeof registrationCheckSchema>;

async function record(client: PoolClient, orgId: string, membershipId: string, input: RegistrationCheckInput, checkedBy: string, kind: "org_admin" | "platform_admin") {
  const m = (await client.query<{ user_id: string; role: string }>(`SELECT user_id, role FROM aksh.memberships WHERE id = $1 AND organisation_id = $2`, [membershipId, orgId])).rows[0];
  if (!m) throw new NetworkError("Member not found", 404);
  if (m.user_id === checkedBy) throw new NetworkError("SELF_CHECK: someone else must check your registration", 403);
  if (input.outcome === "not_applicable" && LICENSED_ROLES.has(m.role)) throw new NetworkError("Clinicians in this role must have their registration checked", 400);
  const r = await client.query(
    `INSERT INTO aksh.registration_checks (organisation_id, membership_id, outcome, registry, registration_number, checked_on, evidence_ref, note, checked_by, checked_by_kind, environment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, outcome, created_at`,
    [orgId, membershipId, input.outcome, input.registry ?? null, input.registrationNumber ?? null, input.checkedOn, input.evidenceRef ?? null, input.note ?? null, checkedBy, kind, getDeploymentEnvironment()]
  );
  await client.query(
    `UPDATE aksh.memberships SET registration_status = $2, registration_number = COALESCE($3, registration_number), registration_body = COALESCE($4, registration_body) WHERE id = $1`,
    [membershipId, input.outcome, input.registrationNumber ?? null, input.registry ?? null]
  );
  await audit(client, { organisationId: orgId, actorUserId: checkedBy, action: `registration.${input.outcome}`, resourceType: "membership", resourceId: membershipId, detail: { by: kind } });
  return r.rows[0];
}

/** Organisation admin records a check (tenant session: row-level security and the database guards apply). */
export async function recordRegistrationCheck(ctx: NetworkContext, orgId: string, membershipId: string, input: RegistrationCheckInput) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can record registration checks", 403);
  return withTenant(ctx, (client) => record(client, orgId, membershipId, input, ctx.userId, "org_admin"));
}

/** Aksh platform admin records a check, e.g. when the only admin is the clinician to be checked. */
export async function recordRegistrationCheckAsPlatform(userId: string, orgId: string, membershipId: string, input: RegistrationCheckInput) {
  return withPrivileged((client) => record(client, orgId, membershipId, input, userId, "platform_admin"));
}

export async function listRegistrationChecks(ctx: NetworkContext, orgId: string, membershipId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT id, outcome, registry, registration_number, checked_on, evidence_ref, note, checked_by_kind, created_at
       FROM aksh.registration_checks WHERE organisation_id = $1 AND membership_id = $2 ORDER BY id DESC`,
      [orgId, membershipId]
    )).rows
  );
}
