/**
 * The capability register (PRD v1.1 PA-10, §8.1, §17): for one organisation, what is switched on, in which
 * environment, and the machine-readable honesty fields. Read-only; every value comes from configuration or code, never
 * from what a screen appears to show.
 */
import { CONNECTOR_CAPABILITIES, adapterEnvironment } from "../connector/service";
import { getDeploymentEnvironment } from "../env/deployment";
import { withTenant, type NetworkContext } from "../network/db";
import { NetworkError } from "../network/service";
import { activeTemplate } from "./templates";
import { RULE_VERSION } from "./eligibility";
import { WEEKLY_REVIEW_VERSION } from "./weekly-review";

export async function getCapabilityRegister(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) => {
    const org = (await client.query<{ name: string; status: string; pilot_stage: string; verified_at: Date | null }>(
      `SELECT name, status, pilot_stage, verified_at FROM aksh.organisations WHERE id = $1`,
      [orgId]
    )).rows[0];
    if (!org) throw new NetworkError("Organisation not found", 404);
    const keys = (await client.query<{ active: number }>(`SELECT count(*) FILTER (WHERE revoked_at IS NULL)::int AS active FROM aksh.connector_keys WHERE organisation_id = $1`, [orgId])).rows[0]!;
    const template = await activeTemplate(client, orgId);
    const stages = (await client.query<{ to_stage: string; note: string; created_at: Date }>(
      `SELECT to_stage, note, created_at FROM aksh.pilot_stage_events WHERE organisation_id = $1 ORDER BY id DESC LIMIT 5`,
      [orgId]
    )).rows;
    const live = Boolean(org.verified_at) && (org.status === "live_read_only" || org.status === "live");
    return {
      organisation: { id: orgId, name: org.name, status: org.status },
      deployment: getDeploymentEnvironment(),
      workflow: {
        name: "patient_access.cancellation_slot_fill",
        mode: live ? (org.pilot_stage === "staff_assisted" ? "staff_assisted" : "shadow") : "rehearsal",
        contactExecutedBy: "staff",
        ruleVersion: RULE_VERSION,
        templateVersion: template.version,
        metricVersion: "slot-fill-v1.2",
        reportVersion: WEEKLY_REVIEW_VERSION,
      },
      stageHistory: stages.map((s) => ({ stage: s.to_stage, note: s.note, at: s.created_at.toISOString() })),
      connectors: { active: keys.active, environment: adapterEnvironment(), capabilities: CONNECTOR_CAPABILITIES },
      // §8.1 machine-readable honesty fields: literal and testable.
      honesty: {
        liveEmis: false,
        ehrWrite: false,
        messagesSentByAksh: false,
        bookingConfirmedOnlyByReadBack: true,
        hitlRequired: true,
        aiOnPatientData: false,
        autoRetrain: false,
        physiologicalTwin: false,
        PRISM_ATLAS_live: false,
      },
    };
  });
}
