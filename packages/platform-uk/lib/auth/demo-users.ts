import type { UserRole } from "@/lib/onboarding/roles";

export type DemoUserSeed = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  onboardingComplete: boolean;
};

/** All demo accounts use password `demo123` unless AKSH_DEMO_PASSWORD is set. */
export const DEMO_USER_SEEDS: DemoUserSeed[] = [
  {
    id: "user-001",
    email: "doctor@akshhealth.com",
    name: "Dr. Clinical User",
    role: "gp",
    onboardingComplete: true,
  },
  {
    id: "user-gp",
    email: "gp@demo.akshhealth.com",
    name: "Dr. Morgan (GP)",
    role: "gp",
    onboardingComplete: true,
  },
  {
    id: "user-nurse",
    email: "nurse@demo.akshhealth.com",
    name: "Nurse Davies",
    role: "nurse",
    onboardingComplete: true,
  },
  {
    id: "user-pharmacist",
    email: "pharmacist@demo.akshhealth.com",
    name: "Pharmacist Lee",
    role: "clinical-pharmacist",
    onboardingComplete: true,
  },
  {
    id: "user-admin",
    email: "admin@demo.akshhealth.com",
    name: "Admin Singh",
    role: "practice-manager",
    onboardingComplete: true,
  },
  {
    id: "user-ics",
    email: "ics@demo.akshhealth.com",
    name: "ICS Lead Patel",
    role: "ics-lead",
    onboardingComplete: true,
  },
  {
    id: "user-hospital",
    email: "hospital@demo.akshhealth.com",
    name: "Hospital Exec Chen",
    role: "hospital-executive",
    onboardingComplete: true,
  },
  {
    id: "user-patient",
    email: "patient@demo.akshhealth.com",
    name: "James Wilson",
    role: "patient",
    onboardingComplete: true,
  },
  {
    id: "user-researcher",
    email: "researcher@demo.akshhealth.com",
    name: "Dr. Research Analyst",
    role: "researcher",
    onboardingComplete: true,
  },
  {
    id: "user-002",
    email: "reviewer@akshhealth.com",
    name: "Dr. Reviewer",
    role: "practice-manager",
    onboardingComplete: true,
  },
  {
    id: "user-003",
    email: "smoke@akshhealth.com",
    name: "Smoke Loop Reviewer",
    role: "gp",
    onboardingComplete: true,
  },
  {
    id: "user-onboarding",
    email: "onboarding@demo.akshhealth.com",
    name: "Onboarding Test User",
    role: "gp",
    onboardingComplete: false,
  },
];

export const DEMO_PASSWORD = "demo123";
