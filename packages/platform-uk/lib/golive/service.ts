/**
 * Go-live: an organisation admin assembles evidence, requests review, and an Aksh platform admin accepts each item and
 * approves the organisation into live (read-only, shadow mode). Every step is an append-only event plus an audit
 * record. A platform admin never reviews an organisation they belong to.
 */
import type { PoolClient } from "pg";
import { z } from "zod";

import { isMfaEnabled } from "@/lib/auth/mfa";
import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { audit, withPrivileged, type NetworkContext } from "@/lib/network/db";
import { LICENSED_ROLES, NetworkError } from "@/lib/network/service";

import { AUTO_ITEMS, EVIDENCE_ITEMS, deriveItems, readiness, type AutoCheck, type EvidenceKey, type GoLiveEvent } from "./checklist";

const EDITABLE_STATUSES = new Set(["sandbox", "onboarding"]);

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  return withPrivileged(async (client) => Boolean((await client.query(`SELECT 1 FROM aksh.platform_admins WHERE user_id = $1`, [userId])).rowCount));
}

export async function requirePlatformAdmin(userId: string, orgId?: string) {
  if (!(await isPlatformAdmin(userId))) throw new NetworkError("Not found", 404);
  // Go-live decisions in production need two-step sign-in (the session itself then implies a second factor).
  if (getDeploymentEnvironment() === "production" && !(await isMfaEnabled(userId))) {
    throw new NetworkError("MFA_REQUIRED: turn on two-step sign-in (Security) before reviewing go-live", 403);
  }
  if (orgId) {
    const member = await withPrivileged(async (c) => (await c.query(`SELECT 1 FROM aksh.memberships WHERE organisation_id = $1 AND user_id = $2`, [orgId, userId])).rowCount);
    if (member) throw new NetworkError("CONFLICT_OF_INTEREST: you are a member of this organisation; another Aksh admin must review it", 403);
  }
}

async function loadOrg(client: PoolClient, orgId: string) {
  const r = await client.query<{ id: string; name: string; status: string; locale: Record<string, string>; public_demo: boolean; verified_at: string | null }>(
    `SELECT id, name, status, locale, public_demo, verified_at FROM aksh.organisations WHERE id = $1`,
    [orgId]
  );
  if (!r.rows[0]) throw new NetworkError("Organisation not found", 404);
  return r.rows[0];
}

async function loadEvents(client: PoolClient, orgId: string) {
  return (await client.query<GoLiveEvent>(
    `SELECT id, item_key, action, evidence, note, actor_user_id, actor_kind, created_at FROM aksh.golive_events WHERE organisation_id = $1 ORDER BY id`,
    [orgId]
  )).rows;
}

/** Computed from the organisation's own data each time; never stored, so it cannot go stale. */
async function autoChecks(client: PoolClient, orgId: string, locale: Record<string, string>, publicDemo: boolean): Promise<AutoCheck[]> {
  const members = (await client.query<{ display_name: string; role: string; is_admin: boolean; registration_status: string }>(
    `SELECT display_name, role, is_admin, registration_status FROM aksh.memberships WHERE organisation_id = $1 AND status = 'active'`,
    [orgId]
  )).rows;
  const counts = (await client.query<{ sample: number; sim_slots: number; patients: number; waiting: number }>(
    `SELECT (SELECT count(*)::int FROM aksh.network_patients WHERE organisation_id = $1 AND record_ref LIKE 'SAMPLE-%') AS sample,
            (SELECT count(*)::int FROM aksh.access_slots WHERE organisation_id = $1 AND source = 'simulation') AS sim_slots,
            (SELECT count(*)::int FROM aksh.network_patients WHERE organisation_id = $1) AS patients,
            (SELECT count(*)::int FROM aksh.waitlist_entries WHERE organisation_id = $1 AND status = 'waiting') AS waiting`,
    [orgId]
  )).rows[0]!;
  const unchecked = members.filter((m) => LICENSED_ROLES.has(m.role) && m.registration_status !== "verified");
  const missingSettings = [!locale.timezone && "time zone", !locale.emergencyNumber && "emergency number"].filter(Boolean);
  return [
    { key: "settings", title: AUTO_ITEMS.settings, ok: missingSettings.length === 0, detail: missingSettings.length ? `Add the ${missingSettings.join(" and ")} in Settings` : "Set" },
    {
      key: "staff_verified",
      title: AUTO_ITEMS.staff_verified,
      ok: unchecked.length === 0 && members.some((m) => m.is_admin),
      detail: unchecked.length ? `Not yet checked: ${unchecked.map((m) => m.display_name).join(", ")}` : `${members.filter((m) => LICENSED_ROLES.has(m.role)).length} clinicians checked`,
    },
    {
      key: "no_sample_data",
      title: AUTO_ITEMS.no_sample_data,
      ok: counts.sample === 0 && counts.sim_slots === 0 && !publicDemo,
      detail: counts.sample || counts.sim_slots || publicDemo ? "This workspace holds sample data. Create a new organisation for real patients." : "None",
    },
    {
      key: "patients_loaded",
      title: AUTO_ITEMS.patients_loaded,
      ok: counts.patients > 0 && counts.waiting > 0,
      detail: `${counts.patients} patients, ${counts.waiting} on the waiting list`,
    },
  ];
}

