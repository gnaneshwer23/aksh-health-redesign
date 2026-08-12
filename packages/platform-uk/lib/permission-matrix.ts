import { formatCaseTimestamp } from "./workflow";

/**
 * First-class application roles used for permission scoping (OQ-PER-1/OQ-PER-2).
 * - "clinical_reviewer" / "operations_lead": existing clinical + ops personas, unchanged.
 * - "patient": own-record-only scope (FR-PER-006) — never a clinical Accept/Edit/Reject persona.
 * - "researcher": aggregate/de-identified scope only; individual clinical records denied by
 *   default (FR-PER-007, mirrors `CLINICAL_RECORD_DENIED_ROLES`).
 * - "restricted": deny-by-default bucket for any unrecognized/unmapped session role. Never used
 *   as a real onboarding persona — it exists so an unknown role fails closed instead of silently
 *   being promoted to a clinical/ops AppRole.
 */
export type AppRole = "clinical_reviewer" | "operations_lead" | "patient" | "researcher" | "restricted";

export type PermissionLevel = "allowed" | "scoped" | "denied";

export type PermissionAction = {
  id: string;
  label: string;
  routeOrSurface: string;
  notes: string;
  /**
   * E2 (docs/PHASED_BUILD_PLAN_E.md, P3-2): ISO date the documented
   * clinical_reviewer/operations_lead-vs-patient/researcher boundary for
   * this action became *route-enforced* (not just documented). `null` for
   * every action this tranche did not touch — honest: this field records
   * exactly which two actions' worth of routes were hardened, not a claim
   * that the whole matrix is now enforced (`productionRbacEnforced` stays
   * `false`).
   */
  enforcedAt: string | null;
};

/** E2 (docs/PHASED_BUILD_PLAN_E.md, P3-2): date the audit/permission/safety-file exports became role-enforced. */
const E2_RBAC_HARDENING_DATE = "2026-08-11";

