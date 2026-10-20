/**
 * The one authoritative register of what Aksh can do and how far each capability has got. The public site, the
 * documentation and internal reviews all read from here; nothing else declares a status.
 *
 * Statuses:
 * - production: deployed and verified in the production deployment (www.akshhealth.com), with passing tests. Being in
 *   production does not mean an organisation is using it yet; see LIVE_ORGANISATIONS.
 * - synthetic_demo: works end to end, but only on synthetic data, in the simulation environment.
 * - in_validation: implemented, but has not met its release criteria (clinical safety case, evaluation thresholds,
 *   approved go-live). Switched off in production.
 * - planned: not implemented.
 *
 * A capability may be marked production only with evidence: the tests that verify it (tests/capability-status.test.ts
 * fails otherwise). An interface existing is not evidence.
 */
export type CapabilityStatus = "production" | "synthetic_demo" | "in_validation" | "planned";

export const STATUS_LABEL: Record<CapabilityStatus, string> = {
  production: "Production",
  synthetic_demo: "Synthetic demo",
  in_validation: "In validation",
  planned: "Planned",
};

export const STATUS_MEANING: Record<CapabilityStatus, string> = {
  production: "Deployed and verified in production",
  synthetic_demo: "Works on synthetic data only",
  in_validation: "Built; not yet released for real patients",
  planned: "Not built yet",
};

/** Organisations live in production today. Kept here so no page implies clinical use that is not happening. */
export const LIVE_ORGANISATIONS = 0;

export type CapabilityId =
  | "slot_fill"
  | "handoffs"
  | "weekly_results"
  | "schedule_connector"
  | "cgm_monitoring"
  | "patient_readings"
  | "lab_results"
  | "identity_access"
  | "audit"
  | "consent"
  | "monitoring_ops"
  | "patient_requests"
  | "outbound_campaigns"
  | "review_queue"
  | "notes_coding"
  | "medication_safety_referrals"
  | "hba1c_trends"
  | "complications"
  | "lifestyle_support";

export type Capability = {
  id: CapabilityId;
  name: string;
  description: string;
  status: CapabilityStatus;
  environment: "production" | "simulation" | "none";
  dependencies: string[];
  /** Test files (relative to the package) that verify the status. Required for production and synthetic_demo. */
  evidence: string[];
  /** For in_validation: what must be true before release. */
  releaseCriteria?: string[];
};

const CLINICAL_RELEASE = [
  "Clinical safety case and hazard log signed by a clinical safety officer",
  "Evaluation thresholds met on synthetic cases and recorded",
  "Data protection impact assessment and regulatory opinion",
  "Approved go-live for the organisation",
];

