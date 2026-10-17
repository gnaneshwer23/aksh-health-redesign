/**
 * Public-site content. Buyer-facing only: what Aksh does for a clinic, in plain words, and whether each capability is
 * available now or still in development. Engineering status, component codenames, planned modules and internal process
 * names belong in internal documents (docs/AKSH_PHASE1_AUDIT_*.md, the platform map), never here.
 * When something reaches production for clinics, move it from "development" to "available".
 */
import { capability, STATUS_LABEL, type CapabilityId, type CapabilityStatus } from "@/lib/status/capabilities";

export type { CapabilityStatus };
export { STATUS_LABEL };

/** One item on the site, with name, description and status from the capability register (lib/status/capabilities.ts). */
export type SiteItem = { id: CapabilityId; name: string; detail: string; status: CapabilityStatus };
const item = (id: CapabilityId, detail?: string): SiteItem => {
  const c = capability(id);
  return { id, name: c.name, detail: detail ?? c.description, status: c.status };
};
const ORDER: Record<CapabilityStatus, number> = { production: 0, synthetic_demo: 1, in_validation: 2, planned: 3 };
const byStatus = <T extends SiteItem>(items: T[]): T[] => [...items].sort((x, y) => ORDER[x.status] - ORDER[y.status]);

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

/** Aksh Diabetes: what a care team gets, with each capability's status and its safeguard. */
export const DIABETES_AREAS = byStatus<SiteItem & { safeguard: string }>([
  { ...item("cgm_monitoring", "Time in range, low and high glucose, variability and daily patterns, as a worklist"), safeguard: "Low glucose first; the clinician decides the response" },
  { ...item("patient_readings", "Glucose, blood pressure and weight shared from the patient app"), safeguard: "Marked as patient-reported until a clinician checks them" },
  { ...item("hba1c_trends"), safeguard: "Clinician review before any change to the care plan" },
  { ...item("medication_safety_referrals", "Interaction, allergy and low-glucose risk flags for insulin and other medicines"), safeguard: "Explains; never sets or changes a dose" },
  { ...item("complications", "Kidney, eye, foot, heart and liver checks that are due or overdue"), safeguard: "Referrals need a clinician's confirmation" },
  { ...item("lifestyle_support", "Nutrition, activity and habit talking points for consultations"), safeguard: "Concerns raised by patients go to a person" },
]);

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

/** The two products, each listing its capabilities with their status. */
export const PILLARS: { key: "access" | "clinical"; title: string; subtitle: string; items: SiteItem[] }[] = [
  {
    key: "access",
    title: "Patient access",
    subtitle: "Fill freed appointments from your waiting list, with staff in charge",
    items: byStatus([item("slot_fill"), item("handoffs"), item("weekly_results"), item("patient_requests"), item("outbound_campaigns")]),
  },
  {
    key: "clinical",
    title: "Clinical review",
    subtitle: "Worklists and drafts for clinicians to accept, edit or reject",
    items: byStatus([item("cgm_monitoring", "CGM and shared readings as one worklist, low glucose first"), item("review_queue"), item("notes_coding"), item("medication_safety_referrals")]),
  },
];

/** Shared by both products. */
export const FOUNDATIONS: SiteItem[] = [
  item("identity_access"),
  item("schedule_connector", "Reads schedules and device data from your systems"),
  item("consent"),
  item("audit"),
  item("monitoring_ops"),
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
