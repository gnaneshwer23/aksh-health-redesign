import "server-only";
import { getPgPool } from "../db/client";
import type { InvestigationDatabase, InvestigationSql } from "./investigationBackend";

/** Verified NextAuth owner only. Never reads aksh_uid, practice headers, patient data or shared-file stores. */
export function akshInvestigationDatabase(ownerId: string): InvestigationDatabase {
  async function transaction<T>(work: (sql: InvestigationSql) => Promise<T>): Promise<T> {
    const client = await getPgPool().connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE aksh_tenant");
      await client.query("SELECT set_config('app.hsi_research_owner',$1,true)", [ownerId]);
      const result = await work({ query: async (text, values) => (await client.query(text, values)).rows });
      await client.query("COMMIT"); return result;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  return { transaction, query: (text, values) => transaction((sql) => sql.query(text, values)) };
}
