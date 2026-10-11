/**
 * Offer templates (PRD v1.1 PA-04 / PA-108). An organisation approves the wording of slot offers; each approval is a new,
 * append-only version and drafts record the version used. Templates can only use whitelisted facts from the slot and
 * the organisation (no clinical content can be inserted), must say how to take the slot and by when, and must carry
 * the opt-out instruction.
 */
import type { PoolClient } from "pg";
import { z } from "zod";

import { getDeploymentEnvironment } from "../env/deployment";
import { audit, withTenant, type NetworkContext } from "../network/db";
import { NetworkError } from "../network/service";
import { APPOINTMENT_TYPE_LABEL } from "./eligibility";

export const TEMPLATE_PLACEHOLDERS = {
  givenName: "Patient's first name",
  organisationName: "Your organisation's name",
  appointmentType: "Appointment type, for example 'diabetes review'",
  when: "Day, date and time of the appointment",
  site: "' at <site>' when the slot has a site, otherwise nothing",
  replyBy: "When the offer closes",
} as const;
export type TemplateFacts = { givenName: string; organisationName: string; appointmentType: string; startsAt: string; site: string | null; offerExpiresAt: string; timeZone?: string };

export const DEFAULT_TEMPLATE =
  "Hello {givenName}, {organisationName} has an earlier {appointmentType} available on {when}{site}. Reply YES by {replyBy} to take it, or ignore this message to keep your current place. Reply STOP to stop these messages.";
export const DEFAULT_TEMPLATE_VERSION = "offer-template-v1";

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;

/** Problems with a proposed template, in plain words. Empty means it can be approved. Pure. */
export function templateProblems(body: string): string[] {
  const problems: string[] = [];
  const text = body.trim();
  if (text.length < 40) problems.push("The message is too short.");
  if (text.length > 640) problems.push("Keep the message under 640 characters (four SMS segments).");
  const used = [...text.matchAll(PLACEHOLDER)].map((m) => m[1]!);
  const unknown = [...new Set(used.filter((p) => !(p in TEMPLATE_PLACEHOLDERS)))];
  if (unknown.length) problems.push(`Unknown placeholder${unknown.length > 1 ? "s" : ""}: ${unknown.map((u) => `{${u}}`).join(", ")}. Only slot and organisation facts can be inserted.`);
  if (/[{}]/.test(text.replace(PLACEHOLDER, ""))) problems.push("A brace is not part of a placeholder.");
  for (const required of ["when", "replyBy"] as const) {
    if (!used.includes(required)) problems.push(`Include {${required}} so the patient knows ${required === "when" ? "when the appointment is" : "when the offer closes"}.`);
  }
  if (!/\bSTOP\b/.test(text)) problems.push("Include the opt-out instruction (for example 'Reply STOP to stop these messages').");
  return problems;
}

/** Fill a template with the slot's facts. Pure. */
export function renderTemplate(body: string, f: TemplateFacts): string {
  const tz = f.timeZone ?? "UTC";
  const values: Record<keyof typeof TEMPLATE_PLACEHOLDERS, string> = {
    givenName: f.givenName,
    organisationName: f.organisationName,
    appointmentType: APPOINTMENT_TYPE_LABEL[f.appointmentType] ?? f.appointmentType.replace(/_/g, " "),
    when: new Date(f.startsAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz }),
    site: f.site ? ` at ${f.site}` : "",
    replyBy: new Date(f.offerExpiresAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }),
  };
  return body.replace(PLACEHOLDER, (_, k: string) => (k in values ? values[k as keyof typeof values] : `{${k}}`));
}

export const SAMPLE_FACTS: TemplateFacts = {
  givenName: "Sam",
  organisationName: "Your clinic",
  appointmentType: "diabetes_review",
  startsAt: "2026-11-05T09:40:00Z",
  site: "Main site",
  offerExpiresAt: "2026-11-04T18:00:00Z",
  timeZone: "UTC",
};

/** The template in force for an organisation: its latest approved version, or the built-in default. */
export async function activeTemplate(client: PoolClient, orgId: string): Promise<{ body: string; version: string }> {
  const row = (await client.query<{ body: string; version: number }>(
    `SELECT body, version FROM aksh.offer_templates WHERE organisation_id = $1 ORDER BY version DESC LIMIT 1`,
    [orgId]
  )).rows[0];
  return row ? { body: row.body, version: `org-template-v${row.version}` } : { body: DEFAULT_TEMPLATE, version: DEFAULT_TEMPLATE_VERSION };
}

export const approveTemplateSchema = z.object({ body: z.string().trim().min(1).max(640), note: z.string().trim().max(500).optional() });

export async function listTemplates(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) => {
    const versions = (await client.query<{ version: number; body: string; note: string | null; created_by: string; created_at: Date; approver: string | null }>(
      `SELECT t.version, t.body, t.note, t.created_by, t.created_at,
              (SELECT m.display_name FROM aksh.memberships m WHERE m.organisation_id = t.organisation_id AND m.user_id = t.created_by LIMIT 1) AS approver
       FROM aksh.offer_templates t WHERE t.organisation_id = $1 ORDER BY t.version DESC`,
      [orgId]
    )).rows;
    const active = versions[0] ? { body: versions[0].body, version: `org-template-v${versions[0].version}` } : { body: DEFAULT_TEMPLATE, version: DEFAULT_TEMPLATE_VERSION };
    return {
      active: { ...active, preview: renderTemplate(active.body, SAMPLE_FACTS) },
      placeholders: TEMPLATE_PLACEHOLDERS,
      versions: versions.map((v) => ({ version: v.version, body: v.body, note: v.note, approvedBy: v.approver ?? v.created_by, approvedAt: v.created_at.toISOString() })),
    };
  });
}

/** An organisation admin approves new wording. It applies to offers drafted from now on. */
export async function approveTemplate(ctx: NetworkContext, orgId: string, input: z.infer<typeof approveTemplateSchema>) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can approve offer wording", 403);
  const problems = templateProblems(input.body);
  if (problems.length) throw new NetworkError(`TEMPLATE_INVALID: ${problems.join(" ")}`, 400);
  return withTenant(ctx, async (client) => {
    const next = (await client.query<{ v: number }>(`SELECT coalesce(max(version), 0) + 1 AS v FROM aksh.offer_templates WHERE organisation_id = $1`, [orgId])).rows[0]!.v;
    await client.query(
      `INSERT INTO aksh.offer_templates (organisation_id, version, body, note, created_by, environment) VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, next, input.body.trim(), input.note ?? null, ctx.userId, getDeploymentEnvironment()]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "offer_template.approved", resourceType: "organisation", resourceId: orgId, detail: { version: next } });
    return { version: next, preview: renderTemplate(input.body.trim(), SAMPLE_FACTS) };
  });
}