async function snapshot(client: PoolClient, orgId: string) {
  const org = await loadOrg(client, orgId);
  const events = await loadEvents(client, orgId);
  const items = deriveItems(events);
  const autos = await autoChecks(client, orgId, org.locale ?? {}, org.public_demo);
  return { org: { id: org.id, name: org.name, status: org.status, verifiedAt: org.verified_at }, items, autos, events, ...readiness(items, autos) };
}

/** The organisation's checklist, for any member. Evidence is visible to members; the history shows who did what. */
export async function getGoLive(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withPrivileged((client) => snapshot(client, orgId));
}

export async function submitEvidence(ctx: NetworkContext, orgId: string, key: string, raw: unknown) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can submit go-live evidence", 403);
  if (!Object.prototype.hasOwnProperty.call(EVIDENCE_ITEMS, key)) throw new NetworkError("Unknown checklist item", 404);
  const itemKey = key as EvidenceKey;
  const parsed = EVIDENCE_ITEMS[itemKey].schema.safeParse(raw);
  if (!parsed.success) throw new NetworkError(parsed.error.issues.map((i) => i.message).join("; "), 400);
  let evidence: Record<string, unknown> = parsed.data;

  // Checks and insert in one transaction under the organisation lock: a review or approval cannot slip in between.
  return withPrivileged(async (client) => {
    await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1 FOR UPDATE`, [orgId]);
    const org = await loadOrg(client, orgId);
    if (!EDITABLE_STATUSES.has(org.status)) throw new NetworkError("This organisation is live. Contact Aksh to change go-live evidence.", 409);
    const item = deriveItems(await loadEvents(client, orgId)).find((i) => i.key === itemKey)!;
    if (item.locked) throw new NetworkError("BASELINE_LOCKED: the accepted baseline cannot be changed", 409);
    if (org.status === "onboarding" && item.state !== "rejected") {
      throw new NetworkError("UNDER_REVIEW: while Aksh reviews, only items returned for changes can be updated", 409);
    }
    if (itemKey === "safety_lead") {
      const m = (await client.query<{ display_name: string; role: string; status: string; registration_status: string; registration_number: string | null; registration_body: string | null }>(
        `SELECT display_name, role, status, registration_status, registration_number, registration_body FROM aksh.memberships WHERE id = $1 AND organisation_id = $2`,
        [(evidence as { membershipId: string }).membershipId, orgId]
      )).rows[0];
      if (!m || m.status !== "active") throw new NetworkError("Choose an active member of this organisation", 400);
      if (!LICENSED_ROLES.has(m.role)) throw new NetworkError("The clinical safety lead must be a registered clinician", 400);
      if (m.registration_status !== "verified") throw new NetworkError("Check this clinician's registration first (Staff tab)", 400);
      evidence = { ...evidence, displayName: m.display_name, role: m.role, registry: m.registration_body, registrationNumber: m.registration_number };
    }
    await client.query(
      `INSERT INTO aksh.golive_events (organisation_id, item_key, action, evidence, actor_user_id, actor_kind, environment)
       VALUES ($1, $2, 'submitted', $3::jsonb, $4, 'org_admin', $5)`,
      [orgId, itemKey, JSON.stringify(evidence), ctx.userId, getDeploymentEnvironment()]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "golive.evidence.submitted", resourceType: "golive_item", resourceId: itemKey, detail: { previous: item.state } });
    return snapshot(client, orgId);
  });
}

export async function requestReview(ctx: NetworkContext, orgId: string) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can request go-live review", 403);
  return withPrivileged(async (client) => {
    await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1 FOR UPDATE`, [orgId]);
    const s = await snapshot(client, orgId);
    if (s.org.status !== "sandbox") throw new NetworkError(s.org.status === "onboarding" ? "Review already requested" : "This organisation is already live", 409);
    if (!s.canRequest) throw new NetworkError(`NOT_READY: ${s.blockers.join("; ")}`, 409);
    await client.query(
      `INSERT INTO aksh.golive_events (organisation_id, action, actor_user_id, actor_kind, environment) VALUES ($1, 'requested', $2, 'org_admin', $3)`,
      [orgId, ctx.userId, getDeploymentEnvironment()]
    );
    await client.query(`UPDATE aksh.organisations SET status = 'onboarding' WHERE id = $1`, [orgId]);
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "golive.requested", resourceType: "organisation", resourceId: orgId });
    return snapshot(client, orgId);
  });
}

