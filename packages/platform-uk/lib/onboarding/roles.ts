export type UserRole =
  | "gp"
  | "nurse"
  | "clinical-pharmacist"
  | "practice-manager"
  | "ics-lead"
  | "hospital-executive"
  | "patient"
  | "researcher";

export type OnboardingStepId =
  | "role-select"
  | "identity"
  | "organisation"
  | "preferences"
  | "consent"
  | "tutorial"
  | "complete";

export type RoleDefinition = {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
  color: string;
  steps: OnboardingStepId[];
  dashboardPath: string;
  alternateDashboardPaths?: string[];
  hasTutorial: boolean;
};

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  "role-select": "Role",
  identity: "Identity",
  organisation: "Organisation",
  preferences: "Preferences",
  consent: "Consent",
  tutorial: "Tutorial",
  complete: "Complete",
};

/** Shared step spine for roles that capture org + preferences (U3: all get tutorial). */
const CLINICAL_ORG_STEPS: OnboardingStepId[] = [
  "role-select",
  "identity",
  "organisation",
  "preferences",
  "consent",
  "tutorial",
  "complete",
];

export const ROLES: RoleDefinition[] = [
  {
    id: "gp",
    label: "Physician (GP / family doctor)",
    description: "Review clinical drafts — Accept, Edit, or Reject before anything is staged",
    icon: "stethoscope",
    color: "#003D7A",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/gp",
    alternateDashboardPaths: ["/dashboard/front-desk", "/dashboard/network"],
    hasTutorial: true,
  },
  {
    id: "nurse",
    label: "Nurse / Diabetes educator",
    description: "Observations, handover drafts, and safety alerts — you confirm each step",
    icon: "heart-pulse",
    color: "#006B4F",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/nurse",
    alternateDashboardPaths: ["/dashboard/front-desk", "/dashboard/network"],
    hasTutorial: true,
  },
  {
    id: "clinical-pharmacist",
    label: "Clinical Pharmacist",
    description: "Medication review and interaction checks — HITL before any staging",
    icon: "pill",
    color: "#6B46C1",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/pharmacist",
    alternateDashboardPaths: ["/dashboard/network"],
    hasTutorial: true,
  },
  {
    id: "practice-manager",
    label: "Clinic manager / Admin",
    description: "Integrations, audit, and enquiries — clinicians keep clinical Accept",
    icon: "building",
    color: "#64748B",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/admin",
    alternateDashboardPaths: ["/dashboard/front-desk", "/dashboard/network"],
    hasTutorial: true,
  },
  {
    id: "ics-lead",
    label: "Population health lead",
    description: "Population, equity, and forecast views on synthetic cohorts",
    icon: "network",
    color: "#0D9488",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/ics",
    alternateDashboardPaths: ["/dashboard/regional", "/dashboard/network"],
    hasTutorial: true,
  },
  {
    id: "hospital-executive",
    label: "Hospital Executive",
    description: "Wards, capacity, and staffing — synthetic hospital system, recommendations need review",
    icon: "chart-bar",
    color: "#001A3D",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/hospital",
    hasTutorial: true,
  },
  {
    id: "patient",
    label: "Patient",
    description: "Asha, your readings and — with a clinic invite — your care team",
    icon: "user",
    color: "#0EA5E9",
    steps: ["role-select", "identity", "consent", "tutorial", "complete"],
    dashboardPath: "/dashboard/patient",
    hasTutorial: true,
  },
  {
    id: "researcher",
    label: "Researcher / Analyst",
    description: "Governed cohorts and audited exports — research agent remains Phase 2",
    icon: "microscope",
    color: "#E67E22",
    steps: [...CLINICAL_ORG_STEPS],
    dashboardPath: "/dashboard/researcher",
    hasTutorial: true,
  },
];

export const SIGNUP_ROLE_MAP: Record<string, UserRole> = {
  gp: "gp",
  nurse: "nurse",
  pharmacist: "clinical-pharmacist",
  "practice-manager": "practice-manager",
  "hospital-admin": "practice-manager",
  "ics-lead": "ics-lead",
  "hospital-executive": "hospital-executive",
  patient: "patient",
  researcher: "researcher",
};

export function getRoleDefinition(role: UserRole | null): RoleDefinition | undefined {
  return ROLES.find((r) => r.id === role);
}

export function getStepIndex(role: UserRole | null, stepId: OnboardingStepId): number {
  const def = getRoleDefinition(role);
  if (!def) return -1;
  return def.steps.indexOf(stepId);
}

export function getStepIdAtIndex(
  role: UserRole | null,
  index: number
): OnboardingStepId | null {
  const def = getRoleDefinition(role);
  if (!def || index < 0 || index >= def.steps.length) return null;
  return def.steps[index] ?? null;
}

export function getStepIdFromPathname(pathname: string): OnboardingStepId | null {
  if (pathname === "/onboarding" || pathname === "/onboarding/role-select") {
    return "role-select";
  }
  const match = pathname.match(/^\/onboarding\/([^/]+)/);
  if (!match?.[1]) return null;
  const segment = match[1] as OnboardingStepId;
  if (segment in ONBOARDING_STEP_LABELS) {
    return segment;
  }
  return null;
}

export function getStepPath(stepId: OnboardingStepId): string {
  if (stepId === "role-select") return "/onboarding/role-select";
  if (stepId === "complete") return "/onboarding/complete";
  return `/onboarding/${stepId}`;
}

export function getNextStep(
  role: UserRole | null,
  currentStepId: OnboardingStepId
): OnboardingStepId | null {
  const def = getRoleDefinition(role);
  if (!def) return null;
  const index = def.steps.indexOf(currentStepId);
  if (index < 0 || index >= def.steps.length - 1) return null;
  return def.steps[index + 1] ?? null;
}

export function getPreviousStep(
  role: UserRole | null,
  currentStepId: OnboardingStepId
): OnboardingStepId | null {
  const def = getRoleDefinition(role);
  if (!def) return null;
  const index = def.steps.indexOf(currentStepId);
  if (index <= 0) return null;
  return def.steps[index - 1] ?? null;
}

export function resolveDashboardPath(role: UserRole | null): string {
  return getRoleDefinition(role)?.dashboardPath ?? "/dashboard/gp";
}
