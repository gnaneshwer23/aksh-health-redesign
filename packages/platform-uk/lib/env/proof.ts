/**
 * The clinical-proof environment (platform map G4): a separately hosted, clearly labelled deployment on the simulation
 * database where buyers, investors and the clinical safety officer can see the synthetic clinical estate (CONDUCTOR,
 * Aksh Diabetes, the Track B link, the Patel walkthrough) without any of it reaching production.
 *
 * On only when AKSH_PROOF_ENVIRONMENT=true and the deployment is not production or the real workspace. Pure, so
 * middleware (edge), layouts and tests can use it.
 */
import { getDeploymentEnvironment } from "./deployment";
import { isRealWorkspace } from "./workspace";

type EnvLike = Record<string, string | undefined>;

export function isProofEnvironment(env: EnvLike = process.env): boolean {
  if (getDeploymentEnvironment(env) === "production" || isRealWorkspace(env)) return false;
  return env.AKSH_PROOF_ENVIRONMENT?.trim().toLowerCase() === "true";
}

export const PROOF_HOME = "/proof";
/** Pages that would invite real details or real organisations: the proof environment sends them to its landing page. */
const PROOF_CLOSED_PATHS = ["/get-started", "/pilot", "/contact"];
export function proofRedirect(pathname: string): string | null {
  if (pathname === "/") return PROOF_HOME;
  return PROOF_CLOSED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ? PROOF_HOME : null;
}
