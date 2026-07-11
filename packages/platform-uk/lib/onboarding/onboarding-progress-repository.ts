import { getPgPool, isPostgresConfigured } from "@/lib/db/client";
import type { UserRole } from "@/lib/onboarding/roles";
import type {
  ConsentData,
  IdentityData,
  OrganisationData,
  PreferencesData,
} from "@/lib/onboarding/validation";

export type OnboardingProgressRecord = {
  userId: string;
  role: UserRole | null;
  currentStep: number;
  totalSteps: number | null;
  identity: IdentityData;
  organisation: OrganisationData;
  preferences: PreferencesData;
  consents: ConsentData;
  tutorialScreen: number;
  completedSteps: number[];
  savedAt: string;
  updatedAt: string;
};

export type UpsertOnboardingProgressInput = {
  userId: string;
  role?: UserRole | null;
  currentStep?: number;
  totalSteps?: number | null;
  identity?: IdentityData;
  organisation?: OrganisationData;
  preferences?: PreferencesData;
  consents?: ConsentData;
  tutorialScreen?: number;
  completedSteps?: number[];
};

type OnboardingProgressRow = {
  user_id: string;
  role: string | null;
  current_step: number;
  total_steps: number | null;
  identity: IdentityData | null;
  organisation: OrganisationData | null;
  preferences: PreferencesData | null;
  consents: ConsentData | null;
  tutorial_screen: number | null;
  completed_steps: number[] | null;
  saved_at: Date;
  updated_at: Date;
};

function mapRow(row: OnboardingProgressRow): OnboardingProgressRecord {
  return {
    userId: row.user_id,
    role: (row.role as UserRole | null) ?? null,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    identity: row.identity ?? {},
    organisation: row.organisation ?? {},
    preferences: row.preferences ?? {},
    consents: row.consents ?? {},
    tutorialScreen: row.tutorial_screen ?? 0,
    completedSteps: row.completed_steps ?? [],
    savedAt: row.saved_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getOnboardingProgress(
  userId: string
): Promise<OnboardingProgressRecord | null> {
  if (!isPostgresConfigured()) return null;

  const pool = getPgPool();
  const result = await pool.query<OnboardingProgressRow>(
    `SELECT user_id, role, current_step, total_steps, identity, organisation,
            preferences, consents, tutorial_screen, completed_steps, saved_at, updated_at
     FROM aksh.onboarding_progress
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function upsertOnboardingProgress(
  input: UpsertOnboardingProgressInput
): Promise<OnboardingProgressRecord> {
  if (!isPostgresConfigured()) {
    throw new Error("Database is not configured");
  }

  const pool = getPgPool();
  const result = await pool.query<OnboardingProgressRow>(
    `INSERT INTO aksh.onboarding_progress (
       user_id, role, current_step, total_steps, identity, organisation,
       preferences, consents, tutorial_screen, completed_steps, saved_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       role = COALESCE(EXCLUDED.role, aksh.onboarding_progress.role),
       current_step = COALESCE(EXCLUDED.current_step, aksh.onboarding_progress.current_step),
       total_steps = COALESCE(EXCLUDED.total_steps, aksh.onboarding_progress.total_steps),
       identity = COALESCE(EXCLUDED.identity, aksh.onboarding_progress.identity),
       organisation = COALESCE(EXCLUDED.organisation, aksh.onboarding_progress.organisation),
       preferences = COALESCE(EXCLUDED.preferences, aksh.onboarding_progress.preferences),
       consents = COALESCE(EXCLUDED.consents, aksh.onboarding_progress.consents),
       tutorial_screen = COALESCE(EXCLUDED.tutorial_screen, aksh.onboarding_progress.tutorial_screen),
       completed_steps = COALESCE(EXCLUDED.completed_steps, aksh.onboarding_progress.completed_steps),
       saved_at = NOW(),
       updated_at = NOW()
     RETURNING user_id, role, current_step, total_steps, identity, organisation,
               preferences, consents, tutorial_screen, completed_steps, saved_at, updated_at`,
    [
      input.userId,
      input.role ?? null,
      input.currentStep ?? 0,
      input.totalSteps ?? null,
      JSON.stringify(input.identity ?? {}),
      JSON.stringify(input.organisation ?? {}),
      JSON.stringify(input.preferences ?? {}),
      JSON.stringify(input.consents ?? {}),
      input.tutorialScreen ?? 0,
      input.completedSteps ?? [],
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to save onboarding progress");
  }

  return mapRow(row);
}

export async function clearOnboardingProgress(userId: string): Promise<void> {
  if (!isPostgresConfigured()) return;

  const pool = getPgPool();
  await pool.query(`DELETE FROM aksh.onboarding_progress WHERE user_id = $1`, [userId]);
}
