/**
 * Marketing copy sourced from docs/AKSH_VISION_PRD_OVERVIEW.md (Vision & PRD overview) and
 * Volume I. Keep wording and status labels in step with those docs: if a status changes there,
 * change it here. Track A only — never imply Track B, certification, or outcome claims.
 */

import type { ClinicalStatus } from "@/components/marketing/clinical-status";

export type BuildStatus = { label: string; tone: ClinicalStatus };

const LIVE: BuildStatus = { label: "Live", tone: "approved" };
const LIVE_REVIEWED: BuildStatus = { label: "Live · clinician reviewed", tone: "approved" };
const PARTIAL: BuildStatus = { label: "Partial", tone: "needs-review" };
const NOT_BUILT: BuildStatus = { label: "Not built yet", tone: "unverified" };

/**
 * Canonical 12 from AGENT_DIRECTORY (lib/agents.ts). Human label leads (23 Jul 2026 marketing
 * decision); codename is secondary. VOICE and Dr.Assist are sub-capabilities of CANVAS and
 * SYNTHESIS (N4 audit lock), never peer agents. PRISM / ATLAS stay not built.
 */
export const PLATFORM_AGENTS: {
  label: string;
  codename: string;
  role: string;
  includes?: string;
  status: BuildStatus;
}[] = [
  { label: "Clinical intake", codename: "CANVAS", role: "Structured capture from notes, forms and intake", includes: "Includes VOICE dictation", status: LIVE },
  { label: "Clinical documentation", codename: "SYNTHESIS", role: "SOAP note and structured draft", includes: "Includes Dr.Assist coding (SNOMED CT first)", status: LIVE_REVIEWED },
  { label: "Medication safety", codename: "GUARDIAN", role: "Interaction and allergy flags held for review", status: LIVE_REVIEWED },
  { label: "Predictive risk", codename: "HORIZON", role: "Risk change with its contributing factors listed", status: LIVE_REVIEWED },
  { label: "Clinical intelligence", codename: "NEXUS", role: "Correlates labs, medicines and signals into a draft picture", status: LIVE_REVIEWED },
  { label: "Care coordination", codename: "PATHWAY", role: "Referral, pathway and follow-up packages for sign-off", status: LIVE_REVIEWED },
  { label: "Population health", codename: "COMPASS", role: "Equity and cohort briefs for population views", status: PARTIAL },
  { label: "Interoperability", codename: "BRIDGE", role: "FHIR R4 staging after Accept; simulated EHR only", status: LIVE },
  { label: "Regulatory & audit", codename: "SHIELD", role: "Tamper-evident record of every draft and decision", status: LIVE },
  { label: "Supervisor", codename: "CONDUCTOR", role: "Runs every agent in a fixed, inspectable order", status: LIVE },
  { label: "Imaging intelligence", codename: "PRISM", role: "Imaging review support", status: NOT_BUILT },
  { label: "Clinical research", codename: "ATLAS", role: "Research and trial support", status: NOT_BUILT },
];

/** PRD §1.1 + Diabetes spec — nine intelligence areas, rules-based v1 on synthetic data. */
export const DIABETES_AREAS: { name: string; output: string; gate: string; status: BuildStatus }[] = [
  {
    name: "Glucose",
    output: "Time in range, variability and pattern flags",
    gate: "Observational; gated only when it raises a GUARDIAN alert",
    status: { label: "Awaiting CGM data model", tone: "unverified" },
  },
  {
    name: "HbA1c",
    output: "Latest value, trend and a labelled non-diagnostic 3-month estimate",
    gate: "Clinician review before any care-plan change",
    status: { label: "v1 rules", tone: "approved" },
  },
  {
    name: "Insulin",
    output: "Regimen summary, timing observations, hypo-risk flag",
    gate: "Hard gate through GUARDIAN; never an executable dose",
    status: { label: "v1 rules · explanatory", tone: "approved" },
  },
  {
    name: "GLP-1",
    output: "Suitability talking point, response trend, side-effect flags",
    gate: "Clinician review before any initiation or change",
    status: { label: "v1 rules", tone: "approved" },
  },
  {
    name: "Nutrition",
    output: "Diabetes-specific coaching draft, not clinical advice",
    gate: "Escalation hints route to a clinician",
    status: { label: "v1 coaching draft", tone: "approved" },
  },
  {
    name: "Exercise",
    output: "Resistance and cardio talking points",
    gate: "Same coaching gate as nutrition",
    status: { label: "v1 coaching draft", tone: "approved" },
  },
  {
    name: "Behaviour",
    output: "Habit and adherence talking points",
    gate: "Distress or risk disclosures escalate to a human",
    status: { label: "v1 coaching draft", tone: "approved" },
  },
  {
    name: "Complications",
    output: "Retinopathy, neuropathy, CKD, cardiovascular, liver flags",
    gate: "Referral-triggering flags use the referral gate",
    status: { label: "v1 rules", tone: "approved" },
  },
  {
    name: "Prevention",
    output: "Risk trajectory label and personalised priorities",
    gate: "Plan promotion needs a clinician; rules composite, not a twin",
    status: { label: "v1 rules", tone: "approved" },
  },
];

