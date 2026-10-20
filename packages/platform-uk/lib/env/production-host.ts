/**
 * Fail closed if the production domain is ever served by a deployment that is not configured as production.
 * On 20 Oct 2026 the production project's environment variables were overwritten with simulation values; www kept
 * serving with the production safeguards (closed APIs, minimal health check, no AI) switched off. With this guard,
 * that mistake takes the site offline instead of running it unprotected. Pure, so middleware (edge) and tests can use it.
 */
import { getDeploymentEnvironment } from "./deployment";

type EnvLike = Record<string, string | undefined>;

export const PRODUCTION_HOSTS = ["www.akshhealth.com", "akshhealth.com"] as const;

export function isProductionHost(host: string | null | undefined): boolean {
  const h = (host ?? "").trim().toLowerCase().split(":")[0];
  return (PRODUCTION_HOSTS as readonly string[]).includes(h);
}

/** True when a request for the production domain reaches a deployment not set to AKSH_ENVIRONMENT=production. */
export function productionHostMisconfigured(host: string | null | undefined, env: EnvLike = process.env): boolean {
  return isProductionHost(host) && getDeploymentEnvironment(env) !== "production";
}