// ---------------------------------------------------------------- platform admin

/** Organisations awaiting review, or with evidence waiting for a decision. */
export async function listReviewQueue(userId: string) {
  await requirePlatformAdmin(userId);
  return withPrivileged(async (client) =>
    (await client.query(
      `WITH latest AS (
         SELECT DISTINCT ON (organisation_id, item_key) organisation_id, item_key, action
         FROM aksh.golive_events WHERE item_key IS NOT NULL ORDER BY organisation_id, item_key, id DESC
       )
       SELECT o.id, o.name, o.status, o.created_at,
              (SELECT count(*)::int FROM latest l WHERE l.organisation_id = o.id AND l.action = 'submitted') AS awaiting,
              (SELECT count(*)::int FROM latest l WHERE l.organisation_id = o.id AND l.action = 'accepted') AS accepted,
              (SELECT max(created_at) FROM aksh.golive_events e WHERE e.organisation_id = o.id) AS last_activity,
              EXISTS (SELECT 1 FROM aksh.memberships m WHERE m.organisation_id = o.id AND m.user_id = $1) AS is_member
       FROM aksh.organisations o
       WHERE o.status = 'onboarding' OR EXISTS (SELECT 1 FROM latest l WHERE l.organisation_id = o.id AND l.action = 'submitted')
       ORDER BY (o.status = 'onboarding') DESC, last_activity DESC NULLS LAST LIMIT 200`,
      [userId]
    )).rows
  );
}

export async function getReview(userId: string, orgId: string) {
  await requirePlatformAdmin(userId, orgId);
  return withPrivileged(async (client) => {
    const s = await snapshot(client, orgId);
    const members = (await client.query(
      `SELECT m.id, m.display_name, m.role, m.is_admin, m.status, m.registration_status, m.registration_number, m.registration_body,
              (SELECT row_to_json(c) FROM (SELECT outcome, registry, registration_number, checked_on, evidence_ref, checked_by_kind, created_at
                 FROM aksh.registration_checks rc WHERE rc.membership_id = m.id ORDER BY rc.id DESC LIMIT 1) c) AS last_check
       FROM aksh.memberships m WHERE m.organisation_id = $1 AND m.status = 'active' ORDER BY m.display_name`,
      [orgId]
    )).rows;
    return { ...s, members };
  });
}

