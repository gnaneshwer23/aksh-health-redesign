import type { Pool, PoolClient } from "pg";
import { Pool as PgPool } from "pg";

let pool: Pool | null = null;

export function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.USE_POSTGRES === "true");
}

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    "postgresql://medplum:medplum_password@localhost:5432/akshhealth"
  );
}

function shouldUseSsl(connectionString: string) {
  if (process.env.PGSSLMODE === "disable") return false;
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/sslmode=(require|verify-full|verify-ca|prefer)/i.test(connectionString)) return true;
  return /neon\.tech|supabase\.co|amazonaws\.com|rds\.amazonaws\.com/i.test(connectionString);
}

export function getPgPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    pool = new PgPool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
      ...(shouldUseSsl(connectionString)
        ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" } }
        : {})
    });
    // A dropped idle connection (e.g. server-side timeout) must not crash the process; the pool replaces it.
    pool.on("error", (error) => {
      console.error("[db] idle client error:", error.message);
    });
  }
  return pool;
}

export async function withPracticeContext<T>(
  practiceId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.practice_id', $1, true)", [practiceId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePgPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
