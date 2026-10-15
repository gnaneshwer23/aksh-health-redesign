/**
 * Public-site content. Buyer-facing only: what Aksh does for a clinic, in plain words, and whether each capability is
 * available now or still in development. Engineering status, component codenames, planned modules and internal process
 * names belong in internal documents (docs/AKSH_PHASE1_AUDIT_*.md, the platform map), never here.
 * When something reaches production for clinics, move it from "development" to "available".
 */
export type Availability = "available" | "development";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Available now",
  development: "In development",
};

/** End to end: the same order for every workflow; the clinician decision sits in the middle. */
export const PRODUCT_LOOP: { step: string; detail: string }[] = [
  { step: "Data in", detail: "Schedules, readings, CGM data, lab results and what patients share" },
  { step: "Organise", detail: "Matched to the right patient, checked, and gaps flagged" },
  { step: "Prepare", detail: "Worklists, ranked options and drafts, each with its reasons" },
  { step: "Check", detail: "Safety rules applied before anything reaches a person" },
  { step: "Clinician decides", detail: "Accept, edit or reject; some decisions need a named role" },
  { step: "Act", detail: "Your staff act through the systems and channels you already use" },
  { step: "Record", detail: "Every decision kept with who made it and when" },
  { step: "Review", detail: "Weekly results against a baseline set before go-live" },
];

/** Aksh Diabetes: what a care team gets, now and next. */
export const DIABETES_AREAS: { name: string; output: string; safeguard: string; availability: Availability }[] = [
  { name: "Glucose and CGM", output: "Time in range, low and high glucose, variability and daily patterns, as a worklist", safeguard: "Low glucose first; the clinician decides the response", availability: "available" },
  { name: "Readings from patients", output: "Glucose, blood pressure and weight shared from the patient app", safeguard: "Marked as patient-reported until a clinician checks them", availability: "available" },
  { name: "HbA1c", output: "Latest value and trend over time", safeguard: "Clinician review before any change to the care plan", availability: "development" },
  { name: "Medication safety", output: "Interaction, allergy and low-glucose risk flags for insulin and other medicines", safeguard: "Explains; never sets or changes a dose", availability: "development" },
  { name: "Complications", output: "Kidney, eye, foot, heart and liver checks that are due or overdue", safeguard: "Referrals need a clinician's confirmation", availability: "development" },
  { name: "Lifestyle support", output: "Nutrition, activity and habit talking points for consultations", safeguard: "Concerns raised by patients go to a person", availability: "development" },
];

/** Decisions that always need a named person, and who confirms them. */
export const HUMAN_GATES: { gate: string; who: string }[] = [
  { gate: "Urgent concerns", who: "Responsible clinician confirms" },
  { gate: "Referrals", who: "Responsible clinician confirms" },
  { gate: "Medication decisions", who: "Prescriber confirms" },
  { gate: "Every other draft", who: "Accepted, edited or rejected by a named clinician" },
];

/** What Aksh will not do. */
export const NON_OBJECTIVES: string[] = [
  "No clinical decision without a clinician",
  "No automatic prescribing or dose changes",
  "Not a replacement for your records system",
  "Nothing written to your records without approval",
  "No silent changes to how Aksh works",
  "No claims of certification we do not hold",
  "No output without its reasons",
  "No patient data sent to AI models in production",
];

/** The two products, each with what is available now and what is coming. */
export const PILLARS: { key: "access" | "clinical"; title: string; subtitle: string; items: { name: string; detail: string; availability: Availability }[] }[] = [
  {
    key: "access",
    title: "Patient access",
    subtitle: "Fill freed appointments from your waiting list, with staff in charge",
    items: [
      { name: "Cancelled-slot fill", detail: "Freed slots matched to the waiting list, with reasons; staff make the contact; every booking checked against your schedule", availability: "available" },
      { name: "Hand-offs", detail: "Anything that needs a person goes to a named queue with a due time", availability: "available" },
      { name: "Weekly results", detail: "Fill rate, staff time and issues against your own baseline", availability: "available" },
      { name: "Patient requests", detail: "Routine questions and scheduling requests, passed to staff when needed", availability: "development" },
    ],
  },
  {
    key: "clinical",
    title: "Clinical review",
    subtitle: "Worklists and drafts for clinicians to accept, edit or reject",
    items: [
      { name: "Glucose monitoring", detail: "CGM and shared readings as one worklist, low glucose first", availability: "available" },
      { name: "One review queue", detail: "Every draft in one place, with its evidence and the decision recorded", availability: "development" },
      { name: "Notes and coding drafts", detail: "Structured notes from consultations, ready for review", availability: "development" },
      { name: "Medication safety and referrals", detail: "Interaction checks, risk changes and referral drafts", availability: "development" },
    ],
  },
];

/** Shared by both products. Only what is in place today. */
export const FOUNDATIONS: { name: string; detail: string }[] = [
  { name: "Sign-in and access", detail: "Roles, two-step sign-in, each clinic sees only its own patients" },
  { name: "Connections", detail: "Reads schedules and device data from your systems" },
  { name: "Consent", detail: "Patients choose what they share, and with whom" },
  { name: "Audit", detail: "A record of every action that cannot be edited" },
  { name: "Monitoring", detail: "Alerts and uptime checks around the clock" },
];

/** What Aksh is built to improve, measured against each clinic's own baseline. */
export const OUTCOMES: { name: string; detail: string }[] = [
  { name: "Fewer empty slots", detail: "Freed appointments filled from the waiting list" },
  { name: "Less staff time", detail: "Minutes per filled slot, measured" },
  { name: "Earlier attention", detail: "Low glucose seen first" },
  { name: "Safer medicines", detail: "Checks before a clinician reviews" },
  { name: "No lost hand-offs", detail: "Every hand-off has an owner and a due time" },
  { name: "Results you can check", detail: "Against a baseline locked before go-live" },
];
