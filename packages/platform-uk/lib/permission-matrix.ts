import { formatCaseTimestamp } from "./workflow";

export type AppRole = "clinical_reviewer" | "operations_lead";

export type PermissionLevel = "allowed" | "scoped" | "denied";

export type PermissionAction = {
  id: string;
  label: string;
  routeOrSurface: string;
  notes: string;
};

export function getPermissionActions(): PermissionAction[] {
  return [
    {
      id: "review_case_queue",
      label: "Review queue and case detail",
      routeOrSurface: "/review, /cases/[id]",
      notes: "Scoped to owned or shared synthetic cases depending on store configuration."
    },
    {
      id: "capture_reviewer_decision",
      label: "Capture reviewer decision and human gates",
      routeOrSurface: "/cases/[id]",
      notes: "Human reviewer remains accountable; no autonomous finalization."
    },
    {
      id: "export_case_evidence",
      label: "Export case evidence and dossier JSON",
      routeOrSurface: "/api/review-cases/[id]/export, /api/review-cases/[id]/dossier",
      notes: "Synthetic proof artifacts only."
    },
    {
      id: "benchmark_signoff",
      label: "Save benchmark sign-off",
      routeOrSurface: "/review/benchmarks/report",
      notes: "Internal evidence decision; not production safety sign-off."
    },
    {
      id: "readiness_snapshot",
      label: "Save readiness snapshot",
      routeOrSurface: "/review/readiness",
      notes: "Internal readiness gate history."
    },
    {
      id: "feedback_capture",
      label: "Capture walkthrough feedback",
      routeOrSurface: "/review/feedback",
      notes: "Advisor and stakeholder rehearsal notes."
    },
    {
      id: "ops_dashboard",
      label: "Ops dashboard and remediation triage",
      routeOrSurface: "/review/ops",
      notes: "Operations lead has broader coordination surfaces."
    },
    {
      id: "demo_reset",
      label: "Reset synthetic seed cohort",
      routeOrSurface: "npm run data:reset",
      notes: "Deterministic reset for clean demos; not production data deletion."
    },
    {
      id: "roadmap_edit",
      label: "Edit roadmap tracker and M1 checklist",
      routeOrSurface: "/review/roadmap",
      notes: "Build-state planning only."
    },
    {
      id: "governance_pack_view",
      label: "View governance and safety rehearsal pack",
      routeOrSurface: "/review/governance-pack",
      notes: "Rehearsal-only safety structure."
    },
    {
      id: "export_system_contracts",
      label: "Export database and permission contracts",
      routeOrSurface: "/api/system/database-contract, /api/system/permission-matrix",
      notes: "Boundary artifacts for architecture review."
    }
  ];
}

export function buildRolePermissionMatrix(options?: { generatedAt?: string; generatedBy?: string }) {
  const actions = getPermissionActions();
  const matrix: Record<
    string,
    {
      clinical_reviewer: PermissionLevel;
      operations_lead: PermissionLevel;
    }
  > = {
    review_case_queue: { clinical_reviewer: "allowed", operations_lead: "allowed" },
    capture_reviewer_decision: { clinical_reviewer: "allowed", operations_lead: "scoped" },
    export_case_evidence: { clinical_reviewer: "allowed", operations_lead: "allowed" },
    benchmark_signoff: { clinical_reviewer: "scoped", operations_lead: "allowed" },
    readiness_snapshot: { clinical_reviewer: "scoped", operations_lead: "allowed" },
    feedback_capture: { clinical_reviewer: "allowed", operations_lead: "allowed" },
    ops_dashboard: { clinical_reviewer: "scoped", operations_lead: "allowed" },
    demo_reset: { clinical_reviewer: "denied", operations_lead: "allowed" },
    roadmap_edit: { clinical_reviewer: "scoped", operations_lead: "allowed" },
    governance_pack_view: { clinical_reviewer: "allowed", operations_lead: "allowed" },
    export_system_contracts: { clinical_reviewer: "allowed", operations_lead: "allowed" }
  };

  return {
    artifactType: "aksh-uk-eu-role-permission-matrix",
    generatedAt: options?.generatedAt ?? formatCaseTimestamp(),
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    productionRbacEnforced: false,
    roles: [
      {
        id: "clinical_reviewer",
        label: "Clinical reviewer",
        description: "Primary synthetic proof reviewer for case decisions and evidence export."
      },
      {
        id: "operations_lead",
        label: "Operations lead",
        description: "Demo, readiness, ops coordination, and deterministic reset responsibilities."
      }
    ],
    permissionLevels: {
      allowed: "Permitted for the role in the current synthetic proof build.",
      scoped: "Permitted with ownership, workflow, or rehearsal constraints.",
      denied: "Not permitted for the role in the current build."
    },
    actions,
    matrix: actions.map((action) => ({
      actionId: action.id,
      label: action.label,
      clinical_reviewer: matrix[action.id]?.clinical_reviewer ?? "denied",
      operations_lead: matrix[action.id]?.operations_lead ?? "denied"
    })),
    enforcementNotes: [
      "Current build uses demo auth and scoped JSON stores; this matrix documents intended boundaries rather than production RBAC enforcement.",
      "Future database adapters must preserve ownership checks and audit integrity before production RBAC claims.",
      "No role may unlock live NHS integration, real patient data handling, or autonomous clinical decisioning in the synthetic proof build."
    ]
  };
}

export type RolePermissionMatrix = ReturnType<typeof buildRolePermissionMatrix>;
