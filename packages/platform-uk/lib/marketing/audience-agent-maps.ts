/**
 * Role → capability mapping for audience `for-*` pages.
 * Public marketing uses human-facing labels (not internal agent codenames).
 */

export type AudienceAgentChip = {
  name: string;
  /** Why this capability matters to this audience */
  why: string;
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
    sectionLabel: "Capabilities for you",
    sectionTitle: "What supports clinic — and what you approve",
    sectionDescription:
      "Structured drafts land in one review queue. You Accept, Edit, or Reject before anything reaches the record.",
    youApprove:
      "Documentation drafts, safety flags, risk signals, referrals, and coding suggestions. Review coordination never bypasses your gate.",
    agents: [
      { name: "Clinical Capture", why: "Structures intake from notes or voice so drafts share one patient context." },
      { name: "Documentation", why: "SOAP note drafts for the review queue — never auto-write." },
      { name: "Safety Review", why: "Drug interaction and allergy flags sorted for your attention." },
      { name: "Risk Signals", why: "Clinical risk drafts until you Accept or Edit." },
      { name: "Referral Support", why: "Referral and follow-up packages as drafts for sign-off." },
      { name: "Clinical Correlation", why: "Correlated impression drafts under review coordination." },
      { name: "Review Coordination", why: "Orders supporting checks and enforces clinician review." },
      { name: "FHIR Exchange", why: "Maps accepted drafts for integration with existing clinical systems." },
      { name: "Audit", why: "Immutable record on every Accept, Edit, or Reject." },
    ],
    honestyNote:
      "Every clinical output waits for a named clinician decision before exchange with existing systems.",
  },
  practices: {
    sectionLabel: "Capabilities for practices",
    sectionTitle: "Ops visibility you oversee — clinicians still approve clinical drafts",
    sectionDescription:
      "Practice managers see queue health, integration posture, and audit — without becoming the clinical signer.",
    youApprove:
      "You do not Accept clinical documentation or medications. You oversee that clinicians are clearing the queue, that integrations are healthy, and that audit trails remain intact.",
    agents: [
      { name: "Review Coordination", why: "Shows whether drafts are flowing into the review queue." },
      { name: "FHIR Exchange", why: "Integration health for clinical exchange pathways." },
      { name: "Audit", why: "Exportable record of who approved what — governance evidence." },
      { name: "Clinical Capture", why: "Intake volume signal for practice workload." },
      { name: "Documentation", why: "Documentation backlog visible as queue depth — not your sign-off." },
      { name: "Safety Review", why: "Safety items waiting in queue — clinicians clear them." },
    ],
    honestyNote:
      "Clinical review stays with named clinicians. Designed for EMIS Web and SystmOne pathways.",
  },
  patients: {
    sectionLabel: "Support behind your care",
    sectionTitle: "How the platform supports your plan — clinicians approve",
    sectionDescription:
      "You see plans and check-ins invited by your practice. Clinical drafts go to your care team; you do not approve record writes.",
    youApprove:
      "You complete check-ins and raise concerns. Your GP, nurse, or pharmacist Approve clinical drafts. Nothing reaches your record without clinician review.",
    agents: [
      { name: "Clinical Capture", why: "Helps your practice capture the visit so plans stay consistent." },
      { name: "Documentation", why: "Drafts the note your clinician reviews before it is final." },
      { name: "Referral Support", why: "Referral and follow-up drafts your clinician signs off." },
      { name: "Safety Review", why: "Safety checks your clinician sees before prescribing changes." },
      { name: "Audit", why: "Keeps a record of clinician decisions about your care." },
    ],
    honestyNote:
      "Patient companion is practice-invited. Clinical decisions remain with your care team.",
  },
  hospitals: {
    sectionLabel: "Capabilities for trusts",
    sectionTitle: "Command-centre visibility for operational pressure",
    sectionDescription:
      "Operational foresight and pathway pressure in one view. Recommendations stay auditable.",
    youApprove:
      "Medical directors and ops leads review operational recommendations. Clinical note Accept still sits with ward clinicians when care drafts are in play.",
    agents: [
      { name: "Risk Signals", why: "Demand and risk foresight signals for surge planning." },
      { name: "Referral Support", why: "Care-coordination and flow drafts across wards and referrals." },
      { name: "Population Insights", why: "Equity and population pressure lenses for trust leadership." },
      { name: "Review Coordination", why: "Keeps supporting outputs ordered and gated — no silent auto-act." },
      { name: "Audit", why: "Immutable record on operational and clinical reviewer actions." },
      { name: "FHIR Exchange", why: "Exchange path for governed clinical information." },
    ],
    honestyNote:
      "Public hospital demo uses illustrative capacity data for demonstration — not a live PAS feed.",
  },
  ics: {
    sectionLabel: "Capabilities for ICS",
    sectionTitle: "Population insights — aggregates, not patient spill",
    sectionDescription:
      "Equity and capacity views across practices. Population users do not receive patient-level drafts by default.",
    youApprove:
      "You review aggregate equity, demand, and foresight views for planning. You do not Accept individual clinical notes — site clinicians keep review.",
    agents: [
      { name: "Population Insights", why: "Disparity and population signals across sites." },
      { name: "Risk Signals", why: "Aggregate risk foresight for capacity planning." },
      { name: "Referral Support", why: "System pathway enrolment patterns (aggregate)." },
      { name: "Review Coordination", why: "Ensures population outputs stay in governed review paths." },
      { name: "Audit", why: "Record of who queried population views and exports." },
      { name: "FHIR Exchange", why: "Regional exchange posture for connected organisations." },
    ],
    honestyNote:
      "Public ICS demo uses illustrative cohorts. No patient-level spill to population dashboards by default.",
  },
  administrators: {
    sectionLabel: "Capabilities for admins",
    sectionTitle: "Integration and audit you operate",
    sectionDescription:
      "Keep connectors healthy and prove control. Admins never bypass clinician Accept on clinical drafts.",
    youApprove:
      "You configure tenancy, monitor exchange health, and evidence audit trails. Clinicians still Accept every clinical output — no admin override.",
    agents: [
      { name: "FHIR Exchange", why: "Mapping and exchange health for clinical systems." },
      { name: "Audit", why: "Immutable record chain for access and reviewer actions." },
      { name: "Review Coordination", why: "Orchestration status — drafts flowing, review gate intact." },
      { name: "Clinical Capture", why: "Intake pipeline health for org operations." },
    ],
    honestyNote:
      "Admin tools do not bypass clinician review. Designed for organisation-level access controls.",
  },
  research: {
    sectionLabel: "Capabilities for research",
    sectionTitle: "Governed cohorts for service improvement",
    sectionDescription:
      "Aggregate study metrics and ethics gates. Research access stays governed and auditable.",
    youApprove:
      "Ethics and data-minimisation review gates what cohorts you see. You do not Accept clinical record writes; site clinicians keep review.",
    agents: [
      { name: "Population Insights", why: "Population and equity aggregates usable under research governance." },
      { name: "Audit", why: "Record of queries and exports for ethics evidence." },
      { name: "Risk Signals", why: "Aggregate risk strata for outcome evaluation." },
      { name: "FHIR Exchange", why: "Governed exports shaped for research use." },
    ],
    honestyNote:
      "Aggregate access by default. Demo data is illustrative. Ethics boundaries remain explicit.",
  },
} as const satisfies Record<string, AudienceAgentMap>;
