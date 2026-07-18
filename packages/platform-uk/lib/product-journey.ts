/**
 * Shared product-journey copy for marketing → onboarding → role dashboards.
 * Keep claims honest: HITL care coordination today; Precision Health as phased scaffolding.
 */

import type { UserRole } from "@/lib/onboarding/roles";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

export const PRODUCT_TAGLINE = "Care coordination for NHS primary care";

export const PRODUCT_FLOW = "Capture → draft → approve";

export const HITL_PLAIN =
  "A clinician decides what reaches the record — Accept, Edit, or Reject before FHIR write.";

export const PRECISION_HEALTH_SOFT =
  "Precision Health scaffolding includes a synthetic whole-loop demo (consent → ingest → agents → plan → HITL/sim) — not a live physiological twin or live EMR write-back.";

export type JourneyPreview = {
  workspaceLabel: string;
  bullets: string[];
  firstFocus: string;
  docsHref?: string;
};

/** What each onboarding role will see after complete. */
export const ROLE_DASHBOARD_PREVIEW: Record<UserRole, JourneyPreview> = {
  gp: {
    workspaceLabel: "Clinician Dashboard",
    bullets: [
      "AI Review Queue — Accept / Edit / Reject every draft",
      "Today's patients with ORACLE risk scores",
      "Patient view: risk state, timeline, and health-plan drafts (HITL)",
    ],
    firstFocus: "Clear your review queue — nothing writes without your approval.",
    docsHref: "/walkthrough",
  },
  nurse: {
    workspaceLabel: "Nurse / Care Coordinator",
    bullets: [
      "Observations and handover drafts awaiting review",
      "GUARDIAN alerts routed for clinical follow-up",
      "Care coordination tasks linked to the GP queue",
    ],
    firstFocus: "Review handover and alerts before the next ward round.",
  },
  "clinical-pharmacist": {
    workspaceLabel: "Clinical Pharmacist",
    bullets: [
      "Medication review queue with GUARDIAN safety checks",
      "BNF-backed interaction alerts",
      "Drafts held until you approve",
    ],
    firstFocus: "Start with open interaction alerts in your med review queue.",
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
  },
  "ics-lead": {
    workspaceLabel: "ICS Population Intelligence",
    bullets: [
      "Population KPIs and equity flags",
      "Practice benchmarking across your ICS",
      "Admission forecast & aggregate risk state (not a physiological twin)",
    ],
    firstFocus: "Scan equity flags, then open Risk state / forecast.",
  },
  "hospital-executive": {
    workspaceLabel: "Hospital Command Centre",
    bullets: [
      "ED wait, beds, theatres, and staffing alerts",
      "Capacity recommendations with HITL approval",
      "Risk state + scenario ranking (scaffolding — synthetic demo patient)",
    ],
    firstFocus: "Review Command Centre metrics, then Risk state when ready.",
  },
  patient: {
    workspaceLabel: "My Health",
    bullets: [
      "Conditions, medications, and care plan in plain English",
      "Ask Aksh with GP-gated escalation",
      "Timeline and coaching drafts your GP can approve",
    ],
    firstFocus: "Open My Health and confirm your care plan looks right.",
  },
  researcher: {
    workspaceLabel: "Researcher / Analyst",
    bullets: [
      "Governed evaluation workspace",
      "Data-access requests with audit trail",
      "Federated learning stubs (read-only scaffolding)",
    ],
    firstFocus: "Review data-access terms before opening evaluation.",
  },
};

export const FIRST_RUN_BY_DASHBOARD: Record<
  DashboardRole,
  { title: string; body: string; primaryHref: string; primaryLabel: string; secondaryHref?: string; secondaryLabel?: string }
> = {
  gp: {
    title: "Your clinician workspace is ready",
    body: `${PRODUCT_FLOW}. Start with the AI Review Queue — every output needs your approval before it reaches the record.`,
    primaryHref: "/dashboard/gp/review-queue",
    primaryLabel: "Open review queue",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
  },
  nurse: {
    title: "Care coordination workspace ready",
    body: "Observations, handover drafts, and GUARDIAN alerts land here for your review — nothing auto-writes to the record.",
    primaryHref: "/dashboard/nurse/handover",
    primaryLabel: "Open handover",
    secondaryHref: "/how-it-works",
    secondaryLabel: "How it works",
  },
  pharmacist: {
    title: "Medication safety workspace ready",
    body: "GUARDIAN interaction checks and med-review drafts await your Accept / Edit / Reject decision.",
    primaryHref: "/dashboard/pharmacist/interactions",
    primaryLabel: "Open interactions",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
  },
  admin: {
    title: "Practice operations workspace ready",
    body: `${PRECISION_HEALTH_SOFT} Start with Precision Health status and the consent registry.`,
    primaryHref: "/dashboard/admin/precision-health",
    primaryLabel: "Precision Health status",
    secondaryHref: "/dashboard/admin/consent",
    secondaryLabel: "Consent registry",
  },
  ics: {
    title: "ICS intelligence workspace ready",
    body: "Population KPIs, equity flags, and risk-state forecast use synthetic or Neo4j-seeded rehearsal data — not a live ICS feed.",
    primaryHref: "/dashboard/ics/forecast",
    primaryLabel: "Open risk state",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
  },
  hospital: {
    title: "Command Centre ready",
    body: "Operational metrics and risk-state panels are rehearsal scaffolding. Capacity recommendations still need HITL approval.",
    primaryHref: "/dashboard/hospital?panel=digital-twin",
    primaryLabel: "Open risk state",
    secondaryHref: "/walkthrough",
    secondaryLabel: "See walkthrough",
  },
  patient: {
    title: "Welcome to My Health",
    body: "Your care plan and AI check-ins are shown in plain English. Your GP approves anything that affects your record.",
    primaryHref: "/dashboard/patient",
    primaryLabel: "Explore My Health",
    secondaryHref: "/how-it-works",
    secondaryLabel: "How Aksh works",
  },
  researcher: {
    title: "Research workspace ready",
    body: "Evaluation and data-access tools are governed and audited. Federated learning surfaces are read-only stubs.",
    primaryHref: "/dashboard/researcher/evaluation",
    primaryLabel: "Open evaluation",
    secondaryHref: "/resources",
    secondaryLabel: "Resources",
  },
};

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
