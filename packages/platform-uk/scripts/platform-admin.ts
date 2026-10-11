/**
 * Grant or revoke Aksh platform admin (go-live reviewers). The person must already have an account.
 *
 *   npx tsx --env-file=.env.local scripts/platform-admin.ts --email someone@example.com --note "Go-live reviewer"
 *   npx tsx --env-file=.env.production.local scripts/platform-admin.ts --email someone@example.com --revoke
 *   npx tsx --env-file=.env.local scripts/platform-admin.ts --list
 */
import os from "node:os";

import pg from "pg";

import { DEPLOYMENT_ENVIRONMENTS, getDeploymentEnvironment } from "../lib/env/deployment";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");
  // Privilege changes must say where they happened: no silent "local" fallback.
  const declared = process.env.AKSH_ENVIRONMENT?.trim().toLowerCase();
  if (!declared || !(DEPLOYMENT_ENVIRONMENTS as readonly string[]).includes(declared)) {
    throw new Error(`Set AKSH_ENVIRONMENT to one of ${DEPLOYMENT_ENVIRONMENTS.join(", ")} in the env file you pass (got "${declared ?? ""}").`);
  }
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const env = getDeploymentEnvironment();
  try {
    if (process.argv.includes("--list")) {
      const r = await pool.query(`SELECT u.email, p.granted_at, p.granted_by, p.note FROM aksh.platform_admins p JOIN aksh.users u ON u.id = p.user_id ORDER BY p.granted_at`);
      console.log(`Environment: ${env} · ${r.rowCount} platform admins`);
      for (const row of r.rows) console.log(`  ${row.email}  since ${new Date(row.granted_at).toISOString().slice(0, 10)}  by ${row.granted_by}${row.note ? `  (${row.note})` : ""}`);
      return;
    }
    const email = arg("email")?.trim().toLowerCase();
    if (!email) throw new Error("Pass --email (or --list).");
    const user = (await pool.query<{ id: string }>(`SELECT id FROM aksh.users WHERE lower(email) = $1`, [email])).rows[0];
    if (!user) throw new Error(`No account for ${email}. They must sign up first.`);
    const by = `script:${os.userInfo().username}`;
    const action = process.argv.includes("--revoke") ? "platform_admin.revoked" : "platform_admin.granted";
    // The change and its audit record commit together or not at all.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (action === "platform_admin.revoked") {
        await client.query(`DELETE FROM aksh.platform_admins WHERE user_id = $1`, [user.id]);
      } else {
        await client.query(`INSERT INTO aksh.platform_admins (user_id, granted_by, note) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET note = EXCLUDED.note`, [user.id, by, arg("note") ?? null]);
      }
      await client.query(
        `INSERT INTO aksh.network_audit_events (actor_user_id, action, resource_type, resource_id, detail, environment) VALUES (NULL, $1, 'user', $2, $3::jsonb, $4)`,
        [action, user.id, JSON.stringify({ by }), env]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    console.log(`${env}: ${action} for ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
