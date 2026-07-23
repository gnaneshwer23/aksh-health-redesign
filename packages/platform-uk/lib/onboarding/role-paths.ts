/**
 * U3 — Personalised onboarding paths per role.
 * Answers: which agents matter for me, what do I approve, where do I land, honesty locks.
 *
 * Invariants: liveEmis:false · HITL before staging · PRISM/ATLAS Phase 2 · VOICE/Dr.Assist = sub-caps
 */

import type { UserRole } from "@/lib/onboarding/roles";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

export type RolePathAgent = {
  name: string;
  why: string;
  badge?: "phase2" | "subcap";
};

export type RoleTutorialScreen = {
  title: string;
  body: string;
  /** Short checklist / example lines shown under the body */
  bullets?: string[];
  /** Agent names highlighted on this screen */
  agents?: string[];
  /** Optional honesty callout on this screen */
  honesty?: string;
  ctaLabel?: string;
};

export type RoleOnboardingPath = {
  role: UserRole;
  dashboardRole: DashboardRole;
  /** Short path promise on role-select / complete */
  pathPromise: string;
  agents: RolePathAgent[];
  youApprove: string;
  honestyNote: string;
  tutorialScreens: RoleTutorialScreen[];
  /** Preference key → human tip for first-run (when set during onboarding) */
  preferenceTips?: Record<string, (value: string) => string | null>;
};

const LIVE_EMIS =
  "Demo / staging only — liveEmis:false. No live EMIS or SystmOne write-back in this build.";

