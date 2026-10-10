/**
 * Per-request patient directory for Front Desk and Asha. Patients come from the database, scoped by row-level
 * security to the caller's organisations (or, on non-production deployments, the public demo organisations).
 * AsyncLocalStorage keeps each request's directory separate, so one organisation's patients can never be matched in
 * another organisation's conversation running in the same server process.
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { isPostgresConfigured } from "@/lib/db/client";
import { requestNetworkContext } from "@/lib/network/context";
import { withTenant, type NetworkContext } from "@/lib/network/db";

export type DirectoryPatient = { id: string; name: string; dob: string; market: string };

const store = new AsyncLocalStorage<DirectoryPatient[]>();

/** Locale → safety-message code. Unknown numbers map to "OTHER", which uses generic wording. */
function marketFromLocale(locale: Record<string, string> | null): string {
  switch (locale?.emergencyNumber) {
    case "999":
      return "GB";
    case "112":
      return "IN";
    case "911":
      return "US";
    case "998":
      return "AE";
    default:
      return "OTHER";
  }
}

export async function loadDirectory(ctx: NetworkContext | null): Promise<DirectoryPatient[]> {
  if (!ctx || !isPostgresConfigured()) return [];
  return withTenant(ctx, async (client) => {
    const { rows } = await client.query<{ id: string; given_name: string; family_name: string; dob: string; locale: Record<string, string> | null }>(
      `SELECT p.id, p.given_name, p.family_name, to_char(p.date_of_birth, 'YYYY-MM-DD') AS dob, o.locale
       FROM aksh.network_patients p LEFT JOIN aksh.organisations o ON o.id = p.organisation_id
       WHERE p.organisation_id = ANY (aksh.ctx_org_ids())`
    );
    return rows.map((r) => ({ id: r.id, name: `${r.given_name} ${r.family_name}`, dob: r.dob, market: marketFromLocale(r.locale) }));
  });
}

/** Run a Front Desk request with the caller's directory available to the (synchronous) conversation engine. */
export async function withDeskDirectory<T>(fn: () => Promise<T>): Promise<T> {
  let patients: DirectoryPatient[] = [];
  try {
    patients = await loadDirectory(await requestNetworkContext());
  } catch (error) {
    // Directory unavailable: the conversation still works for the demo cohort and hands off unknown callers.
    console.error("[front-desk] directory load failed:", error instanceof Error ? error.message : error);
  }
  return store.run(patients, fn);
}

export function currentDirectory(): DirectoryPatient[] {
  return store.getStore() ?? [];
}

/** Tests and scripts: run with an explicit directory. */
export function runWithDirectory<T>(patients: DirectoryPatient[], fn: () => T): T {
  return store.run(patients, fn);
}
