import { createHash, randomBytes } from "node:crypto";

import { hash } from "bcryptjs";

import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import { PASSWORD_RESET_SQL } from "@/lib/db/schema-sql";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function createTokenId() {
  return `prt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensurePasswordResetSchema() {
  if (!isPostgresConfigured()) return;

  await getPgPool().query(PASSWORD_RESET_SQL);
}

export async function createPasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  await ensurePasswordResetSchema();

  const pool = getPgPool();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const id = createTokenId();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await pool.query(`DELETE FROM aksh.password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`, [userId]);

  await pool.query(
    `INSERT INTO aksh.password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt.toISOString()]
  );

  return { token, expiresAt };
}

export async function validatePasswordResetToken(token: string): Promise<{ userId: string } | null> {
  if (!isPostgresConfigured()) return null;

  await ensurePasswordResetSchema();

  const pool = getPgPool();
  const tokenHash = hashToken(token);

  const result = await pool.query<{
    id: string;
    user_id: string;
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT id, user_id, expires_at, used_at
     FROM aksh.password_reset_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  return { userId: row.user_id };
}

export async function consumePasswordResetToken(token: string, newPassword: string): Promise<boolean> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  const valid = await validatePasswordResetToken(token);
  if (!valid) return false;

  const pool = getPgPool();
  const tokenHash = hashToken(token);
  const passwordHash = await hash(newPassword, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateUser = await client.query(
      `UPDATE aksh.users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, valid.userId]
    );

    if (updateUser.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `UPDATE aksh.password_reset_tokens
       SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL`,
      [tokenHash]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
