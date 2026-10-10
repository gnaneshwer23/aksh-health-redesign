import type { PoolClient } from "pg";

import { getPgPool } from "@/lib/db/client";
import { getDeploymentEnvironment } from "@/lib/env/deployment";

/** Who is acting and what they may see. Resolved server-side from the session; never from the request body. */
export type NetworkContext = {
  userId: string;
  orgIds: string[];
  patientIds: string[];
  /** Organisations where the user is an admin (may invite, change settings). */
  adminOrgIds: string[];
  /** Platform role from the profile (gp, nurse, clinical-pharmacist, practice-manager, patient, ...). */
  role: string | null;
  /** Signed-out visitor of a non-production deployment viewing public demo organisations. */
  publicDemo: boolean;
};

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Run `fn` as the restricted aksh_tenant role with the caller's organisation and patient scope set for this
 * transaction only. Row-level security then decides every row; application filters are a second line, not the first.
 */
export async function withTenant<T>(ctx: NetworkContext, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  for (const id of [ctx.userId, ...ctx.orgIds, ...ctx.patientIds]) {
    if (!ID.test(id)) throw new Error("Invalid identifier in network context");
  }
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE aksh_tenant");
    await client.query(
      `SELECT set_config('app.user_id', $1, true), set_config('app.org_ids', $2, true), set_config('app.patient_ids', $3, true)`,
      [ctx.userId, ctx.orgIds.join(","), ctx.patientIds.join(",")]
    );
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Privileged transaction (owner role) for the few operations that happen before the caller belongs to an
 * organisation: creating an organisation, accepting an invite, resolving context. Each one writes an audit event.
 */
export async function withPrivileged<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function audit(
  client: PoolClient,
  event: { organisationId?: string | null; actorUserId?: string | null; action: string; resourceType: string; resourceId?: string | null; detail?: Record<string, unknown> }
) {
  await client.query(
    `INSERT INTO aksh.network_audit_events (organisation_id, actor_user_id, action, resource_type, resource_id, detail, environment)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      event.organisationId ?? null,
      event.actorUserId ?? null,
      event.action,
      event.resourceType,
      event.resourceId ?? null,
      JSON.stringify(event.detail ?? {}),
      getDeploymentEnvironment(),
    ]
  );
}
