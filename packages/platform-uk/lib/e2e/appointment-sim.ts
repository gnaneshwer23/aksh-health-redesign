/**
 * Appointment simulation — book, remind, complete, no-show → care-coordinator task.
 * Labelled SIMULATED; operationally complete (no dead ends).
 */

import { stageEhrAdapterWrite } from "./ehr-adapter";

export const APPOINTMENT_SIM_HONESTY = {
  liveScheduling: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated clinic scheduling only — no live calendar / EHR diary write.",
} as const;

export type AppointmentKind =
  | "diabetes_review"
  | "nurse_followup"
  | "lab_phlebotomy"
  | "pharmacist_med_review"
  | "care_coordinator_outreach";

export type AppointmentStatus =
  | "scheduled"
  | "reminded"
  | "completed"
  | "no_show"
  | "cancelled";

export type SimulatedAppointment = {
  id: string;
  patientId: string;
  organisationId: string;
  clinicId: string;
  kind: AppointmentKind;
  status: AppointmentStatus;
  scheduledAt: string;
  clinicianUserId: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  liveScheduling: false;
  ehrWrite: false;
  liveEmis: false;
  note: string;
};

export type AppointmentNoShowTask = {
  id: string;
  appointmentId: string;
  patientId: string;
  assigneeRole: "care_coordinator";
  status: "open" | "in_progress" | "closed";
  summary: string;
  createdAt: string;
  hitlRequired: true;
  ehrWrite: false;
};

export function bookAppointment(input: {
  patientId: string;
  organisationId: string;
  clinicId: string;
  kind: AppointmentKind;
  scheduledAt: string;
  clinicianUserId: string | null;
  correlationId: string;
  actor: string;
  at?: string;
}): SimulatedAppointment {
  const at = input.at ?? new Date().toISOString();
  const staged = stageEhrAdapterWrite(
    {
      organisationId: input.organisationId,
      clinicId: input.clinicId,
      correlationId: input.correlationId,
      patientId: input.patientId,
      actor: input.actor,
    },
    "appointment_schedule"
  );

  return {
    id: `e2e-appt-${input.correlationId.slice(-8)}-${input.kind}`,
    patientId: input.patientId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    kind: input.kind,
    status: "scheduled",
    scheduledAt: input.scheduledAt,
    clinicianUserId: input.clinicianUserId,
    correlationId: input.correlationId,
    createdAt: at,
    updatedAt: at,
    liveScheduling: false,
    ehrWrite: false,
    liveEmis: false,
    note: `${APPOINTMENT_SIM_HONESTY.note} · staged=${staged.stagingId}`,
  };
}

export function sendAppointmentReminder(
  appointment: SimulatedAppointment,
  at?: string
): SimulatedAppointment {
  if (appointment.status !== "scheduled" && appointment.status !== "reminded") {
    throw new Error(`Cannot remind appointment in status ${appointment.status}`);
  }
  return {
    ...appointment,
    status: "reminded",
    updatedAt: at ?? new Date().toISOString(),
  };
}

export function completeAppointment(
  appointment: SimulatedAppointment,
  at?: string
): SimulatedAppointment {
  if (appointment.status === "no_show" || appointment.status === "cancelled") {
    throw new Error(`Cannot complete appointment in status ${appointment.status}`);
  }
  return {
    ...appointment,
    status: "completed",
    updatedAt: at ?? new Date().toISOString(),
  };
}

/**
 * Mark no-show and open a care-coordinator chase task (operationally complete handoff).
 */
export function markAppointmentNoShow(input: {
  appointment: SimulatedAppointment;
  actor: string;
  at?: string;
}): { appointment: SimulatedAppointment; task: AppointmentNoShowTask } {
  const at = input.at ?? new Date().toISOString();
  if (
    input.appointment.status === "completed" ||
    input.appointment.status === "cancelled" ||
    input.appointment.status === "no_show"
  ) {
    throw new Error(`Cannot mark no-show from status ${input.appointment.status}`);
  }

  const appointment: SimulatedAppointment = {
    ...input.appointment,
    status: "no_show",
    updatedAt: at,
  };

  const task: AppointmentNoShowTask = {
    id: `e2e-noshow-task-${appointment.id}`,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    assigneeRole: "care_coordinator",
    status: "open",
    summary: `No-show chase for ${appointment.kind} (${appointment.scheduledAt}) · actor=${input.actor} · SIMULATED`,
    createdAt: at,
    hitlRequired: true,
    ehrWrite: false,
  };

  return { appointment, task };
}

export function closeNoShowTask(
  task: AppointmentNoShowTask,
  actor: string,
  at?: string
): AppointmentNoShowTask {
  return {
    ...task,
    status: "closed",
    summary: `${task.summary} · closed by ${actor} at ${at ?? new Date().toISOString()}`,
  };
}
