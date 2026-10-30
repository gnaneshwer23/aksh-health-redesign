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
  | "lifestyle_support"
  | "diabetes_care_journey"
  | "patient_360_foundation"
  | "diabetes_glucose_intelligence"
  | "medication_personalised_care"
  | "continuous_care_operations"
  | "diabetes_agent_intelligence"
  | "chronic_disease_domain_framework"
  | "cardiovascular_disease_intelligence"
  | "ckd_disease_intelligence"
  | "obesity_metabolic_intelligence";

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
  {
    id: "diabetes_care_journey",
    name: "Connected diabetes care journey",
    description:
      "Synthetic end-to-end path: clinical history, glucose observations with missing-data indicators, clinician Accept/Edit/Reject on a care-plan draft, approved plan, follow-up task, and longitudinal timeline. Not for live patients; ehrWrite stays false.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: ["Patient State facts or mock cohort history", "Authenticated clinician scope"],
    evidence: ["tests/diabetes-intelligence-journey.test.ts"],
  },
  {
    id: "patient_360_foundation",
    name: "Patient 360 intelligence foundation",
    description:
      "Synthetic Patient 360 spine: structured conditions/comorbidities, family history, diabetes classification, allergies, medication reconciliation scaffolding (no prescribe), encounters, lab/vital observations with provenance/quality flags, care-team assignments, consent/sharing preferences, longitudinal timeline, FHIR-compatible bundle snapshot. Not clinically validated; ehrWrite stays false.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: ["Mock cohort or seeded spine", "Authenticated clinician scope", "Migration 044 (local-dev)"],
    evidence: ["tests/patient-intelligence-360.test.ts"],
  },
  {
    id: "diabetes_glucose_intelligence",
    name: "Diabetes glucose intelligence (Phase 2)",
    description:
      "Synthetic HbA1c trends, CGM/SMBG ingestion contracts, glucose trend charts, time-in-range when consensus data sufficiency permits, missing-data and measurement-quality indicators, GP review worklist, explainable deterministic calculations, and clinician Accept/Edit/Reject sign-off. Not clinically validated; ehrWrite stays false.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: [
      "Authenticated clinician scope",
      "Migration 045 (local-dev)",
      "Existing CGM metrics + HbA1c signal modules",
    ],
    evidence: ["tests/diabetes-glucose-intelligence.test.ts"],
  },
  {
    id: "medication_personalised_care",
    name: "Medication and personalised care (Phase 3)",
    description:
      "Synthetic medication lists + reconciliation workflow (extends Patient 360), allergy panel with clearly labeled synthetic interaction stub (not a licensed drug DB), clinician-reviewed medication safety flags, individualised care-plan templates, patient goals and educational resources, assigned tasks and care-team handoffs, and review/approval history. No autonomous prescribe/adjust; validatedCds=false; ehrWrite stays false.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: [
      "Authenticated clinician scope",
      "Patient 360 foundation",
      "Migration 046 (local-dev)",
    ],
    evidence: ["tests/medication-personalised-care.test.ts"],
  },
  {
    id: "continuous_care_operations",
    name: "Continuous care / longitudinal operations (Phase 4)",
    description:
      "Synthetic follow-up worklists (journey + medcare + nurse), appointment coordination, patient-reported updates, notification preferences, staff escalation queues with HITL Accept/Edit/Reject, completed-action tracking, care-plan progress monitoring, and derived operational/safety analytics. Every workflow carries owner, status, timestamps, decision history, and measurable outcome. No autonomous clinical actions; ehrWrite stays false; outbound recall campaigns remain planned.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: [
      "Authenticated clinician scope",
      "Diabetes care journey follow-ups",
      "Medication personalised care tasks",
      "Migration 047 (local-dev)",
    ],
    evidence: ["tests/continuous-care-operations.test.ts"],
  },
  {
    id: "diabetes_agent_intelligence",
    name: "Diabetes agent intelligence / AI orchestration (Phase 5)",
    description:
      "Governed synthetic intelligence layer over shared patient context: history summarisation, clinical documentation drafting, missing-information identification, evidence-grounded retrieval, follow-up draft generation, clinician Accept/Edit/Reject gates, structured output validation, model/prompt version tracking, and offline evaluation regression. Clear AI-generated vs clinician-verified distinction. Deterministic drafting (offline-safe); no autonomous prescribe/treatment; ehrWrite stays false; not production clinical AI.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: [
      "Authenticated clinician scope",
      "Agents register (CONDUCTOR / specialists)",
      "Patient 360 + diabetes journey modules (shared context)",
      "Migration 048 (local-dev)",
    ],
    evidence: ["tests/diabetes-agent-intelligence.test.ts"],
  },
  {
    id: "chronic_disease_domain_framework",
    name: "Chronic disease domain framework (Phase 6)",
    description:
      "Reusable disease-domain plugin registry separating common infrastructure from disease-specific guidelines, observations, risk models, care pathways and validation requirements. Diabetes/metabolic is registered as active_synthetic against the existing synthetic path; cardiovascular, CKD and obesity are planned scaffolds that return not_activated (no fabricated clinical outputs); other chronic diseases are a research placeholder registry. No new disease clinical intelligence activated; ehrWrite and autonomousClinicalAction stay false.",
    status: "synthetic_demo",
    environment: "simulation",
    dependencies: [
      "Diabetes disease-modules + diabetes-intelligence synthetic path",
      "Capability register honesty",
    ],
    evidence: ["tests/disease-domain-framework.test.ts"],
  },
  {
    id: "cardiovascular_disease_intelligence",
    name: "Cardiovascular disease intelligence",
    description:
      "Future CVD clinical intelligence. Planned scaffold only — not activated; no synthetic or live clinical outputs.",
    status: "planned",
    environment: "none",
    dependencies: ["Chronic disease domain framework", "Clinical-lead CVD spec", "CLINICAL_RELEASE"],
    evidence: [],
  },
  {
    id: "ckd_disease_intelligence",
    name: "Chronic kidney disease intelligence",
    description:
      "Future CKD clinical intelligence. Planned scaffold only — not activated; no synthetic or live clinical outputs.",
    status: "planned",
    environment: "none",
    dependencies: ["Chronic disease domain framework", "Clinical-lead CKD spec", "CLINICAL_RELEASE"],
    evidence: [],
  },
  {
    id: "obesity_metabolic_intelligence",
    name: "Obesity and related metabolic intelligence",
    description:
      "Future obesity / metabolic clinical intelligence. Planned scaffold only — not activated; no synthetic or live clinical outputs.",
    status: "planned",
    environment: "none",
    dependencies: ["Chronic disease domain framework", "Clinical-lead obesity spec", "CLINICAL_RELEASE"],
    evidence: [],
  },
];

export function capability(id: CapabilityId): Capability {
  const c = CAPABILITIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown capability ${id}`);
  return c;
}