export const reviewItemSchema = z.object({ decision: z.enum(["accepted", "rejected"]), note: z.string().trim().max(1000).optional() });

export async function reviewItem(userId: string, orgId: string, key: string, input: z.infer<typeof reviewItemSchema>) {
  await requirePlatformAdmin(userId, orgId);
  if (!Object.prototype.hasOwnProperty.call(EVIDENCE_ITEMS, key)) throw new NetworkError("Unknown checklist item", 404);
  if (input.decision === "rejected" && !input.note) throw new NetworkError("Say what needs to change", 400);
  return withPrivileged(async (client) => {
    await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1 FOR UPDATE`, [orgId]);
    const item = deriveItems(await loadEvents(client, orgId)).find((i) => i.key === key)!;
    if (item.state !== "submitted") throw new NetworkError("Only submitted evidence can be reviewed", 409);
    await client.query(
      `INSERT INTO aksh.golive_events (organisation_id, item_key, action, note, actor_user_id, actor_kind, environment) VALUES ($1, $2, $3, $4, $5, 'platform_admin', $6)`,
      [orgId, key, input.decision, input.note ?? null, userId, getDeploymentEnvironment()]
    );
    await audit(client, { organisationId: orgId, actorUserId: userId, action: `golive.evidence.${input.decision}`, resourceType: "golive_item", resourceId: key });
    return snapshot(client, orgId);
  });
}

export const decisionSchema = z.object({ note: z.string().trim().max(1000).optional() });

/** Approve into live_read_only: real data, shadow mode (Aksh drafts, staff act). Sending is a later, separate step. */
export async function approveGoLive(userId: string, orgId: string, note?: string) {
  await requirePlatformAdmin(userId, orgId);
  return withPrivileged(async (client) => {
    await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1 FOR UPDATE`, [orgId]);
    const s = await snapshot(client, orgId);
    if (s.org.status !== "onboarding") throw new NetworkError("Only organisations awaiting review can be approved", 409);
    if (!s.canApprove) throw new NetworkError(`NOT_READY: ${[...s.blockers, ...s.items.filter((i) => i.state !== "accepted").map((i) => `${i.title}: not accepted`)].join("; ")}`, 409);
    await client.query(
      `INSERT INTO aksh.golive_events (organisation_id, action, note, actor_user_id, actor_kind, environment) VALUES ($1, 'approved', $2, $3, 'platform_admin', $4)`,
      [orgId, note ?? null, userId, getDeploymentEnvironment()]
    );
    await client.query(`UPDATE aksh.organisations SET status = 'live_read_only', verified_at = NOW() WHERE id = $1`, [orgId]);
    await audit(client, { organisationId: orgId, actorUserId: userId, action: "golive.approved", resourceType: "organisation", resourceId: orgId, detail: { status: "live_read_only" } });
    return snapshot(client, orgId);
  });
}

export async function returnGoLive(userId: string, orgId: string, note?: string) {
  await requirePlatformAdmin(userId, orgId);
  if (!note) throw new NetworkError("Say why the request is returned", 400);
  return withPrivileged(async (client) => {
    await client.query(`SELECT 1 FROM aksh.organisations WHERE id = $1 FOR UPDATE`, [orgId]);
    const org = await loadOrg(client, orgId);
    if (org.status !== "onboarding") throw new NetworkError("Only organisations awaiting review can be returned", 409);
    await client.query(
      `INSERT INTO aksh.golive_events (organisation_id, action, note, actor_user_id, actor_kind, environment) VALUES ($1, 'returned', $2, $3, 'platform_admin', $4)`,
      [orgId, note, userId, getDeploymentEnvironment()]
    );
    await client.query(`UPDATE aksh.organisations SET status = 'sandbox' WHERE id = $1`, [orgId]);
    await audit(client, { organisationId: orgId, actorUserId: userId, action: "golive.returned", resourceType: "organisation", resourceId: orgId });
    return snapshot(client, orgId);
  });
}
