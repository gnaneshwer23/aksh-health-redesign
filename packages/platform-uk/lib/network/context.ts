import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import { getDeploymentEnvironment } from "@/lib/env/deployment";

import type { NetworkContext } from "./db";

/** Identity used for signed-out public-demo reads; never written anywhere. */
export const PUBLIC_DEMO_USER = "public-demo";

/** Load memberships and patient links for a user (owner query: runs before any tenant scope exists). */
export async function loadNetworkContext(userId: string, role: string | null): Promise<NetworkContext> {
  const pool = getPgPool();
  const [memberships, links] = await Promise.all([
    pool.query<{ organisation_id: string; is_admin: boolean }>(
      `SELECT m.organisation_id, m.is_admin FROM aksh.memberships m
       JOIN aksh.organisations o ON o.id = m.organisation_id
       WHERE m.user_id = $1 AND m.status = 'active' AND o.status <> 'suspended'`,
      [userId]
    ),
    pool.query<{ patient_id: string }>(`SELECT patient_id FROM aksh.patient_accounts WHERE user_id = $1`, [userId]),
  ]);
  return {
    userId,
    role,
    orgIds: memberships.rows.map((r) => r.organisation_id),
    adminOrgIds: memberships.rows.filter((r) => r.is_admin).map((r) => r.organisation_id),
    patientIds: links.rows.map((r) => r.patient_id),
    publicDemo: false,
  };
}

/** Signed-out visitors of simulation/preview/local deployments see organisations flagged public_demo. Never in production. */
export async function loadPublicDemoContext(): Promise<NetworkContext | null> {
  if (getDeploymentEnvironment() === "production") return null;
  const { rows } = await getPgPool().query<{ id: string }>(`SELECT id FROM aksh.organisations WHERE public_demo = TRUE`);
  if (!rows.length) return null;
  return { userId: PUBLIC_DEMO_USER, role: null, orgIds: rows.map((r) => r.id), adminOrgIds: [], patientIds: [], publicDemo: true };
}

/** Context for the current request: the signed-in user's scope, or the public demo scope, or null. */
export async function requestNetworkContext(): Promise<NetworkContext | null> {
  if (!isPostgresConfigured()) return null;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (userId) return loadNetworkContext(userId, (session.user as { role?: string }).role ?? null);
  return loadPublicDemoContext();
}
