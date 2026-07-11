import {
  getRoleDefinition,
  resolveDashboardPath,
  type UserRole,
} from "@/lib/onboarding/roles";

function isSafeRelativePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function resolvePostAuthRedirect(input: {
  onboardingComplete: boolean;
  role: UserRole | null;
  callbackUrl?: string | null;
}): string {
  if (!input.onboardingComplete) {
    if (input.role) {
      return `/onboarding/role-select?role=${input.role}`;
    }
    return "/onboarding/role-select";
  }

  if (input.callbackUrl && isSafeRelativePath(input.callbackUrl)) {
    return input.callbackUrl;
  }

  return resolveDashboardPath(input.role);
}

export function isAllowedDashboardPath(pathname: string, role: UserRole | null) {
  if (!role) return false;

  const definition = getRoleDefinition(role);
  if (!definition) return false;

  if (pathname === definition.dashboardPath || pathname.startsWith(`${definition.dashboardPath}/`)) {
    return true;
  }

  return (
    definition.alternateDashboardPaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    ) ?? false
  );
}

export function resolveOnboardingEntryPath(role: UserRole | null) {
  if (role) {
    return `/onboarding/role-select?role=${role}`;
  }
  return "/onboarding/role-select";
}
