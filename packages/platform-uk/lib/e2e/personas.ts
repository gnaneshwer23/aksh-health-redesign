/**
 * Reusable authenticated E2E test personas (brief §58).
 */

import { E2E_DEFAULT_PASSWORD, E2E_EMAIL_DOMAIN } from "./types";

export type E2EPersona = {
  id: string;
  email: string;
  password: string;
  role: string;
  subRole?: string;
  label: string;
  cohortId?: string;
};

export const E2E_PERSONAS: E2EPersona[] = [
  {
    id: "e2e.patient.stable",
    email: `patient01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "patient",
    label: "Stable cohort patient persona",
    cohortId: "A",
  },
  {
    id: "e2e.patient.highrisk",
    email: `patient02@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "patient",
    label: "High-risk cohort persona",
    cohortId: "C",
  },
  {
    id: "e2e.gp",
    email: `gp01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "gp",
    subRole: "gp",
    label: "General practitioner",
  },
  {
    id: "e2e.endocrinologist",
    email: `endo01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "gp",
    subRole: "endocrinologist",
    label: "Endocrinologist (gp role + specialty metadata)",
  },
  {
    id: "e2e.nurse",
    email: `nurse01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "nurse",
    subRole: "practice_nurse",
    label: "Practice nurse",
  },
  {
    id: "e2e.carecoordinator",
    email: `cco01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "nurse",
    subRole: "care_coordinator",
    label: "Care coordinator",
  },
  {
    id: "e2e.lab",
    email: `lab01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "practice-manager",
    subRole: "lab_operator",
    label: "Lab operator (admin role — simulated lab workflow)",
  },
  {
    id: "e2e.pharmacy",
    email: `pharm01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "clinical-pharmacist",
    subRole: "pharmacist",
    label: "Clinical pharmacist",
  },
  {
    id: "e2e.safetyofficer",
    email: `cso01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "practice-manager",
    subRole: "clinical_safety_officer",
    label: "Clinical safety officer",
  },
  {
    id: "e2e.admin",
    email: `admin01@${E2E_EMAIL_DOMAIN}`,
    password: E2E_DEFAULT_PASSWORD,
    role: "practice-manager",
    subRole: "organisation_admin",
    label: "Organisation admin",
  },
];

export function getPersonaById(id: string): E2EPersona | undefined {
  return E2E_PERSONAS.find((p) => p.id === id);
}
