import { createHash, randomBytes } from "node:crypto";

import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import { EMAIL_VERIFICATION_SQL } from "@/lib/db/schema-sql";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function createTokenId() {
  return `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureEmailVerificationSchema() {
  if (!isPostgresConfigured()) return;

  await getPgPool().query(EMAIL_VERIFICATION_SQL);
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  if (!isPostgresConfigured()) return true;

  await ensureEmailVerificationSchema();

  const pool = getPgPool();
  const result = await pool.query<{ email_verified_at: Date | null }>(
    `SELECT email_verified_at FROM aksh.users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  return Boolean(result.rows[0]?.email_verified_at);
}

export async function markEmailVerified(userId: string): Promise<void> {
  if (!isPostgresConfigured()) return;

  await ensureEmailVerificationSchema();

  const pool = getPgPool();
  await pool.query(`UPDATE aksh.users SET email_verified_at = NOW() WHERE id = $1`, [userId]);
}

export async function createEmailVerificationToken(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  await ensureEmailVerificationSchema();

  const pool = getPgPool();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const id = createTokenId();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await pool.query(`DELETE FROM aksh.email_verification_tokens WHERE user_id = $1 AND used_at IS NULL`, [
    userId,
  ]);

  await pool.query(
    `INSERT INTO aksh.email_verification_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt.toISOString()]
  );

  return { token, expiresAt };
}

export type EmailVerificationValidation =
  | { status: "valid"; userId: string }
  | { status: "expired" }
  | { status: "invalid" };

export async function validateEmailVerificationToken(token: string): Promise<EmailVerificationValidation> {
  if (!isPostgresConfigured()) return { status: "invalid" };

  await ensureEmailVerificationSchema();

  const pool = getPgPool();
  const tokenHash = hashToken(token);

  const result = await pool.query<{
    id: string;
    user_id: string;
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT id, user_id, expires_at, used_at
     FROM aksh.email_verification_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) return { status: "invalid" };
  if (row.used_at) return { status: "invalid" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { status: "expired" };

  return { status: "valid", userId: row.user_id };
}

export async function consumeEmailVerificationToken(token: string): Promise<EmailVerificationValidation> {
  const validation = await validateEmailVerificationToken(token);
  if (validation.status !== "valid") return validation;

  const pool = getPgPool();
  const tokenHash = hashToken(token);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`UPDATE aksh.users SET email_verified_at = NOW() WHERE id = $1`, [validation.userId]);

    await client.query(
      `UPDATE aksh.email_verification_tokens
       SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL`,
      [tokenHash]
    );

    await client.query("COMMIT");
    return validation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function buildEmailVerificationUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export function shouldSkipEmailSend() {
  return process.env.SKIP_EMAIL_SEND?.trim() === "true";
}
