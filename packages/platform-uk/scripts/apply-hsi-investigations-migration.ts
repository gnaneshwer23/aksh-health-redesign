/** Apply only 056 to Aksh. Does not run unrelated pending migrations. */
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { akshDatabaseConnectionOptions } from "../lib/db/connection-options";
const raw = process.env.DATABASE_URL?.trim();
if (!raw) throw new Error("Aksh product database configuration is required; HSI/ISI credentials must not be used");
const pool = new Pool({ ...akshDatabaseConnectionOptions(raw), max: 1 });
try {
  if (process.argv.includes("--apply")) {
    const client = await pool.connect();
    try { await client.query("BEGIN"); await client.query(await readFile(new URL("../db/migrations/056_hsi_investigations.sql", import.meta.url), "utf8")); await client.query("COMMIT"); }
    catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  const { rows } = await pool.query("SELECT to_regclass('aksh.hsi_investigations') IS NOT NULL AS installed");
  console.log(JSON.stringify({ product: "aksh", migration: "056_hsi_investigations", installed: rows[0]?.installed === true }));
} finally { await pool.end(); }