/** PRD §1.3 — end-to-end product loop. */
export const PRODUCT_LOOP: { step: string; detail: string; agents: string }[] = [
  { step: "Signal in", detail: "Synthetic or pilot-consented data only", agents: "Intake" },
  { step: "Capture", detail: "Notes, voice and intake become structured context", agents: "CANVAS · VOICE" },
  { step: "Understand & draft", detail: "SOAP, coding and disease signals as drafts", agents: "SYNTHESIS · Diabetes module" },
  { step: "Detect & reason", detail: "Safety, risk, coordination and referral checks", agents: "GUARDIAN · HORIZON · NEXUS · PATHWAY" },
  { step: "Clinician decides", detail: "Accept, Edit or Reject, plus mandatory gates", agents: "Named reviewer" },
  { step: "Stage", detail: "FHIR R4 staging beside the EHR, never a live write", agents: "BRIDGE" },
  { step: "Rehearse", detail: "Simulated EHR chart (Epic, EMIS and others), never a live write", agents: "Simulated EHR" },
  { step: "Audit", detail: "Every decision hash-chained and attributable", agents: "SHIELD" },
  { step: "Learn, governed", detail: "Gated evaluation before any model change", agents: "Governed evaluation" },
];

/** PRD §4 — vision layers, top to bottom. */
export const PLATFORM_LAYERS: { name: string; detail: string }[] = [
  { name: "Continuous learning", detail: "Gated evaluation before any model change; no silent retraining" },
  { name: "Clinical · Patient · Population intelligence", detail: "GP / nurse / pharmacist review · My Health coaching · ICS and COMPASS views" },
  { name: "Research intelligence", detail: "Offline evaluation behind an ethics gate; not live discovery" },
  { name: "Disease digital twin", detail: "Rules and what-if scenarios; not a physiological simulation" },
  { name: "Disease intelligence", detail: "Diabetes first: 9 signals feed HORIZON and GUARDIAN" },
  { name: "Platform agents", detail: "12 agents · CONDUCTOR · SHIELD · BRIDGE" },
  { name: "Core", detail: "Identity · consent · FHIR interop · knowledge · observability" },
];

/** PRD §1.6 — hard non-objectives (subset shown publicly, wording kept close to Volume I). */
export const NON_OBJECTIVES: string[] = [
  "No autonomous clinical decisions",
  "No automatic prescribing or executable dose change",
  "Not an EHR replacement",
  "No live write to any EHR",
  "No silent or automatic model retraining",
  "No fake or implied certification (MHRA, DCB0129, DTAC, CIS2)",
  "No clinical output without an explanation",
  "No real patient data without an explicit governed decision",
];

/** PRD §2.3 — mandatory human gates and who may confirm them (Volume I FLOW-JRN-2). */
export const HUMAN_GATES: { gate: string; who: string }[] = [
  { gate: "Red-flag escalation", who: "Responsible physician confirms" },
  { gate: "Referral pathway", who: "Responsible physician confirms" },
  { gate: "Medication decision", who: "Pharmacist confirms, physician co-accountable" },
  { gate: "Every other draft", who: "Accept, Edit or Reject by a named clinician; nurses raise and observe" },
];
