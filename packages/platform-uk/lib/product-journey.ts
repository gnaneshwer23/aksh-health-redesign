/**
 * Shared product-journey copy for marketing → onboarding → role dashboards.
 * Keep claims honest: HITL care coordination today; Precision Health as phased scaffolding.
 * U3: first-run guidance is role-shaped (agents + approve + liveEmis:false + preference tips).
 */

import {
  buildPreferenceTips,
  getRoleOnboardingPath,
} from "@/lib/onboarding/role-paths";
import type { UserRole } from "@/lib/onboarding/roles";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

export const PRODUCT_TAGLINE =
  "Diabetes-first care coordination for primary care and clinical teams";

export const PRODUCT_FLOW = "Capture → draft → approve";

export const HITL_PLAIN =
  "A clinician decides what reaches the record — Accept, Edit, or Reject before FHIR write.";

export const PRECISION_HEALTH_SOFT =
  "Precision Health scaffolding includes a synthetic whole-loop demo (consent → ingest → agents → plan → HITL/sim) — not a live physiological twin or live EMR write-back.";

export const LIVE_EMIS_FALSE = "liveEmis:false";

export type JourneyPreview = {
  workspaceLabel: string;
  bullets: string[];
  firstFocus: string;
  docsHref?: string;
  agents?: string[];
  youApprove?: string;
  honesty?: string;
};

/** What each onboarding role will see after complete. */
export const ROLE_DASHBOARD_PREVIEW: Record<UserRole, JourneyPreview> = {
  gp: {
    workspaceLabel: "Clinician Dashboard",
    bullets: [
      "Review queue — Accept, Edit, or Reject every draft",
      "Today's patients with risk scores",
      "Patient view: timeline and health-plan drafts awaiting your decision",
    ],
    firstFocus: "Clear your review queue — nothing writes without your approval.",
    docsHref: "/demo/patel",
    agents: ["SYNTHESIS", "GUARDIAN", "HORIZON", "CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Every clinical draft before staging for export.",
    honesty: `${LIVE_EMIS_FALSE} — sim/staging only.`,
  },
  nurse: {
    workspaceLabel: "Nurse / Care Coordinator",
    bullets: [
      "Observations and handover drafts awaiting review",
      "Safety alerts routed for clinical follow-up",
      "Care coordination tasks linked to the GP queue",
    ],
    firstFocus: "Review handover and alerts before the next ward round.",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "SHIELD"],
    youApprove: "Observations and handover drafts (you confirm before they append).",
    honesty: `${LIVE_EMIS_FALSE} — no EHR write from this proof build.`,
  },
  "clinical-pharmacist": {
    workspaceLabel: "Clinical Pharmacist",
    bullets: [
      "Medication review queue with interaction checks",
      "formulary-backed safety alerts",
      "Drafts held until you approve",
    ],
    firstFocus: "Start with open interaction alerts in your med review queue.",
    agents: ["GUARDIAN", "SYNTHESIS", "BRIDGE", "SHIELD"],
    youApprove: "Med-review and interaction recommendations.",
    honesty: `${LIVE_EMIS_FALSE} — staging sim only.`,
  },
  "practice-manager": {
    workspaceLabel: "Practice Manager",
    bullets: [
      "Integrations status (designed for common EHR pathways · liveEmis:false)",
      "Audit sample plus users and organisation enquiries",
      "Partner readiness shown as scaffolding only",
    ],
    firstFocus: "Start with integrations honesty, then audit and enquiries.",
    docsHref: "/demo/script",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight only — clinicians keep clinical Accept.",
    honesty: `${LIVE_EMIS_FALSE} — EHR write-back Not enabled · designed for common EHR pathways.`,
  },
  "ics-lead": {
    workspaceLabel: "Population Intelligence",
    bullets: [
      "Population → equity → forecast (guided demo)",
      "Clinic benchmarking across your network",
      "Admission forecast and aggregate risk state (not a physiological twin)",
    ],
    firstFocus: "Start the population demo: population → equity → forecast.",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views — not patient-level notes.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic cohorts · no patient-level spill.`,
  },
  "hospital-executive": {
    workspaceLabel: "Hospital Command Centre",
    bullets: [
      "Wards → capacity → staffing (synthetic hospital system demo)",
      "Capacity recommendations with review before action",
      "Risk state and scenario ranking (scaffolding — synthetic demo)",
    ],
    firstFocus: "Start the command-centre demo: wards → capacity → staffing.",
    agents: ["HORIZON", "PATHWAY", "COMPASS", "CONDUCTOR"],
    youApprove: "Operational capacity / staffing recommendations.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic hospital system, not live EPR.`,
  },
  patient: {
    workspaceLabel: "My Health",
    bullets: [
      "My Health → care plan → consent",
      "Ask Aksh with GP-gated escalation",
      "Check-ins only — clinicians keep HITL",
    ],
    firstFocus: "Start with My Health, then care plan and consent.",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins only — clinicians Approve record changes.",
    honesty: `${LIVE_EMIS_FALSE} — invite-by-clinic · no patient-app EHR write.`,
  },
  researcher: {
    workspaceLabel: "Researcher / Analyst",
    bullets: [
      "Ethics → evaluation → data access",
      "Governed aggregates and audited exports",
      "ATLAS Phase 2 — never claim live",
    ],
    firstFocus: "Start with the ethics empty-state, then evaluation and data access.",
    agents: ["ATLAS", "COMPASS", "SHIELD", "HORIZON"],
    youApprove: "Ethics / data-minimisation gates — not clinical EHR Accept.",
    honesty: `${LIVE_EMIS_FALSE} — ATLAS Phase 2 (not live).`,
  },
};

