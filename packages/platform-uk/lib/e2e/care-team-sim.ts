/**
 * Care-team simulation (Stage 9) — resolve membership and route stakeholder follow-ups.
 * Uses synthetic E2E users/patients only — no live directory sync.
 */

import type { E2EPatientProfile, E2EUserSpec, E2EUserSubRole } from "./types";
import type { PharmacyCoordinationTask } from "./pharmacy-sim";

export const CARE_TEAM_SIM_HONESTY = {
  liveDirectory: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Synthetic care-team routing only — no live NHS directory / Spine PDS.",
} as const;

export type CareTeamMember = {
  userId: string;
  email: string;
  role: string;
  subRole: E2EUserSubRole | null;
  label: string;
};

export type CareTeamSnapshot = {
  patientId: string;
  primaryDoctorId: string;
  members: CareTeamMember[];
  coordinatorIds: string[];
  nurseIds: string[];
  pharmacistIds: string[];
  liveDirectory: false;
  liveEmis: false;
  ehrWrite: false;
  note: string;
};

export type CareTeamFollowUp = {
  id: string;
  patientId: string;
  source: "pharmacy" | "lab" | "clinical";
  sourceEventId: string;
  assignedToUserId: string | null;
  assignedRole: "care_coordinator" | "gp" | "nurse" | "pharmacist";
  summary: string;
  status: "queued" | "in_progress" | "done";
  createdAt: string;
  hitlRequired: true;
  ehrWrite: false;
};

export function resolveCareTeam(
  patient: E2EPatientProfile,
  users: E2EUserSpec[]
): CareTeamSnapshot {
  const byId = new Map(users.map((u) => [u.id, u]));
  const memberIds = Array.from(new Set([patient.primaryDoctorId, ...patient.careTeamIds]));
  const members: CareTeamMember[] = [];

  for (const id of memberIds) {
    const user = byId.get(id);
    if (!user) continue;
    members.push({
      userId: user.id,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      label: user.fullName,
    });
  }

  return {
    patientId: patient.id,
    primaryDoctorId: patient.primaryDoctorId,
    members,
    coordinatorIds: members
      .filter((m) => m.subRole === "care_coordinator" || m.role === "nurse")
      .map((m) => m.userId),
    nurseIds: members.filter((m) => m.role === "nurse").map((m) => m.userId),
    pharmacistIds: users
      .filter((u) => u.role === "clinical-pharmacist" || u.subRole === "pharmacist")
      .map((u) => u.id)
      .slice(0, 5),
    ...CARE_TEAM_SIM_HONESTY,
  };
}

export function routePharmacyTaskToCareTeam(input: {
  task: PharmacyCoordinationTask;
  careTeam: CareTeamSnapshot;
  at?: string;
}): CareTeamFollowUp {
  const at = input.at ?? new Date().toISOString();
  const preferCoordinator = input.careTeam.coordinatorIds[0] ?? input.careTeam.nurseIds[0] ?? null;
  const assignedRole =
    input.task.status === "escalated_to_clinician"
      ? ("gp" as const)
      : ("care_coordinator" as const);
  const assignedToUserId =
    assignedRole === "gp"
      ? input.careTeam.primaryDoctorId
      : preferCoordinator ?? input.careTeam.primaryDoctorId;

  return {
    id: `e2e-care-followup-${input.task.id}`,
    patientId: input.task.patientId,
    source: "pharmacy",
    sourceEventId: input.task.pharmacyEventId,
    assignedToUserId,
    assignedRole,
    summary: input.task.barrierSummary,
    status: "queued",
    createdAt: at,
    hitlRequired: true,
    ehrWrite: false,
  };
}

export function routeCriticalLabToClinician(input: {
  patientId: string;
  labEventId: string;
  careTeam: CareTeamSnapshot;
  summary: string;
  at?: string;
}): CareTeamFollowUp {
  return {
    id: `e2e-care-lab-${input.labEventId}`,
    patientId: input.patientId,
    source: "lab",
    sourceEventId: input.labEventId,
    assignedToUserId: input.careTeam.primaryDoctorId,
    assignedRole: "gp",
    summary: input.summary,
    status: "queued",
    createdAt: input.at ?? new Date().toISOString(),
    hitlRequired: true,
    ehrWrite: false,
  };
}
