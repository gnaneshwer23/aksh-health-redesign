/**
 * Marketing “job in the loop” copy for the 12-agent directory.
 * Keeps AGENT_DIRECTORY as the roster source of truth; this file only adds narrative.
 *
 * Honesty locks: HORIZON (not ORACLE); VOICE/Dr.Assist = sub-caps; PRISM/ATLAS Phase 2;
 * liveEmis:false; HITL before any staging.
 */

export type AgentLoopStage =
  | "capture"
  | "draft"
  | "orchestrate"
  | "approve"
  | "stage"
  | "population"
  | "roadmap";

export type AgentJobInLoop = {
  stage: AgentLoopStage;
  /** One-line “what it does in a consult” for AgentGrid / scripts */
  job: string;
};

export const AGENT_JOB_IN_LOOP: Record<string, AgentJobInLoop> = {
  CANVAS: {
    stage: "capture",
    job: "Structures patient history, meds, and encounter context from notes or voice so drafts start from one shared intake.",
  },
  SYNTHESIS: {
    stage: "draft",
    job: "Turns the consult into a SOAP note draft for the review queue — never an auto-write to the record.",
  },
  GUARDIAN: {
    stage: "draft",
    job: "Flags drug interactions and allergy risks so high-severity items sort urgent for clinician review.",
  },
  HORIZON: {
    stage: "draft",
    job: "Scores CVD / long-term-condition risk (formerly ORACLE) as a draft RiskAssessment until Accept.",
  },
  PATHWAY: {
    stage: "draft",
    job: "Packages referrals, pathway enrolment, and follow-up tasks as drafts for sign-off.",
  },
  NEXUS: {
    stage: "draft",
    job: "Correlates labs, meds, and graph signals into a draft clinical impression under CONDUCTOR.",
  },
  CONDUCTOR: {
    stage: "orchestrate",
    job: "Orders agents for the consult type, aggregates drafts, and enforces the HITL gate before staging.",
  },
  BRIDGE: {
    stage: "stage",
    job: "Maps accepted drafts to FHIR R4 shapes and stages them — sim/staging today; liveEmis:false.",
  },
  SHIELD: {
    stage: "approve",
    job: "Writes an immutable audit event on every Accept, Edit, or Reject — runs automatically.",
  },
  COMPASS: {
    stage: "population",
    job: "Aggregates risk and equity signals for ICS views — no patient-level spill to population users.",
  },
  PRISM: {
    stage: "roadmap",
    job: "Phase 2 imaging intelligence (DICOM → structured FHIR). Not built — never claim live.",
  },
  ATLAS: {
    stage: "roadmap",
    job: "Phase 2 clinical research agent. Not built — never claim live.",
  },
};

export const LOOP_STAGE_LABEL: Record<AgentLoopStage, string> = {
  capture: "Capture",
  draft: "Draft",
  orchestrate: "Orchestrate",
  approve: "Approve + audit",
  stage: "Stage",
  population: "Population",
  roadmap: "Phase 2",
};

/** Sub-capabilities — not peer directory agents (N4 honesty). */
export const AGENT_SUB_CAPABILITIES = [
  {
    name: "VOICE",
    under: "CANVAS",
    job: "Dictation feeds CANVAS intake. Sub-capability — not a 13th peer agent. Live ASR only when Deepgram is configured; otherwise labelled simulated.",
  },
  {
    name: "Dr.Assist",
    under: "SYNTHESIS",
    job: "Coding drafts (SNOMED / ICD-10) under SYNTHESIS + HITL. Sub-capability — not a 14th peer agent. John Snow Labs NLP is not wired.",
  },
] as const;

/**
 * Two-minute marketing script beats (home → how-it-works → platform).
 * Demo hosts can read these aloud without opening a dashboard.
 */
export const TWO_MINUTE_MARKETING_SCRIPT = [
  {
    beat: "1 · Home",
    say: "Capture → draft → approve. Clinician review on every output across EMIS Web and SystmOne pathways.",
    href: "/",
  },
  {
    beat: "2 · Workflow",
    say: "Supporting intelligence in one pipeline. Review coordination; Accept, Edit, or Reject; FHIR exchange; immutable audit.",
    href: "/how-it-works#pipeline",
  },
  {
    beat: "3 · Platform",
    say: "Clinical Capture, Documentation, Safety Review, Risk Signals, Referral Support, FHIR Exchange, and Audit — clinicians remain responsible.",
    href: "/platform#agents",
  },
  {
    beat: "4 · Demonstrate",
    say: "Walk Capture → Draft → Approve on the demonstration script — clinician control throughout.",
    href: "/demo/script",
  },
] as const;