export const ROLE_ONBOARDING_PATHS: Record<UserRole, RoleOnboardingPath> = {
  gp: {
    role: "gp",
    dashboardRole: "gp",
    pathPromise: "Review queue → Accept/Edit/Reject → BRIDGE stages only what you approve",
    agents: [
      { name: "CANVAS", why: "Structures intake so drafts share one patient context." },
      { name: "VOICE", why: "Dictation into CANVAS — sub-capability, not a peer.", badge: "subcap" },
      { name: "SYNTHESIS", why: "SOAP drafts for your review queue." },
      { name: "Dr.Assist", why: "Coding drafts under SYNTHESIS + HITL.", badge: "subcap" },
      { name: "GUARDIAN", why: "DDI / allergy flags before you prescribe." },
      { name: "HORIZON", why: "CVD / LTC risk drafts (ex-ORACLE)." },
      { name: "PATHWAY", why: "Referral and follow-up packages as drafts." },
      { name: "CONDUCTOR", why: "Orders agents and enforces your HITL gate." },
      { name: "BRIDGE", why: "Stages accepted FHIR — sim only." },
      { name: "SHIELD", why: "Immutable audit on every decision." },
    ],
    youApprove:
      "Every clinical draft — SOAP, codes, GUARDIAN alerts, HORIZON scores, PATHWAY referrals. Nothing reaches the record without your Accept.",
    honestyNote: `${LIVE_EMIS} PRISM/ATLAS remain Phase 2.`,
    tutorialScreens: [
      {
        title: "Everything AI suggests. Nothing AI decides.",
        body: "Capture → draft → approve is the heart of Aksh Health. Every output lands in your Review Queue as a draft. You Accept, Edit, or Reject before BRIDGE can stage.",
        agents: ["SYNTHESIS", "GUARDIAN", "CONDUCTOR", "SHIELD"],
        bullets: [
          "[SYNTHESIS] SOAP note draft — Accept / Edit / Reject",
          "[Dr.Assist] Coding suggestion under SYNTHESIS — HITL",
          "[GUARDIAN] Interaction flag — you decide",
          "0 items auto-written to the record",
        ],
        honesty: LIVE_EMIS,
      },
      {
        title: "From dictation to SOAP draft",
        body: "VOICE feeds CANVAS; SYNTHESIS drafts the note. It stays a draft until you approve.",
        agents: ["VOICE", "CANVAS", "SYNTHESIS"],
        bullets: ["Mic → transcript → SOAP draft", "Review Queue holds it until Accept"],
      },
      {
        title: "GUARDIAN before you prescribe",
        body: "Interaction and allergy checks use BNF-backed rules. Flags wait for your decision — they never auto-write.",
        agents: ["GUARDIAN"],
        bullets: ["High / medium / safe interaction bands", "You Accept, Edit, or Reject every flag"],
      },
      {
        title: "HORIZON risk drafts",
        body: "HORIZON (formerly ORACLE) scores patients from the record and surfaces contributing factors — still drafts until you Accept.",
        agents: ["HORIZON", "PATHWAY"],
        bullets: ["Risk score with factors", "PATHWAY follow-ups drafted for confirmation"],
      },
      {
        title: "You're ready",
        body: "Your Clinician Dashboard opens with first-run guidance: Review Queue first, then today's panel. Precision Health remains scaffolding.",
        agents: ["CONDUCTOR", "BRIDGE", "SHIELD"],
        bullets: [
          "Open Review Queue",
          "Clear drafts with HITL",
          "BRIDGE stages only accepted items — liveEmis:false",
        ],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      oracleAlerts: (v) =>
        v === "High risk only"
          ? "HORIZON alerts set to high-risk only — start with the riskiest patients on today's list."
          : v === "Off"
            ? "HORIZON alerts are off — you can re-enable them in settings."
            : null,
      guardianSensitivity: (v) =>
        v === "Severe only"
          ? "GUARDIAN shows severe interactions only — open Interactions when you need the full set."
          : null,
      voiceAgent: (v) =>
        v === "On" ? "VOICE dictation is on — look for the mic on consult capture." : null,
    },
  },

  nurse: {
    role: "nurse",
    dashboardRole: "nurse",
    pathPromise: "Observations → handover drafts → GUARDIAN alerts — all HITL",
    agents: [
      { name: "CANVAS", why: "Structures observations into shared patient context." },
      { name: "SYNTHESIS", why: "Handover and note drafts for your review." },
      { name: "GUARDIAN", why: "Safety alerts routed for clinical follow-up." },
      { name: "PATHWAY", why: "Follow-up tasks linked to the care plan." },
      { name: "SHIELD", why: "Audit when you confirm observations / handover." },
      { name: "CONDUCTOR", why: "Keeps drafts gated — no silent auto-write." },
    ],
    youApprove:
      "Observation entries and handover drafts before they append to the durable audit. Clinicians still Approve EHR-bound clinical writes — liveEmis:false.",
    honestyNote: `${LIVE_EMIS} Observations and handovers do not write to EMIS/SystmOne from this proof build.`,
    tutorialScreens: [
      {
        title: "Your three-beat care path",
        body: "Record observations, draft handover, clear GUARDIAN alerts. Each step waits for your confirmation.",
        agents: ["CANVAS", "SYNTHESIS", "GUARDIAN"],
        bullets: ["Observations → structured capture", "Handover → draft for review", "Alerts → clinical follow-up"],
        honesty: LIVE_EMIS,
      },
      {
        title: "Handover stays a draft",
        body: "SYNTHESIS prepares shift handover from the session. You review before it is confirmed.",
        agents: ["SYNTHESIS", "SHIELD"],
        bullets: ["Auto or manual handover per your preferences", "SHIELD audits confirmations"],
      },
      {
        title: "You're ready",
        body: "Nurse Dashboard opens with a 3-beat hero path: observations → handover → GUARDIAN alerts.",
        bullets: ["Start observations", "Confirm handover draft", "Clear GUARDIAN alerts · liveEmis:false"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      handoverSummary: (v) =>
        v === "Auto at shift end"
          ? "Handover is set to auto at shift end — review the draft before confirming."
          : "Handover is manual — open Shift handover when you are ready to draft.",
      guardianAlerts: (v) =>
        v === "Off" ? "GUARDIAN alerts are off — re-enable in preferences if you need safety flags." : null,
    },
  },

  "clinical-pharmacist": {
    role: "clinical-pharmacist",
    dashboardRole: "pharmacist",
    pathPromise: "Med review → GUARDIAN interactions → HITL stage",
    agents: [
      { name: "GUARDIAN", why: "BNF-backed interaction and allergy checks." },
      { name: "SYNTHESIS", why: "Med-review documentation drafts." },
      { name: "CONDUCTOR", why: "Holds drafts until your Accept." },
      { name: "BRIDGE", why: "Stages only accepted med changes — sim." },
      { name: "SHIELD", why: "Audit of every Accept / Edit / Reject." },
    ],
    youApprove:
      "Medication review drafts and interaction recommendations. You Accept, Edit, or Reject before any staging — liveEmis:false.",
    honestyNote: `${LIVE_EMIS} GUARDIAN flags are drafts until you decide.`,
    tutorialScreens: [
      {
        title: "Medication safety is HITL",
        body: "GUARDIAN checks interactions against current meds and allergies. Nothing stages without your decision.",
        agents: ["GUARDIAN", "SYNTHESIS"],
        bullets: ["Review queue for polypharmacy", "Interaction checker with edit-and-stage", "BNF reference alongside"],
        honesty: LIVE_EMIS,
      },
      {
        title: "Queue → interaction → stage",
        body: "Work open reviews, clear interaction flags, then Accept so BRIDGE can stage FHIR-shaped drafts in sim.",
        agents: ["GUARDIAN", "BRIDGE", "SHIELD"],
        bullets: ["Open interactions first if severity is high", "SHIELD records your decision"],
      },
      {
        title: "You're ready",
        body: "Pharmacist Dashboard opens with a med-safety hero path: review → GUARDIAN → HITL stage.",
        bullets: ["Open med review", "Run GUARDIAN check", "Accept · SHIELD · liveEmis:false"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      bnfAlerts: (v) =>
        v === "Severe only"
          ? "BNF alerts set to severe only — open the full checker when you need medium-risk flags."
          : null,
      guardianSensitivity: (v) =>
        v === "High" ? "GUARDIAN sensitivity is high — expect more interaction flags in the queue." : null,
    },
  },

  "practice-manager": {
    role: "practice-manager",
    dashboardRole: "admin",
    pathPromise: "Integrations honesty → SHIELD audit → users/enquiries — clinicians keep HITL",
    agents: [
      { name: "CONDUCTOR", why: "Queue health — drafts flowing, gate intact." },
      { name: "BRIDGE", why: "FHIR staging posture — sim; liveEmis:false." },
      { name: "SHIELD", why: "Exportable audit of who approved what." },
      { name: "CANVAS", why: "Intake volume signal for practice workload." },
    ],
    youApprove:
      "You do not Accept clinical SOAP or meds. You oversee connectors, audit, and that clinicians are clearing the queue.",
    honestyNote: `${LIVE_EMIS} Partner EMIS write-back is Not enabled. Designed for EMIS/SystmOne — admin tools never bypass clinician Accept.`,
    tutorialScreens: [
      {
        title: "Ops oversight, not clinical sign-off",
        body: "Your dashboard is a practice-manager ops demo: integrations honesty, SHIELD audit, and users/enquiries — not an eng console. Named clinicians still Accept every clinical draft.",
        agents: ["BRIDGE", "SHIELD", "CONDUCTOR"],
        bullets: ["Integrations honesty", "SHIELD audit sample", "Precision Health = scaffolding"],
        honesty: LIVE_EMIS,
      },
      {
        title: "Honesty first",
        body: "Partner readiness shows liveEmis:false. Designed for EMIS Web / SystmOne pathways — staging/sim only, not a live EMR connection.",
        agents: ["BRIDGE"],
        bullets: ["EMIS write-back Not enabled", "BRIDGE / CONDUCTOR ops framing", "Consent registry for purpose grants"],
        honesty: LIVE_EMIS,
      },
      {
        title: "You're ready",
        body: "Practice Manager Dashboard opens with an ops hero path: integrations → SHIELD → enquiries. First-run points at integrations honesty.",
        bullets: ["Start integrations honesty", "Open SHIELD audit", "Users / enquiries · liveEmis:false"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      extractionAlerts: (v) =>
        v === "Email on failure"
          ? "Extraction failure alerts go to email — check Integrations if jobs fail."
          : null,
    },
  },

  "ics-lead": {
    role: "ics-lead",
    dashboardRole: "ics",
    pathPromise: "Population → COMPASS equity → forecast on synthetic cohorts",
    agents: [
      { name: "COMPASS", why: "Equity and IMD-linked population signals." },
      { name: "HORIZON", why: "Aggregate risk foresight for planning." },
      { name: "PATHWAY", why: "System pathway patterns (aggregate)." },
      { name: "CONDUCTOR", why: "Governed review paths for population outputs." },
      { name: "SHIELD", why: "Audit of queries and exports." },
      { name: "BRIDGE", why: "Regional staging posture — sim/demo." },
    ],
    youApprove:
      "Aggregate planning views — not individual clinical notes. Site clinicians keep HITL on patient drafts.",
    honestyNote: `${LIVE_EMIS} Public ICS demo uses synthetic cohorts only. No patient-level spill by default.`,
    tutorialScreens: [
      {
        title: "Population intelligence",
        body: "KPIs, equity flags, and benchmarking across practices — COMPASS-led, aggregate by default.",
        agents: ["COMPASS", "HORIZON"],
        bullets: ["Population health", "Equity metrics", "Practice benchmarking"],
        honesty: "Synthetic cohorts — not a live ICS feed.",
      },
      {
        title: "Forecast & risk state",
        body: "Admission forecast and aggregate risk-state scaffolding for winter planning — not a physiological twin.",
        agents: ["HORIZON", "PATHWAY"],
        bullets: ["14-day forecast", "Surge scenarios on rehearsal data"],
      },
      {
        title: "You're ready",
        body: "ICS Dashboard opens with first-run guidance on the population → COMPASS equity → forecast hero path.",
        bullets: ["Start population demo", "COMPASS equity beat", "liveEmis:false · no patient-level spill"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      imdOverlay: (v) => (v === "On" ? "IMD overlay is on — open Equity for deprivation-linked flags." : null),
      digitalTwinHospital: (v) =>
        v === "On"
          ? "Hospital demand risk-state is on — treat it as scaffolding, not a live twin."
          : null,
    },
  },

  "hospital-executive": {
    role: "hospital-executive",
    dashboardRole: "hospital",
    pathPromise: "Wards → capacity → staffing with synthetic PAS honesty",
    agents: [
      { name: "HORIZON", why: "Demand / surge foresight drafts." },
      { name: "PATHWAY", why: "Flow and discharge coordination drafts." },
      { name: "COMPASS", why: "Equity pressure lenses for leadership." },
      { name: "CONDUCTOR", why: "No silent auto-act on recommendations." },
      { name: "SHIELD", why: "Audit on operational reviewer actions." },
      { name: "BRIDGE", why: "Not a live PAS/EPR write-back." },
    ],
    youApprove:
      "Operational recommendations (capacity / staffing). Ward clinicians still Accept clinical care drafts when in play.",
    honestyNote: `${LIVE_EMIS} Public hospital demo uses synthetic capacity only — not a live PAS/EPR feed.`,
    tutorialScreens: [
      {
        title: "Command Centre",
        body: "ED wait, beds, and staffing in one view. Feeds are demo-synthetic — not live PAS.",
        agents: ["HORIZON", "PATHWAY"],
        bullets: ["Ward status", "Capacity forecast", "Staffing alerts"],
        honesty: "Synthetic PAS — liveEmis:false.",
      },
      {
        title: "Recommendations need HITL",
        body: "Capacity AI suggestions wait for executive / ops review. CONDUCTOR keeps the gate.",
        agents: ["CONDUCTOR", "SHIELD"],
        bullets: ["Accept capacity recommendations", "Risk-state panels are scaffolding"],
      },
      {
        title: "You're ready",
        body: "Hospital Command Centre opens with first-run guidance on the wards → capacity → staffing hero path.",
        bullets: ["Start wards demo", "Capacity HITL (HORIZON)", "Not a live PAS · liveEmis:false"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      bedManagementAlerts: (v) =>
        v === "On" ? "Bed management alerts are on — check Capacity for occupancy flags." : null,
      digitalTwinWinter: (v) =>
        v === "On" ? "Winter surge risk-state is on — synthetic rehearsal only." : null,
    },
  },

  patient: {
    role: "patient",
    dashboardRole: "patient",
    pathPromise: "My Health check-ins — your care team keeps clinical approval",
    agents: [
      { name: "CANVAS", why: "Helps your practice capture visits consistently." },
      { name: "SYNTHESIS", why: "Drafts the note your clinician reviews." },
      { name: "PATHWAY", why: "Follow-up drafts your clinician signs off." },
      { name: "GUARDIAN", why: "Safety checks your clinician sees." },
      { name: "SHIELD", why: "Audit of clinician decisions about your care." },
    ],
    youApprove:
      "You complete check-ins and raise concerns. Your GP / nurse / pharmacist Approve clinical drafts — you do not approve EHR writes.",
    honestyNote: `${LIVE_EMIS} Patient companion is practice-invited. No live EHR write from the patient app.`,
    tutorialScreens: [
      {
        title: "My Health in plain English",
        body: "See conditions, medications, and your care plan. Clinical changes still need your GP's approval.",
        agents: ["SYNTHESIS", "PATHWAY"],
        bullets: ["Care plan visibility", "Ask Aksh with GP-gated escalation"],
        honesty: LIVE_EMIS,
      },
      {
        title: "Check-ins",
        body: "Reply to how-you're-doing prompts. Important answers can be flagged to your care team.",
        agents: ["CANVAS", "SHIELD"],
        bullets: ["Text / app check-ins", "Clinicians keep HITL"],
      },
      {
        title: "You're ready",
        body: "My Health opens with first-run guidance to explore your plan.",
        bullets: ["Confirm your care plan", "Your GP approves record changes"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
  },

  researcher: {
    role: "researcher",
    dashboardRole: "researcher",
    pathPromise: "Governed cohorts + ethics gates — ATLAS stays Phase 2",
    agents: [
      { name: "ATLAS", why: "Phase 2 clinical research agent — not built.", badge: "phase2" },
      { name: "COMPASS", why: "Population / equity aggregates under governance." },
      { name: "SHIELD", why: "Audit of queries and exports." },
      { name: "HORIZON", why: "Aggregate risk strata for evaluation (synthetic)." },
      { name: "BRIDGE", why: "Governed FHIR-shaped exports from staging." },
    ],
    youApprove:
      "Ethics / data-minimisation gates on cohorts you see. You do not Accept clinical EHR writes — site clinicians keep HITL.",
    honestyNote: `${LIVE_EMIS} ATLAS is Phase 2 (live:false). Aggregate access by default. Demo data is synthetic.`,
    tutorialScreens: [
      {
        title: "Governed research workspace",
        body: "Cohort KPIs and evaluation exports are audited. ATLAS is roadmap — never claim live.",
        agents: ["ATLAS", "COMPASS", "SHIELD"],
        bullets: ["Outcome evaluation", "Data-access terms", "Federated jobs = read-only stubs"],
        honesty: "ATLAS Phase 2 · liveEmis:false",
      },
      {
        title: "Ethics before individual access",
        body: "Aggregate is the default. Individual access requires ethics confirmation in your preferences.",
        agents: ["SHIELD", "BRIDGE"],
        bullets: ["Review data-access level", "SHIELD logs exports"],
      },
      {
        title: "You're ready",
        body: "Researcher Dashboard opens with first-run guidance on evaluation.",
        bullets: ["Open evaluation", "Confirm ethics status", "ATLAS not live"],
        honesty: LIVE_EMIS,
        ctaLabel: "Continue to complete",
      },
    ],
    preferenceTips: {
      dataAccessLevel: (v) =>
        v.includes("Individual")
          ? "Individual access selected — confirm ethics reference before opening identifiable views."
          : "Aggregate (anonymised) access — default safe path for demos.",
    },
  },
};

export function getRoleOnboardingPath(role: UserRole | null | undefined): RoleOnboardingPath | null {
  if (!role) return null;
  return ROLE_ONBOARDING_PATHS[role] ?? null;
}

/** Build preference-aware tip lines for first-run guidance. */
export function buildPreferenceTips(
  role: UserRole | null | undefined,
  preferences: Record<string, unknown> | null | undefined
): string[] {
  const path = getRoleOnboardingPath(role);
  if (!path?.preferenceTips || !preferences) return [];

  const tips: string[] = [];
  for (const [key, formatter] of Object.entries(path.preferenceTips)) {
    const raw = preferences[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const tip = formatter(raw);
    if (tip) tips.push(tip);
  }
  return tips;
}

export const ALL_ONBOARDING_ROLES = Object.keys(ROLE_ONBOARDING_PATHS) as UserRole[];