export const CAPABILITIES: Capability[] = [
  {
    id: "slot_fill",
    name: "Cancelled-slot fill",
    description: "Freed slots matched to the waiting list with reasons; staff choose and contact; the slot counts only when the schedule confirms the booking.",
    status: "production",
    environment: "production",
    dependencies: ["Patient list", "Waiting list", "Freed slots recorded by staff or sent by the schedule connector"],
    evidence: ["tests/access-workflow-db.test.ts", "tests/patient-access-negative-db.test.ts", "e2e/slot-fill.spec.ts"],
  },
  {
    id: "handoffs",
    name: "Hand-offs",
    description: "Anything that needs a person goes to a named queue with a reason and a due time.",
    status: "production",
    environment: "production",
    dependencies: ["Cancelled-slot fill"],
    evidence: ["tests/patient-access-negative-db.test.ts", "tests/real-workspace.test.ts"],
  },
  {
    id: "weekly_results",
    name: "Weekly results",
    description: "Fill rate, staff time and issues each week, against a baseline locked before go-live, with sign-off.",
    status: "production",
    environment: "production",
    dependencies: ["Locked baseline"],
    evidence: ["tests/weekly-review.test.ts", "tests/prd-v11-pilot-db.test.ts"],
  },
  {
    id: "schedule_connector",
    name: "Schedule connector",
    description: "Reads freed slots and bookings from a scheduling system (FHIR R4 Slot and Appointment, or JSON). Read only.",
    status: "production",
    environment: "production",
    dependencies: ["Per-organisation connector key"],
    evidence: ["tests/connector-db.test.ts", "e2e/schedule-connector.spec.ts"],
  },
  {
    id: "cgm_monitoring",
    name: "Glucose and CGM monitoring",
    description: "Time in range, low and high glucose, variability and daily pattern from trusted CGM data, as a worklist with low glucose first.",
    status: "production",
    environment: "production",
    dependencies: ["CGM uploads or a device feed"],
    evidence: ["tests/cgm.test.ts", "tests/monitoring-db.test.ts", "e2e/cgm.spec.ts", "e2e/cgm-monitoring.spec.ts"],
  },
  {
    id: "patient_readings",
    name: "Readings from patients",
    description: "Glucose, blood pressure and weight shared from the patient app; marked patient-reported until a clinician checks them.",
    status: "production",
    environment: "production",
    dependencies: ["Patient linked with an invite code"],
    evidence: ["tests/readings-db.test.ts", "e2e/patient-readings.spec.ts"],
  },
  {
    id: "lab_results",
    name: "Laboratory results",
    description: "HbA1c, kidney function, lipids and liver results from your lab system or entered by staff, converted to one set of units, range-checked, with the source and any correction kept.",
    status: "production",
    environment: "production",
    dependencies: ["Laboratory feed through the connector (FHIR R4 Observation with LOINC), or staff entry"],
    evidence: ["tests/lab-results-db.test.ts"],
  },
  {
    id: "identity_access",
    name: "Sign-in and access",
    description: "Roles, two-step sign-in, and isolation so each organisation sees only its own patients.",
    status: "production",
    environment: "production",
    dependencies: [],
    evidence: ["tests/mfa.test.ts", "tests/care-network-db.test.ts", "e2e/mfa.spec.ts"],
  },
  {
    id: "audit",
    name: "Audit",
    description: "A record of every action, with who and when, that the database will not let anyone edit or delete.",
    status: "production",
    environment: "production",
    dependencies: [],
    evidence: ["tests/patient-access-negative-db.test.ts", "tests/weekly-review.test.ts"],
  },
  {
    id: "consent",
    name: "Consent and sharing",
    description: "Patients choose what they share and with whom; sharing across organisations needs recorded consent.",
    status: "production",
    environment: "production",
    dependencies: [],
    evidence: ["tests/care-network-db.test.ts", "tests/readings-db.test.ts"],
  },
  {
    id: "monitoring_ops",
    name: "Service monitoring",
    description: "Error alerts to the operations team, an external uptime check, and daily retention jobs.",
    status: "production",
    environment: "production",
    dependencies: [],
    evidence: ["tests/error-monitoring.test.ts", "tests/readiness-db.test.ts"],
  },
  {
    id: "patient_requests",
    name: "Patient requests",
    description: "Routine questions and scheduling requests handled by an assistant, passed to staff when needed.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: ["Approved contact channel", "Clinical safety review of scripts"],
    evidence: ["tests/front-desk.test.ts", "e2e/front-desk.spec.ts"],
  },
  {
    id: "outbound_campaigns",
    name: "Recall and missed-appointment outreach",
    description: "Outreach to patients who missed or are overdue for appointments, using approved wording.",
    status: "planned",
    environment: "none",
    dependencies: ["Approved contact channel"],
    evidence: [],
  },
  {
    id: "review_queue",
    name: "Clinical review queue",
    description: "Every draft in one queue; a clinician accepts, edits or rejects it on the server, with the decision and audit record saved together.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Clinical drafts"],
    evidence: ["tests/review-decision-db.test.ts", "e2e/platform-golden-hitl.spec.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
  {
    id: "notes_coding",
    name: "Notes and coding drafts",
    description: "Structured consultation notes and coding drafts for clinician review.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Clinical review queue"],
    evidence: ["tests/clinical-proof-orchestration.test.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
  {
    id: "medication_safety_referrals",
    name: "Medication safety and referrals",
    description: "Interaction and allergy checks, risk changes and referral drafts, each held for a clinician.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Clinical review queue", "Medication list from the record"],
    evidence: ["tests/clinical-proof-orchestration.test.ts", "tests/clinical-spine-diabetes.test.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
  {
    id: "hba1c_trends",
    name: "HbA1c trends",
    description: "Latest value and trend over time, in the organisation's units.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Verified HbA1c results"],
    evidence: ["tests/patient-spine-db.test.ts", "tests/clinical-spine-diabetes.test.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
  {
    id: "complications",
    name: "Complication checks",
    description: "Kidney, eye, foot, heart and liver checks that are due or overdue; referrals need a clinician's confirmation.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Clinical review queue"],
    evidence: ["tests/clinical-spine-diabetes.test.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
  {
    id: "lifestyle_support",
    name: "Lifestyle support",
    description: "Nutrition, activity and habit talking points for consultations; concerns raised by patients go to a person.",
    status: "in_validation",
    environment: "simulation",
    dependencies: ["Clinical review queue"],
    evidence: ["tests/clinical-spine-diabetes.test.ts"],
    releaseCriteria: CLINICAL_RELEASE,
  },
];

export function capability(id: CapabilityId): Capability {
  const c = CAPABILITIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown capability ${id}`);
  return c;
}
