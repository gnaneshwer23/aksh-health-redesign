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
      "Integrations honesty (BRIDGE staging · liveEmis:false)",
      "SHIELD audit sample + users / organisation enquiries",
      "Partner readiness / Precision Health as scaffolding only",
    ],
    firstFocus: "Start the ops demo: integrations honesty → SHIELD → enquiries.",
    docsHref: "/demo/script",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight only — clinicians keep clinical Accept.",
    honesty: `${LIVE_EMIS_FALSE} — EMIS write-back Not enabled · designed for EMIS/SystmOne.`,
  },
  "ics-lead": {
    workspaceLabel: "ICS Population Intelligence",
    bullets: [
      "Population → COMPASS equity → forecast (guided demo)",
      "Practice benchmarking across your ICS",
      "Admission forecast & aggregate risk state (not a physiological twin)",
    ],
    firstFocus: "Start the population demo: population → COMPASS equity → forecast.",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views — not patient-level notes.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic cohorts · no patient-level spill.`,
  },
  "hospital-executive": {
    workspaceLabel: "Hospital Command Centre",
    bullets: [
      "Wards → capacity → staffing (synthetic PAS demo)",
      "Capacity recommendations with HITL approval (HORIZON / PATHWAY)",
      "Risk state + scenario ranking (scaffolding — synthetic demo)",
    ],
    firstFocus: "Start the command-centre demo: wards → capacity → staffing.",
    agents: ["HORIZON", "PATHWAY", "COMPASS", "CONDUCTOR"],
    youApprove: "Operational capacity / staffing recommendations.",
    honesty: `${LIVE_EMIS_FALSE} — synthetic PAS, not live EPR.`,
  },
  patient: {
    workspaceLabel: "My Health",
    bullets: [
      "My Health → care plan → consent (companion demo)",
      "Ask Aksh with GP-gated escalation",
      "Check-ins only — clinicians keep HITL",
    ],
    firstFocus: "Start the companion demo: My Health → care plan → consent.",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins only — clinicians Approve record changes.",
    honesty: `${LIVE_EMIS_FALSE} — invite-by-practice · no patient-app EHR write.`,
  },
  researcher: {
    workspaceLabel: "Researcher / Analyst",
    bullets: [
      "Ethics → evaluation → data access (research demo)",
      "COMPASS / SHIELD governed aggregates + audited exports",
      "ATLAS Phase 2 — never claim live",
    ],
    firstFocus: "Start the research demo: ethics empty-state → evaluation → data access.",
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
    body: "3-beat demo: Observations (vitals + timeline) → handover draft → GUARDIAN alerts. CANVAS / SYNTHESIS / GUARDIAN draft; you confirm — SHIELD audits; liveEmis:false.",
    primaryHref: "/dashboard/nurse/observations",
    primaryLabel: "Start observations",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (nurse)",
    agents: ["CANVAS", "SYNTHESIS", "GUARDIAN", "SHIELD"],
    youApprove: "Observations and handover drafts before SHIELD append.",
    honesty: LIVE_EMIS_FALSE,
  },
  pharmacist: {
    title: "Medication safety workspace ready",
    body: "Med-safety demo: review queue → GUARDIAN interaction check → Accept / Edit / Reject (SHIELD). BRIDGE stages only after HITL — liveEmis:false.",
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
    body: "Ops demo: integrations honesty (BRIDGE · designed for EMIS/SystmOne · liveEmis:false) → SHIELD audit → users/enquiries. CONDUCTOR = queue health. Precision Health / partner readiness remain scaffolding — clinicians keep clinical Accept.",
    primaryHref: "/dashboard/admin/integrations",
    primaryLabel: "Integrations honesty",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (admin)",
    agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
    youApprove: "Ops oversight — not clinical SOAP/meds.",
    honesty: LIVE_EMIS_FALSE,
  },
  ics: {
    title: "ICS intelligence workspace ready",
    body: "Population demo: population → COMPASS equity → forecast on synthetic cohorts. Aggregate planning only — no patient-level spill · liveEmis:false · not a live ICS feed or twin.",
    primaryHref: "/dashboard/ics/population",
    primaryLabel: "Start population demo",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (ICS)",
    agents: ["COMPASS", "HORIZON", "PATHWAY", "SHIELD"],
    youApprove: "Aggregate planning views only.",
    honesty: LIVE_EMIS_FALSE,
  },
  hospital: {
    title: "Command Centre ready",
    body: "Command-centre demo: wards → capacity → staffing. PATHWAY / HORIZON draft operational foresight; HITL on recommendations. Synthetic PAS rehearsal — not a live PAS/EPR · liveEmis:false.",
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
    body: "Companion demo: My Health → care plan → consent. Practice-invited view in plain English — clinicians keep HITL on record changes · liveEmis:false · no patient-app EHR write.",
    primaryHref: "/dashboard/patient#companion-my-health",
    primaryLabel: "Start companion demo",
    secondaryHref: "/demo/script",
    secondaryLabel: "Demo script (patient)",
    agents: ["CANVAS", "SYNTHESIS", "PATHWAY", "SHIELD"],
    youApprove: "Check-ins — clinicians Approve record changes.",
    honesty: LIVE_EMIS_FALSE,
  },
  researcher: {
    title: "Research workspace ready",
    body: "Research demo: ethics → evaluation → data access. COMPASS / SHIELD support governed aggregates; ATLAS is Phase 2 — never claim live. Synthetic cohorts · liveEmis:false.",
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
