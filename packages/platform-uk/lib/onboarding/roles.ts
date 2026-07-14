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

export const ROLES: RoleDefinition[] = [
  {
    id: "gp",
    label: "GP",
    description: "General Practitioner. Clinical documentation and review",
    icon: "stethoscope",
    color: "#003D7A",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "tutorial",
      "complete",
    ],
    dashboardPath: "/dashboard/gp",
    hasTutorial: true,
  },
  {
    id: "nurse",
    label: "Nurse / Care Coordinator",
    description: "Vitals, handover, and care coordination",
    icon: "heart-pulse",
    color: "#006B4F",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "complete",
    ],
    dashboardPath: "/dashboard/nurse",
    hasTutorial: false,
  },
  {
    id: "clinical-pharmacist",
    label: "Clinical Pharmacist",
    description: "Medication review and GUARDIAN safety",
    icon: "pill",
    color: "#6B46C1",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "complete",
    ],
    dashboardPath: "/dashboard/pharmacist",
    hasTutorial: false,
  },
  {
    id: "practice-manager",
    label: "Practice Manager / Admin",
    description: "Practice operations, integrations, and SHIELD",
    icon: "building",
    color: "#64748B",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "complete",
    ],
    dashboardPath: "/dashboard/admin",
    hasTutorial: false,
  },
  {
    id: "ics-lead",
    label: "ICS Lead / Clinical Informatics",
    description: "Population intelligence across integrated care",
    icon: "network",
    color: "#0D9488",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "tutorial",
      "complete",
    ],
    dashboardPath: "/dashboard/ics",
    alternateDashboardPaths: ["/dashboard/regional"],
    hasTutorial: true,
  },
  {
    id: "hospital-executive",
    label: "Hospital Executive",
    description: "CEO, COO, or CMO. Command centre and capacity planning",
    icon: "chart-bar",
    color: "#001A3D",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "tutorial",
      "complete",
    ],
    dashboardPath: "/dashboard/hospital",
    hasTutorial: true,
  },
  {
    id: "patient",
    label: "Patient",
    description: "Invited by your GP practice",
    icon: "user",
    color: "#0EA5E9",
    steps: ["role-select", "identity", "consent", "tutorial", "complete"],
    dashboardPath: "/dashboard/patient",
    hasTutorial: true,
  },
  {
    id: "researcher",
    label: "Researcher / Analyst",
    description: "Clinical informatics and outcome research",
    icon: "microscope",
    color: "#E67E22",
    steps: [
      "role-select",
      "identity",
      "organisation",
      "preferences",
      "consent",
      "complete",
    ],
    dashboardPath: "/dashboard/researcher",
    hasTutorial: false,
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