export function getPermissionActions(): PermissionAction[] {
  return [
    {
      id: "review_case_queue",
      label: "Review queue and case detail",
      routeOrSurface: "/review, /cases/[id]",
      notes: "Scoped to owned or shared synthetic cases depending on store configuration.",
      enforcedAt: null
    },
    {
      id: "capture_reviewer_decision",
      label: "Capture reviewer decision and human gates",
      routeOrSurface: "/cases/[id]",
      notes: "Human reviewer remains accountable; no autonomous finalization.",
      enforcedAt: null
    },
    {
      id: "export_case_evidence",
      label: "Export case evidence and dossier JSON",
      routeOrSurface: "/api/review-cases/[id]/export, /api/review-cases/[id]/dossier",
      notes: "Synthetic proof artifacts only.",
      enforcedAt: null
    },
    {
      id: "benchmark_signoff",
      label: "Save benchmark sign-off",
      routeOrSurface: "/review/benchmarks/report",
      notes: "Internal evidence decision; not production safety sign-off.",
      enforcedAt: null
    },
    {
      id: "readiness_snapshot",
      label: "Save readiness snapshot",
      routeOrSurface: "/review/readiness",
      notes: "Internal readiness gate history.",
      enforcedAt: null
    },
    {
      id: "feedback_capture",
      label: "Capture walkthrough feedback",
      routeOrSurface: "/review/feedback",
      notes: "Advisor and stakeholder rehearsal notes.",
      enforcedAt: null
    },
    {
      id: "ops_dashboard",
      label: "Ops dashboard and remediation triage",
      routeOrSurface: "/review/ops",
      notes: "Operations lead has broader coordination surfaces.",
      enforcedAt: null
    },
    {
      id: "demo_reset",
      label: "Reset synthetic seed cohort",
      routeOrSurface: "npm run data:reset",
      notes: "Deterministic reset for clean demos; not production data deletion.",
      enforcedAt: null
    },
    {
      id: "roadmap_edit",
      label: "Edit roadmap tracker and M1 checklist",
      routeOrSurface: "/review/roadmap",
      notes: "Build-state planning only.",
      enforcedAt: null
    },
    {
      id: "governance_pack_view",
      label: "View governance and safety rehearsal pack",
      routeOrSurface: "/review/governance-pack",
      notes:
        "Rehearsal-only safety structure. The page itself is session-gated only (any role); its individual export links vary — see export_system_contracts and audit_and_safety_export for which underlying routes are role-enforced.",
      enforcedAt: null
    },
    {
      id: "export_system_contracts",
      label: "Export database and permission contracts",
      routeOrSurface: "/api/system/database-contract, /api/system/permission-matrix",
      notes:
        "Boundary artifacts for architecture review. database-contract stays intentionally public (linked from the public /security page; see tests/readonly-route-contracts.test.ts) — not role-enforced. permission-matrix is role-enforced (clinical_reviewer/operations_lead only) since E2.",
      enforcedAt: null
    },
    {
      id: "audit_and_safety_export",
      label: "Export audit-integrity and clinical-safety-file placeholders",
      routeOrSurface: "/api/system/audit-integrity, /api/system/clinical-safety-files",
      notes:
        "Governance/audit exports — restricted to clinical_reviewer/operations_lead since E2 (previously any authenticated role, including patient/researcher, could call these directly).",
      enforcedAt: E2_RBAC_HARDENING_DATE
    },
    {
      id: "ask_aksh_patient_chat",
      label: "Ask Aksh named-patient chat",
      routeOrSurface: "/api/chat/patient, AskAkshDrawer / companion Ask tab",
      notes:
        "Diabetes care-coordination chat with bounded chart context. clinical_reviewer allowed; patient scoped to bound id; operations_lead (ICS/admin/hospital) and researcher denied named PHI. liveEmis:false · HITL drafts still need Accept.",
      enforcedAt: "2026-08-12"
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
      patient: PermissionLevel;
      researcher: PermissionLevel;
    }
  > = {
    review_case_queue: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    capture_reviewer_decision: {
      clinical_reviewer: "allowed",
      operations_lead: "scoped",
      // FR-PER-009: no non-clinical persona may record a clinical Accept/Edit/Reject.
      patient: "denied",
      researcher: "denied"
    },
    export_case_evidence: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    benchmark_signoff: {
      clinical_reviewer: "scoped",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    readiness_snapshot: {
      clinical_reviewer: "scoped",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    feedback_capture: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    ops_dashboard: {
      clinical_reviewer: "scoped",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    demo_reset: {
      clinical_reviewer: "denied",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    roadmap_edit: {
      clinical_reviewer: "scoped",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    governance_pack_view: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    export_system_contracts: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    audit_and_safety_export: {
      clinical_reviewer: "allowed",
      operations_lead: "allowed",
      patient: "denied",
      researcher: "denied"
    },
    ask_aksh_patient_chat: {
      clinical_reviewer: "allowed",
      // Admin / ICS / hospital executive default off — no named PHI chat.
      operations_lead: "denied",
      // FR-PER-006: patient self-only via bound patient id on /api/chat/patient.
      patient: "scoped",
      researcher: "denied"
    }
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
      },
      {
        id: "patient",
        label: "Patient",
        description:
          "Own-record-only scope (FR-PER-006). No access to the clinician review queue or any clinical Accept/Edit/Reject action."
      },
      {
        id: "researcher",
        label: "Researcher / analyst",
        description:
          "Aggregate/de-identified scope only (FR-PER-007). Individual clinical record access is denied by default, matching CLINICAL_RECORD_DENIED_ROLES."
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
      operations_lead: matrix[action.id]?.operations_lead ?? "denied",
      patient: matrix[action.id]?.patient ?? "denied",
      researcher: matrix[action.id]?.researcher ?? "denied"
    })),
    enforcementNotes: [
      "Current build uses demo auth and scoped JSON stores; this matrix documents intended boundaries rather than production RBAC enforcement.",
      "Future database adapters must preserve ownership checks and audit integrity before production RBAC claims.",
      "No role may unlock live NHS integration, real patient data handling, or autonomous clinical decisioning in the synthetic proof build.",
      "patient/researcher are first-class AppRoles (B1): unrecognized session roles fail closed to \"restricted\" rather than silently becoming clinical_reviewer."
    ]
  };
}

export type RolePermissionMatrix = ReturnType<typeof buildRolePermissionMatrix>;
