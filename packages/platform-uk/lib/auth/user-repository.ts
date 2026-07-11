import { hash } from "bcryptjs";

import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import type { UserRole } from "@/lib/onboarding/roles";

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
};

export type DbProfile = {
  userId: string;
  role: UserRole;
  fullName: string | null;
  onboardingComplete: boolean;
  practiceOds: string | null;
  preferences: Record<string, unknown>;
};

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  onboardingComplete: boolean;
};

function createUserId() {
  return `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapProfileRow(row: {
  user_id: string;
  role: string;
  full_name: string | null;
  onboarding_complete: boolean;
  practice_ods: string | null;
  preferences: Record<string, unknown> | null;
}): DbProfile {
  return {
    userId: row.user_id,
    role: row.role as UserRole,
    fullName: row.full_name,
    onboardingComplete: row.onboarding_complete,
    practiceOds: row.practice_ods,
    preferences: row.preferences ?? {},
  };
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (!isPostgresConfigured()) return null;

  const pool = getPgPool();
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
  }>(
    `SELECT id, email, password_hash FROM aksh.users WHERE email = $1 LIMIT 1`,
    [normalizeEmail(email)]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
  };
}

export async function findProfileByUserId(userId: string): Promise<DbProfile | null> {
  if (!isPostgresConfigured()) return null;

  const pool = getPgPool();
  const result = await pool.query<{
    user_id: string;
    role: string;
    full_name: string | null;
    onboarding_complete: boolean;
    practice_ods: string | null;
    preferences: Record<string, unknown> | null;
  }>(
    `SELECT user_id, role, full_name, onboarding_complete, practice_ods, preferences
     FROM aksh.profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapProfileRow(row) : null;
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const profile = await findProfileByUserId(user.id);

  return {
    id: user.id,
    email: user.email,
    name: profile?.fullName ?? null,
    role: profile?.role ?? "gp",
    onboardingComplete: profile?.onboardingComplete ?? false,
  };
}

export async function createUserWithProfile(input: {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string | null;
}): Promise<AuthUserRecord> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  const pool = getPgPool();
  const id = createUserId();
  const email = normalizeEmail(input.email);
  const passwordHash = await hash(input.password, 10);
  const fullName = input.fullName?.trim() || null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, $3)`,
      [id, email, passwordHash]
    );
    await client.query(
      `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete)
       VALUES ($1, $2, $3, FALSE)`,
      [id, input.role, fullName]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    id,
    email,
    name: fullName,
    role: input.role,
    onboardingComplete: false,
  };
}

export async function completeOnboarding(input: {
  userId: string;
  role: UserRole;
  fullName?: string | null;
  practiceOds?: string | null;
  preferences?: Record<string, unknown>;
}): Promise<DbProfile> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  const pool = getPgPool();
  const result = await pool.query<{
    user_id: string;
    role: string;
    full_name: string | null;
    onboarding_complete: boolean;
    practice_ods: string | null;
    preferences: Record<string, unknown> | null;
  }>(
    `UPDATE aksh.profiles
     SET role = $2,
         full_name = COALESCE($3, full_name),
         practice_ods = COALESCE($4, practice_ods),
         preferences = COALESCE($5::jsonb, preferences),
         onboarding_complete = TRUE,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, role, full_name, onboarding_complete, practice_ods, preferences`,
    [
      input.userId,
      input.role,
      input.fullName?.trim() || null,
      input.practiceOds?.trim() || null,
      input.preferences ? JSON.stringify(input.preferences) : null,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Profile not found");
  }

  return mapProfileRow(row);
}

export async function ensureAuthSchema() {
  if (!isPostgresConfigured()) return;

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const migrationPath = path.join(process.cwd(), "db/migrations/002_users_profiles.sql");
  const sql = await readFile(migrationPath, "utf8");
  await getPgPool().query(sql);
}
