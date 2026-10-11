/**
 * Retention: delete what we have said we keep only for a limited time. Clinical records, consent, audit and go-live
 * history are not touched here; their periods are set in the data processing agreement (legal review pending).
 */
import { getPgPool } from "@/lib/db/client";
import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { audit, withPrivileged } from "@/lib/network/db";

export const RETENTION = {
  errorEventsDays: 90,
  rateLimitHours: 24,
} as const;

export async function runRetention() {
  const result = await withPrivileged(async (client) => {
    const errors = await client.query(`DELETE FROM aksh.error_events WHERE occurred_at < NOW() - make_interval(days => $1)`, [RETENTION.errorEventsDays]);
    const limits = await client.query(`DELETE FROM aksh.rate_limits WHERE window_start < NOW() - make_interval(hours => $1)`, [RETENTION.rateLimitHours]);
    const counts = { errorEvents: errors.rowCount ?? 0, rateLimitWindows: limits.rowCount ?? 0 };
    await audit(client, { action: "retention.run", resourceType: "system", detail: { ...counts, policy: RETENTION } });
    return counts;
  });
  return { environment: getDeploymentEnvironment(), ...result, policy: RETENTION };
}

/** For tests: is the pool reachable. */
export async function retentionHealth() {
  return (await getPgPool().query("SELECT 1")).rowCount === 1;
}
