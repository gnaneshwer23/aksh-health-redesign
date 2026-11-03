/** Operator-only grant for an EXISTING Aksh account. No HTTP/signup grant path exists. */
import { Pool } from "pg";
import { akshDatabaseConnectionOptions } from "../lib/db/connection-options";
const [ownerId, role] = process.argv.slice(2);
if (!ownerId || !/^[A-Za-z0-9_-]{3,64}$/.test(ownerId) || !["researcher", "reviewer", "admin"].includes(role ?? "")) throw new Error("Usage: bun scripts/provision-hsi-research.ts <existing-user-id> <researcher|reviewer|admin>");
const raw = process.env.DATABASE_URL?.trim(); if (!raw) throw new Error("Aksh database configuration is required");
const pool = new Pool({ ...akshDatabaseConnectionOptions(raw), max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT set_config('app.hsi_research_owner',$1,true)", [ownerId]);
  const user = await client.query("SELECT id FROM aksh.users WHERE id=$1", [ownerId]);
  if (!user.rows.length) throw new Error("An existing Aksh account is required");
  await client.query("INSERT INTO aksh.hsi_research_members(owner_id,role) VALUES($1,$2) ON CONFLICT(owner_id) DO UPDATE SET role=EXCLUDED.role,provisioned_at=now()", [ownerId,role]);
  await client.query("COMMIT"); console.log("Research role provisioned for the specified existing account.");
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { client.release(); await pool.end(); }
