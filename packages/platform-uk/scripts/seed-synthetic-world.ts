/**
 * Seed sign-in accounts for the synthetic world: 100 healthcare professionals + 500 patients.
 *
 * Usage (from packages/platform-uk):
 *   npx tsx --env-file=.env.local scripts/seed-synthetic-world.ts            # dry run: counts + samples, no writes
 *   SYNTHETIC_WORLD_PASSWORD=... npx tsx --env-file=.env.local scripts/seed-synthetic-world.ts --apply
 *   SYNTHETIC_WORLD_PASSWORD=... npx tsx --env-file=.env.local scripts/seed-synthetic-world.ts --reset --apply
 *
 * Safety:
 * - Every account uses the reserved .example domain (aksh-synthetic.example); no real person can own it.
 * - No password is stored in source: SYNTHETIC_WORLD_PASSWORD must be provided for --apply.
 * - --reset deletes only accounts on that domain.
 * - Synthetic data only; never real patient data.
 */
import { randomUUID } from "node:crypto";

import { hash } from "bcryptjs";
import pg from "pg";

import { USERS_PROFILES_SQL } from "../lib/db/schema-sql";
import { getSyntheticWorld, SYNTHETIC_EMAIL_DOMAIN } from "../lib/synthetic-world/generate";
import { assertSeedingAllowed } from "../lib/env/deployment";

type Account = { email: string; role: string; fullName: string; preferences: Record<string, unknown> };

function buildAccounts(): Account[] {
  const w = getSyntheticWorld();
  const pros: Account[] = w.professionals.map((p) => ({
    email: p.email,
    role: p.platformRole,
    fullName: `${p.title} ${p.givenName} ${p.familyName}`,
    preferences: {
      syntheticOnly: true,
      syntheticWorld: true,
      professionalId: p.id,
      professionalRole: p.role,
      organisationId: p.organisationId,
      market: p.market,
    },
  }));
  const patients: Account[] = w.patients.map((p) => ({
    email: `patient.${p.id.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`,
    role: "patient",
    fullName: `${p.givenName} ${p.familyName}`,
    preferences: { syntheticOnly: true, syntheticWorld: true, boundPatientId: p.id, market: p.market, contactPreference: p.contactPreference },
  }));
  return [...pros, ...patients];
}

async function main() {
  assertSeedingAllowed("seed-synthetic-world");
  const apply = process.argv.includes("--apply");
  const reset = process.argv.includes("--reset");
  const accounts = buildAccounts();
  const byRole = accounts.reduce<Record<string, number>>((m, a) => ((m[a.role] = (m[a.role] ?? 0) + 1), m), {});
  console.log(`Synthetic world accounts: ${accounts.length}`, byRole);
  console.log("Samples:", accounts.slice(0, 3).map((a) => `${a.role} ${a.email}`).join(" | "));

  if (!apply) {
    console.log("Dry run only. Re-run with --apply and SYNTHETIC_WORLD_PASSWORD set to write accounts.");
    return;
  }
  const password = process.env.SYNTHETIC_WORLD_PASSWORD?.trim();
  if (!password || password.length < 12) throw new Error("Set SYNTHETIC_WORLD_PASSWORD (12+ characters) for --apply.");
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required for --apply.");

  const pool = new pg.Pool({ connectionString: url, max: 3 });
  try {
    await pool.query(USERS_PROFILES_SQL);
    if (reset) {
      const del = await pool.query(`DELETE FROM aksh.users WHERE email LIKE $1`, [`%@${SYNTHETIC_EMAIL_DOMAIN}`]);
      console.log(`Reset: deleted ${del.rowCount} synthetic-world accounts.`);
    }
    const passwordHash = await hash(password, 10);
    let inserted = 0;
    let updated = 0;
    for (const a of accounts) {
      const existing = await pool.query<{ id: string }>(`SELECT id FROM aksh.users WHERE email = $1 LIMIT 1`, [a.email]);
      const userId = existing.rows[0]?.id ?? randomUUID();
      if (existing.rows[0]) {
        await pool.query(`UPDATE aksh.users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1`, [userId, passwordHash]);
        updated += 1;
      } else {
        await pool.query(`INSERT INTO aksh.users (id, email, password_hash, email_verified_at) VALUES ($1, $2, $3, NOW())`, [userId, a.email, passwordHash]);
        inserted += 1;
      }
      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete, practice_ods, preferences)
         VALUES ($1, $2, $3, TRUE, NULL, $4::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name,
           onboarding_complete = TRUE, preferences = EXCLUDED.preferences, updated_at = NOW()`,
        [userId, a.role, a.fullName, JSON.stringify(a.preferences)]
      );
    }
    console.log(`Done: inserted ${inserted}, updated ${updated}.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
