/**
 * Connected Diabetes Intelligence — canonical patient journey steps for chrome / demo.
 * Synthetic demo only; LIVE_ORGANISATIONS remains 0.
 */

export type ConnectedJourneyStepId =
  | "orchestrate"
  | "patient-360"
  | "glucose"
  | "medication"
  | "journey"
  | "continuous"
  | "agent"
  | "timeline";

export type ConnectedJourneyStep = {
  id: ConnectedJourneyStepId;
  phase: string;
  label: string;
  shortLabel: string;
  href: (patientId: string) => string;
};

export const CONNECTED_JOURNEY_DISCLOSURE =
  "Synthetic demo · Not clinically validated · No EHR write · No autonomous prescribing · LIVE organisations: 0";

export const CONNECTED_DEMO_PATIENT_ID = "P002";

export const CONNECTED_JOURNEY_STEPS: ConnectedJourneyStep[] = [
  {
    id: "orchestrate",
    phase: "★",
    label: "Connected pipeline",
    shortLabel: "Pipeline",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/connected-diabetes`,
  },
  {
    id: "patient-360",
    phase: "1",
    label: "Patient 360",
    shortLabel: "360",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/patient-360`,
  },
  {
    id: "glucose",
    phase: "2",
    label: "Glucose intelligence",
    shortLabel: "Glucose",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/diabetes-intelligence`,
  },
  {
    id: "medication",
    phase: "3",
    label: "Medication & care",
    shortLabel: "Meds",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/medication-care`,
  },
  {
    id: "journey",
    phase: "0",
    label: "Care journey HITL",
    shortLabel: "Journey",
    href: (id) => `/dashboard/gp/diabetes-journey/${encodeURIComponent(id)}`,
  },
  {
    id: "continuous",
    phase: "4",
    label: "Continuous care",
    shortLabel: "Follow-up",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/continuous-care`,
  },
  {
    id: "agent",
    phase: "5",
    label: "Agent intelligence",
    shortLabel: "Agent",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/agent-intelligence`,
  },
  {
    id: "timeline",
    phase: "—",
    label: "Longitudinal timeline",
    shortLabel: "Timeline",
    href: (id) => `/dashboard/gp/patients/${encodeURIComponent(id)}/timeline`,
  },
];

export function connectedJourneyStep(
  id: ConnectedJourneyStepId
): ConnectedJourneyStep {
  const step = CONNECTED_JOURNEY_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown connected journey step ${id}`);
  return step;
}
