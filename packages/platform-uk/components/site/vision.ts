/**
 * The Aksh vision for the public site, from docs/AKSH_VISION_PRD_OVERVIEW.md. Status labels are honest about where
 * each capability is: in production with organisations, built and validated on synthetic data only, or planned.
 * Keep them in step with the product: when something reaches production, change its status here.
 */
export type Status = "production" | "synthetic" | "partial" | "planned";

export const STATUS_LABEL: Record<Status, string> = {
  production: "In production",
  synthetic: "Built · synthetic validation",
  partial: "Partial",
  planned: "Planned",
};

/** PRD §4: the platform, top to bottom. */
export const PLATFORM_LAYERS: { name: string; detail: string }[] = [
  { name: "Continuous learning", detail: "Gated evaluation before any model change; no silent retraining" },
  { name: "Clinical · patient · population intelligence", detail: "Clinician review, patient coaching and population views read the same signal" },
  { name: "Research intelligence", detail: "Offline evaluation behind an ethics gate" },
  { name: "Disease digital twin", detail: "Rules and what-if scenarios; not a physiological simulation" },
  { name: "Disease intelligence", detail: "Diabetes first: nine signals feed risk and medication safety" },
  { name: "Platform agents", detail: "Twelve agents under one supervisor, one audit trail" },
  { name: "Core", detail: "Identity · consent · FHIR R4 interoperability · knowledge · observability" },
];

/** PRD §1.3: the end-to-end loop. */
export const PRODUCT_LOOP: { step: string; detail: string }[] = [
  { step: "Data in", detail: "Notes, labs, medicines, devices and what patients report" },
  { step: "Capture", detail: "Notes, voice and intake become structured context" },
  { step: "Understand and draft", detail: "Documentation, coding and disease signals as drafts" },
  { step: "Check", detail: "Medication safety, risk change and referral checks" },
  { step: "Clinician decides", detail: "Accept, edit or reject, plus mandatory gates" },
  { step: "Stage", detail: "Prepared in FHIR R4 beside the EHR; nothing written without approval" },
  { step: "Record", detail: "Every draft and decision kept with who and when" },
  { step: "Improve", detail: "Any model change is evaluated and approved first" },
];

/** The twelve platform agents (lib/agents.ts AGENT_DIRECTORY). Human label first, codename second. */
export const PLATFORM_AGENTS: { label: string; codename: string; role: string; status: Status }[] = [
  { label: "Clinical intake", codename: "CANVAS", role: "Structured capture from notes, forms, voice and intake", status: "synthetic" },
  { label: "Clinical documentation", codename: "SYNTHESIS", role: "Structured notes and coding drafts", status: "synthetic" },
  { label: "Medication safety", codename: "GUARDIAN", role: "Interaction and allergy flags held for review", status: "synthetic" },
  { label: "Risk change", codename: "HORIZON", role: "Shows how a patient's risk has changed and why", status: "synthetic" },
  { label: "Results and medicines", codename: "NEXUS", role: "Links lab results, medicines and readings for the reviewer", status: "synthetic" },
  { label: "Care coordination", codename: "PATHWAY", role: "Referral, pathway and follow-up packages for sign-off", status: "synthetic" },
  { label: "Population health", codename: "COMPASS", role: "Registers, care gaps and equity views", status: "partial" },
  { label: "Interoperability", codename: "BRIDGE", role: "FHIR R4 connections for schedules, bookings and devices", status: "production" },
  { label: "Audit trail", codename: "SHIELD", role: "A record of every draft and decision that cannot be edited", status: "production" },
  { label: "Supervisor", codename: "CONDUCTOR", role: "Runs the components in a fixed order that can be inspected", status: "synthetic" },
  { label: "Imaging", codename: "PRISM", role: "Support for reviewing images", status: "planned" },
  { label: "Clinical research", codename: "ATLAS", role: "Research and trial support", status: "planned" },
];

