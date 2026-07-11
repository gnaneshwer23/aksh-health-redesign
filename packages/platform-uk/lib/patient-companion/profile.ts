import type { Session } from "next-auth";

import type { IdentityData } from "@/lib/onboarding/validation";

export type PatientCompanionProfile = {
  firstName: string;
  displayName: string;
  conditions: { title: string; status: string; summary: string }[];
  medications: { label: string; schedule: string; purpose: string }[];
  careTeam: { role: string; name: string }[];
  upcomingAppointment: string;
  pastAppointmentSummary: string;
  nurseReviewer: string;
};

function formatAppointmentDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function readIdentityString(identity: IdentityData | undefined, key: string) {
  const value = identity?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getPatientFirstName(
  session: Session | null,
  identity?: IdentityData,
  profileFullName?: string | null
): string {
  const onboardingFirst = readIdentityString(identity, "firstName");
  if (onboardingFirst) return onboardingFirst;

  const profileName = profileFullName?.trim();
  if (profileName) {
    const parts = profileName.split(/\s+/);
    const honorifics = new Set(["mr", "mrs", "ms", "miss", "dr", "prof"]);
    if (parts.length > 1 && honorifics.has(parts[0].toLowerCase().replace(/\./g, ""))) {
      return parts[1];
    }
    return parts[0];
  }

  const sessionName = session?.user?.name?.trim();
  if (sessionName) {
    const parts = sessionName.split(/\s+/);
    const honorifics = new Set(["mr", "mrs", "ms", "miss", "dr", "prof"]);
    if (parts.length > 1 && honorifics.has(parts[0].toLowerCase().replace(/\./g, ""))) {
      return parts[1];
    }
    return parts[0];
  }

  return "there";
}

export function getPatientGreeting(
  session: Session | null,
  identity?: IdentityData,
  profileFullName?: string | null
) {
  const firstName = getPatientFirstName(session, identity, profileFullName);
  return `${getTimeGreeting()}, ${firstName}.`;
}

export function getPatientCompanionProfile(
  session: Session | null,
  identity?: IdentityData,
  profileFullName?: string | null
): PatientCompanionProfile {
  const firstName = getPatientFirstName(session, identity, profileFullName);
  const sessionName = session?.user?.name?.trim();
  const profileName = profileFullName?.trim();
  const onboardingFirst = readIdentityString(identity, "firstName");
  const onboardingLast = readIdentityString(identity, "lastName");
  const displayName =
    onboardingFirst && onboardingLast
      ? `${onboardingFirst} ${onboardingLast}`
      : profileName ?? sessionName ?? firstName;

  const medications = [
    { label: "Metformin 500mg", schedule: "twice daily", purpose: "For diabetes" },
    { label: "Aspirin 75mg", schedule: "once daily", purpose: "For heart health" },
  ];

  const conditions = [
    {
      title: "Type 2 Diabetes",
      status: "Monitor",
      summary:
        "Your HbA1c review is due. Your GP is reviewing your medications following your recent DVT diagnosis.",
    },
  ];

  const appointmentDate = "2026-07-24";
  const appointmentTime = "09:30";

  return {
    firstName,
    displayName,
    conditions,
    medications,
    careTeam: [
      { role: "GP", name: "Dr Morgan" },
      { role: "Nurse", name: "Nurse Davies" },
      { role: "Pharmacist", name: "Pharmacist Lee" },
    ],
    upcomingAppointment: `${formatAppointmentDate(appointmentDate)}, ${appointmentTime} | GP review (Riverside Medical Centre)`,
    pastAppointmentSummary:
      "Your last GP appointment summary: Dr Morgan reviewed your diabetes medications and suspected a blood clot in your leg. You were referred for a scan.",
    nurseReviewer: "Nurse Davies",
  };
}
