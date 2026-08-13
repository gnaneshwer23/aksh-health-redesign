/**
 * E2E environment contract — safe dev/test only.
 */

export function isE2ETestMode(): boolean {
  return process.env.E2E_TEST_MODE === "true" || process.env.SYNTHETIC_DATA === "true";
}

export function isSyntheticDataEnabled(): boolean {
  return process.env.SYNTHETIC_DATA === "true" || isE2ETestMode();
}

/** Block E2E admin surfaces in real production unless explicitly overridden. */
export function isE2EAdminSurfaceAllowed(): boolean {
  if (process.env.E2E_ADMIN_ENABLED === "true") return true;
  // Playwright CI builds with NODE_ENV=production but still sets E2E_TEST_MODE.
  if (isE2ETestMode()) return true;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

export function resolveE2EPassword(): string {
  return process.env.E2E_PASSWORD?.trim() || "AkshE2E!2026";
}

export function buildE2EEnvironmentContract() {
  return {
    e2eTestMode: isE2ETestMode(),
    syntheticData: isSyntheticDataEnabled(),
    adminSurfaceAllowed: isE2EAdminSurfaceAllowed(),
    liveEmis: false,
    autoRetrain: false,
    source: "AKSH_E2E_TEST",
    guardrails: [
      "Never seed production without E2E_TEST_MODE=true and explicit --apply.",
      "All generated entities carry isSynthetic:true and batchId.",
      "Cleanup must be batch-scoped — never delete @demo.akshhealth.com cohort.",
    ],
  };
}
