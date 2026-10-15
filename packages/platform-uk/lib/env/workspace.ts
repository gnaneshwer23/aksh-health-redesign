/**
 * The real workspace: what organisations see in production. Only features backed by the database and row-level
 * security — no sample patients, demo menus, mock notifications or synthetic dashboards. Simulation and local keep
 * the full demo estate unless AKSH_REAL_WORKSPACE=true (to rehearse exactly what production shows).
 * Pure, so middleware (edge) and tests can use it.
 */
import { getDeploymentEnvironment } from "./deployment";

type EnvLike = Record<string, string | undefined>;

export function isRealWorkspace(env: EnvLike = process.env): boolean {
  // Production is always real; elsewhere it is opt-in.
  return getDeploymentEnvironment(env) === "production" || env.AKSH_REAL_WORKSPACE?.trim().toLowerCase() === "true";
}

export const REAL_HOME = "/dashboard/today";
export const REAL_PATIENT_HOME = "/dashboard/patient";

/** Roles with a real product today. Others (population health, hospital, research) are not offered yet. */
export const REAL_ROLES = new Set(["gp", "nurse", "clinical-pharmacist", "practice-manager", "patient"]);
export const CLINICIAN_ROLES = new Set(["gp", "nurse", "clinical-pharmacist"]);

const STAFF_PATHS = ["/dashboard/today", "/dashboard/access", "/dashboard/network", "/dashboard/organisation", "/dashboard/security", "/dashboard/platform"];
const CLINICIAN_ONLY_PATHS = ["/dashboard/monitoring"];
const PATIENT_PATHS = ["/dashboard/patient", "/dashboard/security"];
/** Signed-in legacy surfaces outside /dashboard that only ever showed synthetic data. */
const LEGACY_SESSION_PREFIXES = ["/cases", "/review", "/intake", "/workspace"];

/** Public demo surfaces (synthetic practice, walkthroughs). The real workspace has none. */
const PUBLIC_DEMO_PREFIXES = ["/demo", "/asha", "/voice-care", "/gp-dashboard", "/product/demo"];

const under = (pathname: string, prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Where a signed-in user should go instead of `pathname` in the real workspace, or null to let them through.
 * Only called for authenticated, onboarded users.
 */
export function realWorkspaceRedirect(pathname: string, role: string | null): string | null {
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (!isDashboard && !under(pathname, LEGACY_SESSION_PREFIXES)) return null;
  if (role === "patient") return under(pathname, PATIENT_PATHS) ? null : REAL_PATIENT_HOME;
  if (under(pathname, STAFF_PATHS)) return null;
  if (role && CLINICIAN_ROLES.has(role) && under(pathname, CLINICIAN_ONLY_PATHS)) return null;
  return REAL_HOME;
}

export function realHomeFor(role: string | null): string {
  return role === "patient" ? REAL_PATIENT_HOME : REAL_HOME;
}

/** For any visitor in the real workspace: demo pages go to the home page. */
export function isPublicDemoPath(pathname: string): boolean {
  return under(pathname, PUBLIC_DEMO_PREFIXES);
}

/**
 * APIs open in the real workspace (production): an allowlist of what the real product uses. Everything else under
 * /api is the synthetic estate or internal tooling and is closed there:
 * - clinical-proof agents and spine (CONDUCTOR, HORIZON, GUARDIAN, precision health, graph, research, learning, chat)
 *   run on the synthetic cohort; Track B is not open in the real workspace, and no patient data goes to cloud AI;
 * - the mock patient record API (`/api/patients`; real records are `/api/network/patients`);
 * - Front Desk / Asha: slot fill has one implementation, `lib/access` (platform map G3);
 * - internal posture documents and demo tooling (system, integrations, eval, readiness, roadmap, simulation, ...).
 */
const REAL_API_ALLOW = [
  "/api/access",
  "/api/access-requests",
  "/api/admin/access-requests",
  "/api/auth",
  "/api/connect",
  "/api/cron",
  "/api/feedback",
  "/api/health",
  "/api/invites",
  "/api/me",
  "/api/network",
  "/api/onboarding",
  "/api/orgs",
  "/api/platform",
  "/api/profile",
  "/api/telemetry",
  "/api/today",
];
export function isClosedInRealWorkspace(pathname: string): boolean {
  return under(pathname, ["/api"]) && !under(pathname, REAL_API_ALLOW);
}
export const TRACK_B_NOT_OPEN = "TRACK_B_NOT_OPEN: clinical agents and synthetic services are not available in this workspace until a governed go-live opens Track B";
