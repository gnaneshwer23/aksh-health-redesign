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

export const PRODUCT_TAGLINE = "Care coordination for NHS primary care";

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
      "AI Review Queue — Accept / Edit / Reject every draft",
      "Today's patients with HORIZON risk scores",
      "Patient view: risk state, timeline, and health-plan drafts (HITL)",
    ],
    firstFocus: "Clear your review queue — nothing writes without your approval.",
    docsHref: "/walkthrough",
    agents: ["SYNTHESIS", "GUARDIAN", "HORIZON", "CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Every clinical draft before BRIDGE staging.",
    honesty: `${LIVE_EMIS_FALSE} — sim/staging only.`,
  },
  nurse: {
    workspaceLabel: "Nurse / Care Coordinator",
    bullets: [
      "Observations and handover drafts awaiting review",
      "GUARDIAN alerts routed for clinical follow-up",
      "Care coordination tasks linked to the GP queue",
    ],
    firstFocus: "Review handover and alerts before the next ward round.",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "SHIELD"],
    youApprove: "Observations and handover drafts (HITL confirmation).",
    honesty: `${LIVE_EMIS_FALSE} — no EMIS write from this proof build.`,
  },
  "clinical-pharmacist": {
    workspaceLabel: "Clinical Pharmacist",
    bullets: [
      "Medication review queue with GUARDIAN safety checks",
      "BNF-backed interaction alerts",
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
      "Integrations and SHIELD audit posture",
      "Precision Health status (honest scaffolding flags)",
      "Consent registry for purpose + modality grants",
    ],
    firstFocus: "Open Precision Health status, then the consent registry.",
    docsHref: "/resources#precision-health",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight only — clinicians keep clinical Accept.",
    honesty: `${LIVE_EMIS_FALSE} — EMIS write-back Not enabled.`,
  },
  "ics-lead": {
    workspaceLabel: "ICS Population Intelligence",
    bullets: [
      "Population KPIs and equity flags (COMPASS)",
      "Practice benchmarking across your ICS",
      "Admission forecast & aggregate risk state (not a physiological twin)",
    ],
    firstFocus: "Scan equity flags, then open Risk state / forecast.",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views — not patient-level notes.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic cohorts.`,
  },
  "hospital-executive": {
    workspaceLabel: "Hospital Command Centre",
    bullets: [
      "ED wait, beds, theatres, and staffing alerts",
      "Capacity recommendations with HITL approval",
      "Risk state + scenario ranking (scaffolding — synthetic demo)",
    ],
    firstFocus: "Review Command Centre metrics, then Risk state when ready.",
    agents: ["HORIZON", "PATHWAY", "COMPASS", "CONDUCTOR"],
    youApprove: "Operational capacity / staffing recommendations.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic PAS, not live EPR.`,
  },
  patient: {
    workspaceLabel: "My Health",
    bullets: [
      "Conditions, medications, and care plan in plain English",
      "Ask Aksh with GP-gated escalation",
      "Timeline and coaching drafts your GP can approve",
    ],
    firstFocus: "Open My Health and confirm your care plan looks right.",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins only — clinicians Approve record changes.",
    honesty: `${LIVE_EMIS_FALSE} — no patient-app EHR write.`,
  },
  researcher: {
    workspaceLabel: "Researcher / Analyst",
    bullets: [
      "Governed evaluation workspace",
      "Data-access requests with audit trail",
      "Federated learning stubs (read-only scaffolding)",
    ],
    firstFocus: "Review data-access terms before opening evaluation.",
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
    body: `${PRODUCT_FLOW}. One-click hero path: Review Queue → Accept (HITL) → BRIDGE export/sim. CANVAS intake, CONDUCTOR orchestration, HORIZON risk — VOICE and Dr.Assist stay sub-caps.`,
    primaryHref: "/dashboard/gp/review-queue",
    primaryLabel: "Open review queue",
    secondaryHref: "/demo/script",
    secondaryLabel: "10-min demo script",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "HORIZON", "CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Every clinical draft — Accept / Edit / Reject before BRIDGE staging.",
    honesty: LIVE_EMIS_FALSE,
  },
  nurse: {
    title: "Care coordination workspace ready",
    body: "Observations, handover drafts, and GUARDIAN alerts land here for your review — nothing auto-writes to the record.",
    primaryHref: "/dashboard/nurse/handover",
    primaryLabel: "Open handover",
    secondaryHref: "/how-it-works",
    secondaryLabel: "How it works",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "SHIELD"],
    youApprove: "Observations and handover drafts.",
    honesty: LIVE_EMIS_FALSE,
  },
  pharmacist: {
    title: "Medication safety workspace ready",
    body: "GUARDIAN interaction checks and med-review drafts await your Accept / Edit / Reject decision.",
    primaryHref: "/dashboard/pharmacist/interactions",
    primaryLabel: "Open interactions",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
    agents: ["GUARDIAN", "SYNTHESIS", "BRIDGE", "SHIELD"],
    youApprove: "Med-review and interaction recommendations.",
    honesty: LIVE_EMIS_FALSE,
  },
  admin: {
    title: "Practice operations workspace ready",
    body: `${PRECISION_HEALTH_SOFT} Start with Precision Health status and the consent registry. Clinicians keep clinical Accept.`,
    primaryHref: "/dashboard/admin/precision-health",
    primaryLabel: "Precision Health status",
    secondaryHref: "/dashboard/admin/consent",
    secondaryLabel: "Consent registry",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight — not clinical SOAP/meds.",
    honesty: LIVE_EMIS_FALSE,
  },
  ics: {
    title: "ICS intelligence workspace ready",
    body: "Population KPIs, COMPASS equity flags, and risk-state forecast use synthetic rehearsal data — not a live ICS feed.",
    primaryHref: "/dashboard/ics/forecast",
    primaryLabel: "Open risk state",
    secondaryHref: "/dashboard/ics/equity",
    secondaryLabel: "Equity (COMPASS)",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views only.",
    honesty: LIVE_EMIS_FALSE,
  },
  hospital: {
    title: "Command Centre ready",
    body: "Operational metrics and risk-state panels are synthetic PAS rehearsal. Capacity recommendations still need HITL approval.",
    primaryHref: "/dashboard/hospital?panel=digital-twin",
    primaryLabel: "Open risk state",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
    agents: ["HORIZON", "PATHWAY", "COMPASS", "CONDUCTOR"],
    youApprove: "Operational capacity / staffing recommendations.",
    honesty: LIVE_EMIS_FALSE,
  },
  patient: {
    title: "Welcome to My Health",
    body: "Your care plan and AI check-ins are shown in plain English. Your GP approves anything that affects your record.",
    primaryHref: "/dashboard/patient",
    primaryLabel: "Explore My Health",
    secondaryHref: "/how-it-works",
    secondaryLabel: "How Aksh works",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins — clinicians Approve record changes.",
    honesty: LIVE_EMIS_FALSE,
  },
  researcher: {
    title: "Research workspace ready",
    body: "Evaluation and data-access tools are governed and audited. ATLAS is Phase 2 — never claim live. Federated learning surfaces are read-only stubs.",
    primaryHref: "/dashboard/researcher/evaluation",
    primaryLabel: "Open evaluation",
    secondaryHref: "/resources",
    secondaryLabel: "Resources",
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
