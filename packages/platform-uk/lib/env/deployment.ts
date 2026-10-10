/**
 * Which environment this process is running in. Production holds real organisations only; simulation holds the
 * rehearsal world; preview is a per-PR branch; local is a developer machine.
 *
 * Set AKSH_ENVIRONMENT explicitly in every deployed environment. It is never inferred from URLs.
 */
export const DEPLOYMENT_ENVIRONMENTS = ["production", "simulation", "preview", "local"] as const;
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

type EnvLike = Record<string, string | undefined>;

export function getDeploymentEnvironment(env: EnvLike = process.env): DeploymentEnvironment {
  const raw = env.AKSH_ENVIRONMENT?.trim().toLowerCase();
  return (DEPLOYMENT_ENVIRONMENTS as readonly string[]).includes(raw ?? "") ? (raw as DeploymentEnvironment) : "local";
}

/** Seed and fixture scripts call this first: test data must never be written to production. */
export function assertSeedingAllowed(script: string, env: EnvLike = process.env): void {
  if (getDeploymentEnvironment(env) === "production") {
    throw new Error(`${script} refuses to run with AKSH_ENVIRONMENT=production. Seed the simulation environment instead.`);
  }
}