export type FirstRunCopy = {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  agents?: string[];
  youApprove?: string;
  honesty?: string;
};

export const FIRST_RUN_BY_DASHBOARD: Record<DashboardRole, FirstRunCopy> = {
  gp: {
    title: "Your clinician workspace is ready",
    body: `${PRODUCT_FLOW}. Start with the review queue — Accept drafts before any export/staging. Intake, orchestration, and risk scores stay drafts until you decide.`,
    primaryHref: "/dashboard/gp/review-queue",
    primaryLabel: "Open review queue",
    secondaryHref: "/demo/script",
    secondaryLabel: "10-min demo script",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "HORIZON", "CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Every clinical draft — Accept / Edit / Reject before staging.",
    honesty: LIVE_EMIS_FALSE,
  },
  nurse: {
    title: "Care coordination workspace ready",
    body: "Start with Observations, then handover drafts, then safety alerts. Confirm each step — nothing silently appends.",
    primaryHref: "/dashboard/nurse/observations",
    primaryLabel: "Start observations",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (nurse)",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "SHIELD"],
    youApprove: "Observations and handover drafts before they append to the audit trail.",
    honesty: LIVE_EMIS_FALSE,
  },
  pharmacist: {
    title: "Medication safety workspace ready",
    body: "Open the med review queue, clear interaction checks, then Accept or Edit. Staging only happens after your decision.",
    primaryHref: "/dashboard/pharmacist/reviews",
    primaryLabel: "Open med review",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (pharmacist)",
    agents: ["GUARDIAN", "SYNTHESIS", "BRIDGE", "SHIELD"],
    youApprove: "Med-review and interaction recommendations before any staging.",
    honesty: LIVE_EMIS_FALSE,
  },
  admin: {
    title: "Practice operations workspace ready",
    body: "Start with integrations honesty (designed for common EHR pathways), then audit and enquiries. Clinicians keep clinical Accept — Precision Health remains scaffolding.",
    primaryHref: "/dashboard/admin/integrations",
    primaryLabel: "Integrations honesty",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (admin)",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight — not clinical SOAP/meds.",
    honesty: LIVE_EMIS_FALSE,
  },
  ics: {
    title: "Population intelligence workspace ready",
    body: "Population → equity → forecast on synthetic cohorts. Aggregate planning only — no patient-level spill, not a live regional feed.",
    primaryHref: "/dashboard/ics/population",
    primaryLabel: "Start population demo",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (regional)",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views only.",
    honesty: LIVE_EMIS_FALSE,
  },
  hospital: {
    title: "Command Centre ready",
    body: "Wards → capacity → staffing. Operational recommendations wait for review. Synthetic hospital system rehearsal — not a live hospital system.",
    primaryHref: "/dashboard/hospital/wards",
    primaryLabel: "Start wards demo",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (hospital)",
    agents: ["HORIZON", "PATHWAY", "COMPASS", "CONDUCTOR"],
    youApprove: "Operational capacity / staffing recommendations.",
    honesty: LIVE_EMIS_FALSE,
  },
  patient: {
    title: "Welcome to My Health",
    body: "My Health → care plan → consent. Clinic-invited view in plain English — clinicians keep HITL on record changes. No patient-app EHR write.",
    primaryHref: "/dashboard/patient#companion-my-health",
    primaryLabel: "Open My Health",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (patient)",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins — clinicians Approve record changes.",
    honesty: LIVE_EMIS_FALSE,
  },
  researcher: {
    title: "Research workspace ready",
    body: "Ethics → evaluation → data access. Governed aggregates and audited exports. ATLAS remains Phase 2 — never claim live. Synthetic cohorts only.",
    primaryHref: "/dashboard/researcher",
    primaryLabel: "Start ethics demo",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (researcher)",
    agents: ["ATLAS", "COMPASS", "SHIELD", "HORIZON"],
    youApprove: "Ethics / data-minimisation gates.",
    honesty: LIVE_EMIS_FALSE,
  },
};

/** Merge base first-run copy with onboarding preference tips when profile is available. */
export function resolveFirstRunCopy(
  role: DashboardRole,
  options?: {
    userRole?: UserRole | null;
    preferences?: Record<string, unknown> | null;
  }
): FirstRunCopy & { preferenceTips: string[] } {
  const base = FIRST_RUN_BY_DASHBOARD[role];
  const path = getRoleOnboardingPath(options?.userRole ?? null);
  const preferenceTips = buildPreferenceTips(options?.userRole ?? null, options?.preferences);

  let body = base.body;
  if (preferenceTips.length > 0) {
    body = `${body} ${preferenceTips[0]}`;
  }

  return {
    ...base,
    body,
    agents: base.agents ?? path?.agents.map((a) => a.name),
    youApprove: base.youApprove ?? path?.youApprove,
    honesty: base.honesty ?? path?.honestyNote,
    preferenceTips,
  };
}

export function dashboardRoleFromUserRole(role: UserRole | null | undefined): DashboardRole | null {
  if (!role) return null;
  switch (role) {
    case "gp":
      return "gp";
    case "nurse":
      return "nurse";
    case "clinical-pharmacist":
      return "pharmacist";
    case "practice-manager":
      return "admin";
    case "ics-lead":
      return "ics";
    case "hospital-executive":
      return "hospital";
    case "patient":
      return "patient";
    case "researcher":
      return "researcher";
    default:
      return null;
  }
}
