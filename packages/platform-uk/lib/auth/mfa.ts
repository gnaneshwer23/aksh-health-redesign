/**
 * Two-step sign-in. Secrets are encrypted at rest (AES-256-GCM) with MFA_ENCRYPTION_KEY (base64, 32 bytes), held only in
 * the environment. Each code is accepted once. Eight single-use recovery codes are shown once and stored hashed.
 * In production a key is required; elsewhere a key derived from NEXTAUTH_SECRET is used so tests and previews work.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getPgPool } from "../db/client";
import { getDeploymentEnvironment } from "../env/deployment";

import { generateSecret, otpauthUri, stepAt, verifyTotp } from "./totp";

function key(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY?.trim();
  if (raw) {
    const k = Buffer.from(raw, "base64");
    if (k.length !== 32) throw new Error("MFA_ENCRYPTION_KEY must be 32 bytes, base64");
    return k;
  }
  if (getDeploymentEnvironment() === "production") throw new Error("MFA_ENCRYPTION_KEY is not set");
  return createHash("sha256").update(`aksh-mfa:${process.env.NEXTAUTH_SECRET ?? "local-development"}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(stored: string): string {
  const [v, iv, tag, enc] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !enc) throw new Error("Unreadable MFA secret");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
}

const hashCode = (code: string) => createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");

export async function mfaStatus(userId: string) {
  const r = await getPgPool().query<{ enabled_at: Date | null }>(`SELECT enabled_at FROM aksh.user_mfa WHERE user_id = $1`, [userId]);
  const left = await getPgPool().query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.user_mfa_recovery WHERE user_id = $1 AND used_at IS NULL`, [userId]);
  return { enabled: Boolean(r.rows[0]?.enabled_at), pending: Boolean(r.rows[0] && !r.rows[0].enabled_at), recoveryCodesLeft: left.rows[0]!.n };
}

export async function isMfaEnabled(userId: string) {
  return (await getPgPool().query(`SELECT 1 FROM aksh.user_mfa WHERE user_id = $1 AND enabled_at IS NOT NULL`, [userId])).rowCount === 1;
}

/** Start (or restart) enrolment: a new secret, not yet active. Refused while two-step sign-in is already on. */
export async function startEnrolment(userId: string, account: string) {
  if (await isMfaEnabled(userId)) throw new Error("ALREADY_ENABLED");
  const secret = generateSecret();
  await inTransaction(async (client) => {
    // Never replaces an active secret (only a pending one).
    const r = await client.query(
      `INSERT INTO aksh.user_mfa (user_id, secret_enc) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET secret_enc = EXCLUDED.secret_enc, last_used_step = NULL WHERE aksh.user_mfa.enabled_at IS NULL`,
      [userId, encryptSecret(secret)]
    );
    if (r.rowCount !== 1) throw new Error("ALREADY_ENABLED");
    await auditMfa(client, userId, "mfa.enrolment_started");
  });
  return { secret, uri: otpauthUri(secret, account) };
}

/** Confirm with a first code: turns it on and returns recovery codes (shown once). */
export async function confirmEnrolment(userId: string, code: string) {
  const row = (await getPgPool().query<{ secret_enc: string; enabled_at: Date | null }>(`SELECT secret_enc, enabled_at FROM aksh.user_mfa WHERE user_id = $1`, [userId])).rows[0];
  if (!row || row.enabled_at) throw new Error("NO_PENDING_ENROLMENT");
  const step = verifyTotp(decryptSecret(row.secret_enc), code);
  if (step === null) throw new Error("INVALID_CODE");
  // 80 bits per code (hashes are cheap to guess against at lower entropy), grouped for reading.
  const codes = Array.from({ length: 8 }, () => randomBytes(10).toString("hex").toUpperCase().match(/.{5}/g)!.join("-"));
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    // Only the first of two concurrent confirmations wins; the other changes nothing.
    const enabled = await client.query(`UPDATE aksh.user_mfa SET enabled_at = NOW(), last_used_step = $2 WHERE user_id = $1 AND enabled_at IS NULL`, [userId, step]);
    if (enabled.rowCount !== 1) throw new Error("NO_PENDING_ENROLMENT");
    await client.query(`DELETE FROM aksh.user_mfa_recovery WHERE user_id = $1`, [userId]);
    for (const c of codes) await client.query(`INSERT INTO aksh.user_mfa_recovery (user_id, code_hash) VALUES ($1, $2)`, [userId, hashCode(c)]);
    await auditMfa(client, userId, "mfa.enabled");
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
  return { recoveryCodes: codes };
}

/**
 * Check a sign-in code: an authenticator code (each accepted once, atomically) or an unused recovery code.
 * Returns how it was satisfied, or null.
 */
export async function verifySecondFactor(userId: string, code: string): Promise<"totp" | "recovery" | null> {
  const trimmed = code.trim();
  const row = (await getPgPool().query<{ secret_enc: string; last_used_step: string | null }>(
    `SELECT secret_enc, last_used_step FROM aksh.user_mfa WHERE user_id = $1 AND enabled_at IS NOT NULL`,
    [userId]
  )).rows[0];
  if (!row) return null;
  if (/^\d{6}$/.test(trimmed)) {
    const step = verifyTotp(decryptSecret(row.secret_enc), trimmed);
    if (step === null) return null;
    // Accept only a step later than the last one used: a code cannot be replayed, even within its 30 seconds.
    const r = await getPgPool().query(
      `UPDATE aksh.user_mfa SET last_used_step = $2 WHERE user_id = $1 AND (last_used_step IS NULL OR last_used_step < $2)`,
      [userId, step]
    );
    return r.rowCount === 1 ? "totp" : null;
  }
  const r = await getPgPool().query(
    `UPDATE aksh.user_mfa_recovery SET used_at = NOW() WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
    [userId, hashCode(trimmed)]
  );
  return r.rowCount === 1 ? "recovery" : null;
}

/** Turn off two-step sign-in (requires a current code or a recovery code). */
export async function disableMfa(userId: string, code: string) {
  if (!(await verifySecondFactor(userId, code))) throw new Error("INVALID_CODE");
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM aksh.user_mfa WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM aksh.user_mfa_recovery WHERE user_id = $1`, [userId]);
    await auditMfa(client, userId, "mfa.disabled");
  });
}

/** MFA changes and their audit record commit together. */
async function inTransaction<T>(fn: (client: import("pg").PoolClient) => Promise<T>) {
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

async function auditMfa(client: import("pg").PoolClient, userId: string, action: string) {
  await client.query(
    `INSERT INTO aksh.network_audit_events (actor_user_id, action, resource_type, resource_id, detail, environment) VALUES ($1, $2, 'user', $1, '{}'::jsonb, $3)`,
    [userId, action, getDeploymentEnvironment()]
  );
}

export const currentStep = () => stepAt(Date.now());
