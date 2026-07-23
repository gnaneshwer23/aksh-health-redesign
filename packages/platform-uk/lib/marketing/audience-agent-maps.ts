/**
 * Role → agent mapping for audience `for-*` pages (U2).
 * Answers: which agents help me, and what do I approve?
 *
 * Honesty locks: HORIZON (not ORACLE); VOICE/Dr.Assist = sub-caps; PRISM/ATLAS Phase 2;
 * liveEmis:false; HITL before any staging.
 */

export type AudienceAgentChip = {
  name: string;
  /** Why this agent matters to this audience */
  why: string;
  /** Optional badge: Phase 2 / sub-cap */
  badge?: "phase2" | "subcap";
};

export type AudienceAgentMap = {
  sectionLabel: string;
  sectionTitle: string;
  sectionDescription: string;
  /** What this role approves (or does not approve) */
  youApprove: string;
  agents: AudienceAgentChip[];
  honestyNote: string;
};

export const AUDIENCE_AGENT_MAPS = {
  clinicians: {
    sectionLabel: "Agents for you",
    sectionTitle: "Which agents help in clinic — and what you approve",
    sectionDescription:
      "Phase-1 drafts land in one review queue. You Accept, Edit, or Reject before anything stages toward the record.",
    youApprove:
      "SOAP notes (SYNTHESIS), safety flags (GUARDIAN), risk drafts (HORIZON), referrals (PATHWAY), and coding suggestions (Dr.Assist under SYNTHESIS). CONDUCTOR never bypasses your gate.",
    agents: [
      { name: "CANVAS", why: "Structures intake from notes or voice so drafts share one patient context." },
      { name: "VOICE", why: "Dictation feeds CANVAS — sub-capability, not a peer agent.", badge: "subcap" },
      { name: "SYNTHESIS", why: "SOAP note drafts for the review queue — never auto-write." },
      {
        name: "Dr.Assist",
        why: "Coding drafts under SYNTHESIS + HITL. John Snow Labs NLP is not wired.",
        badge: "subcap",
      },
      { name: "GUARDIAN", why: "DDI / allergy flags sorted urgent for your review." },
      { name: "HORIZON", why: "CVD / LTC risk drafts (formerly ORACLE) until you Accept." },
      { name: "PATHWAY", why: "Referral and follow-up packages as drafts for sign-off." },
      { name: "NEXUS", why: "Correlated impression drafts under CONDUCTOR." },
      { name: "CONDUCTOR", why: "Orders the consult agents and enforces the HITL gate." },
      { name: "BRIDGE", why: "Stages accepted drafts as FHIR — sim/staging; liveEmis:false." },
      { name: "SHIELD", why: "Immutable audit on every Accept, Edit, or Reject." },
    ],
    honestyNote:
      "PRISM (imaging) and ATLAS (research) are Phase 2 — not built. Demo keeps liveEmis:false.",
  },
  practices: {
    sectionLabel: "Agents for practices",
    sectionTitle: "Ops agents you oversee — clinicians still approve clinical drafts",
    sectionDescription:
      "Practice managers see queue health, integration posture, and audit — without becoming the clinical signer.",
    youApprove:
      "You do not Accept clinical SOAP or meds. You oversee that clinicians are clearing the queue, that BRIDGE/connectors are healthy, and that SHIELD audit is intact.",
    agents: [
      { name: "CONDUCTOR", why: "Shows whether orchestrated drafts are flowing into the review queue." },
      { name: "BRIDGE", why: "Integration / FHIR staging health — sim today; liveEmis:false." },
      { name: "SHIELD", why: "Exportable audit of who approved what — governance evidence." },
      { name: "CANVAS", why: "Intake volume signal for practice workload (clinician-owned content)." },
      { name: "SYNTHESIS", why: "Documentation backlog visible as queue depth — not your sign-off." },
      { name: "GUARDIAN", why: "Safety items waiting in queue — clinicians clear them." },
    ],
    honestyNote:
      "Clinical HITL stays with named clinicians. Partner EMIS write-back is not enabled (liveEmis:false).",
  },
  patients: {
    sectionLabel: "Agents behind your care",
    sectionTitle: "How agents support your plan — clinicians approve",
    sectionDescription:
      "You see plans and check-ins invited by your practice. Clinical agents draft for your care team; you do not approve EHR writes.",
    youApprove:
      "You complete check-ins and raise concerns. Your GP / nurse / pharmacist Approve clinical drafts. Nothing reaches your record without clinician HITL.",
    agents: [
      { name: "CANVAS", why: "Helps your practice capture the visit so plans stay consistent." },
      { name: "SYNTHESIS", why: "Drafts the note your clinician reviews before it is final." },
      { name: "PATHWAY", why: "Referral and follow-up drafts your clinician signs off." },
      { name: "GUARDIAN", why: "Safety checks your clinician sees before prescribing changes." },
      { name: "SHIELD", why: "Keeps an audit trail of clinician decisions about your care." },
    ],
    honestyNote:
      "Patient companion is practice-invited. No live EHR write from the patient app. liveEmis:false.",
  },
  hospitals: {
    sectionLabel: "Agents for trusts",
    sectionTitle: "Command-centre agents — synthetic PAS today",
    sectionDescription:
      "Operational foresight and pathway pressure in one view. Recommendations stay auditable; feeds are demo-synthetic.",
    youApprove:
      "Medical directors and ops leads review operational recommendations. Clinical note Accept still sits with ward clinicians when care drafts are in play.",
    agents: [
      { name: "HORIZON", why: "Demand / risk foresight signals for surge planning (draft aggregates)." },
      { name: "PATHWAY", why: "Care-coordination and flow drafts across wards and referrals." },
      { name: "COMPASS", why: "Equity and population pressure lenses for trust leadership." },
      { name: "CONDUCTOR", why: "Keeps agent outputs ordered and gated — no silent auto-act." },
      { name: "SHIELD", why: "Immutable audit on operational and clinical reviewer actions." },
      { name: "BRIDGE", why: "FHIR staging path — not a live PAS/EPR write-back in this build." },
    ],
    honestyNote:
      "Public hospital demo uses synthetic capacity data only — not a live PAS/EPR feed. liveEmis:false. PRISM/ATLAS remain Phase 2.",
  },
  ics: {
    sectionLabel: "Agents for ICS",
    sectionTitle: "Population agents — aggregates, not patient spill",
    sectionDescription:
      "COMPASS-led equity and capacity views across practices. Population users do not receive patient-level drafts by default.",
    youApprove:
      "You review aggregate equity, demand, and foresight views for planning. You do not Accept individual clinical notes — site clinicians keep HITL.",
    agents: [
      { name: "COMPASS", why: "IMD / ethnicity disparity and population signals across sites." },
      { name: "HORIZON", why: "Aggregate risk foresight for winter / capacity planning." },
      { name: "PATHWAY", why: "System pathway enrolment patterns (aggregate)." },
      { name: "CONDUCTOR", why: "Ensures population outputs stay in governed review paths." },
      { name: "SHIELD", why: "Audit of who queried population views and exports." },
      { name: "BRIDGE", why: "Regional FHIR staging posture — sim/demo; liveEmis:false." },
    ],
    honestyNote:
      "Public ICS demo uses synthetic cohorts only. No patient-level spill to population dashboards by default.",
  },
  administrators: {
    sectionLabel: "Agents for admins",
    sectionTitle: "Integration and audit agents you operate",
    sectionDescription:
      "Keep connectors healthy and prove control. Admins never bypass clinician Accept on clinical drafts.",
    youApprove:
      "You configure tenancy, monitor BRIDGE/ETL health, and evidence SHIELD audit. Clinicians still Accept every clinical output — no admin override.",
    agents: [
      { name: "BRIDGE", why: "FHIR mapping and staging health — sim/staging; liveEmis:false." },
      { name: "SHIELD", why: "Immutable AuditEvent chain for access and reviewer actions." },
      { name: "CONDUCTOR", why: "Orchestration status — drafts flowing, HITL gate intact." },
      { name: "CANVAS", why: "Intake pipeline health for org operations (content owned by clinicians)." },
    ],
    honestyNote:
      "EMIS write-back Not enabled. Partner sandbox / IM1 paused. Admin tools do not bypass HITL.",
  },
  research: {
    sectionLabel: "Agents for research",
    sectionTitle: "Governed cohorts — ATLAS stays Phase 2",
    sectionDescription:
      "Aggregate study metrics and ethics gates today. ATLAS (clinical research agent) is roadmap — never claim live.",
    youApprove:
      "Ethics / data-minimisation review gates what cohorts you see. You do not Accept clinical EHR writes; site clinicians keep HITL.",
    agents: [
      {
        name: "ATLAS",
        why: "Phase 2 clinical research agent — not built. Never claim live.",
        badge: "phase2",
      },
      { name: "COMPASS", why: "Population / equity aggregates usable under research governance." },
      { name: "SHIELD", why: "Audit of queries and exports for ethics evidence." },
      { name: "HORIZON", why: "Aggregate risk strata for outcome evaluation (synthetic demo)." },
      { name: "BRIDGE", why: "Governed FHIR-shaped exports from staging — not live EMR scrape." },
    ],
    honestyNote:
      "ATLAS is Phase 2 (live:false). Aggregate access by default. Demo data is synthetic. liveEmis:false.",
  },
} as const satisfies Record<string, AudienceAgentMap>;
