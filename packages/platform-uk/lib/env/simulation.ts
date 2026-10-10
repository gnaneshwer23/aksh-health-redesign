import { timingSafeEqual } from "node:crypto";

import { getDeploymentEnvironment } from "./deployment";

/**
 * True only for requests from the scenario runner: never in production, only when SIMULATION_RUNNER_TOKEN is set
 * (24+ characters), and only when the request carries the same token. Used to lift sign-up rate limits and skip
 * verification emails to reserved .example addresses during a rehearsal.
 */
export function isSimulationRequest(request: Request): boolean {
  if (getDeploymentEnvironment() === "production") return false;
  const expected = process.env.SIMULATION_RUNNER_TOKEN?.trim();
  const given = request.headers.get("x-aksh-simulation-token")?.trim();
  if (!expected || expected.length < 24 || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