/** First module: Aksh Diabetes. Nine intelligence areas, each a signal into one review queue. */
export const DIABETES_AREAS: { name: string; output: string; gate: string; status: Status }[] = [
  { name: "Glucose", output: "Time in range, variability, AGP and pattern flags from CGM", gate: "A worklist for clinicians; no automatic action", status: "production" },
  { name: "HbA1c", output: "Latest value, trend and a labelled non-diagnostic estimate", gate: "Clinician review before any care-plan change", status: "synthetic" },
  { name: "Insulin", output: "Regimen summary, timing observations, hypoglycaemia-risk flag", gate: "Hard medication-safety gate; never an executable dose", status: "synthetic" },
  { name: "GLP-1", output: "Suitability talking point, response trend, side-effect flags", gate: "Clinician review before any initiation or change", status: "synthetic" },
  { name: "Nutrition", output: "Diabetes-specific coaching draft, not clinical advice", gate: "Escalation hints route to a clinician", status: "synthetic" },
  { name: "Exercise", output: "Resistance and cardio talking points", gate: "Same coaching gate as nutrition", status: "synthetic" },
  { name: "Behaviour", output: "Habit and adherence talking points", gate: "Distress or risk disclosures escalate to a person", status: "synthetic" },
  { name: "Complications", output: "Retinopathy, neuropathy, kidney, cardiovascular and liver flags", gate: "Referral-triggering flags use the referral gate", status: "synthetic" },
  { name: "Prevention", output: "Risk trend and the next priorities for the care plan", gate: "Plan changes need a clinician", status: "synthetic" },
];

/** PRD §2.3: mandatory human gates and who confirms them. */
export const HUMAN_GATES: { gate: string; who: string }[] = [
  { gate: "Red-flag escalation", who: "Responsible physician confirms" },
  { gate: "Referral pathway", who: "Responsible physician confirms" },
  { gate: "Medication decision", who: "Pharmacist confirms, physician co-accountable" },
  { gate: "Every other draft", who: "Accept, edit or reject by a named clinician" },
];

/** PRD §1.6: hard limits. */
export const NON_OBJECTIVES: string[] = [
  "No autonomous clinical decisions",
  "No automatic prescribing or executable dose change",
  "Not an EHR replacement",
  "No unsanctioned write to any EHR",
  "No silent or automatic model retraining",
  "No fake or implied certification or regulatory approval",
  "No clinical output without an explanation",
  "No real patient data without an explicit, approved decision",
];

/** Commercial Execution PRD v1.1: two pillars on shared foundations. */
export const PILLARS: { key: "access" | "clinical"; title: string; subtitle: string; items: { name: string; detail: string; status: Status }[] }[] = [
  {
    key: "access",
    title: "Patient access",
    subtitle: "Filling freed appointments and handling requests, with staff in charge",
    items: [
      { name: "Cancellation-slot fill", detail: "Freed slots matched to the waiting list; staff contact; booking verified on read-back", status: "production" },
      { name: "Staff hand-off", detail: "Named queue, reason, due time; nothing disappears silently", status: "production" },
      { name: "Outbound campaigns", detail: "Missed, lapsed and recall outreach under approved templates", status: "planned" },
      { name: "Patient requests", detail: "Routine questions and scheduling requests, handed to staff when needed", status: "synthetic" },
    ],
  },
  {
    key: "clinical",
    title: "Clinical review",
    subtitle: "Worklists and drafts for clinicians to accept, edit or reject",
    items: [
      { name: "CGM and readings monitoring", detail: "Consensus metrics as a clinician worklist", status: "production" },
      { name: "Notes and coding", detail: "Structured notes and coding drafts from consultations", status: "synthetic" },
      { name: "Safety, risk and referrals", detail: "Medication safety, risk change and referral drafts", status: "synthetic" },
      { name: "Review queue", detail: "One queue to accept, edit or reject every draft", status: "synthetic" },
    ],
  },
];

export const FOUNDATIONS: { name: string; detail: string; status: Status }[] = [
  { name: "Identity and access", detail: "Roles, two-step sign-in, organisation isolation", status: "production" },
  { name: "Data and integration", detail: "FHIR R4 connections, read only", status: "production" },
  { name: "Clinical knowledge", detail: "Guidelines and terminology, with sources", status: "synthetic" },
  { name: "Monitoring and audit", detail: "Alerts, uptime checks, uneditable history", status: "production" },
  { name: "Model changes", detail: "Evaluated and approved before use", status: "synthetic" },
];

/** What the platform is for. Aims, measured against a locked baseline before any claim is made. */
export const OUTCOMES: { name: string; detail: string }[] = [
  { name: "Fewer empty slots", detail: "Freed appointments filled from the waiting list" },
  { name: "Less staff time", detail: "Minutes per filled slot, measured" },
  { name: "Earlier attention", detail: "Low glucose seen first" },
  { name: "Safer medicines", detail: "Interaction and allergy checks before review" },
  { name: "No lost hand-offs", detail: "Every hand-off has an owner and a due time" },
  { name: "Results you can check", detail: "Against a baseline locked before go-live" },
];
