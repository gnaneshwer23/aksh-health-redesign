/**
 * P1-BOOK-01 / P2 — deterministic booking → nurse observation task handoff.
 * No new agent: after a verified (non-idempotent) book, open a nurse work item
 * linked to patient + care_episode_id when present. Nurse dashboard reads these
 * via /api/nurse/observation-worklist (not Front Desk-only state).
 */
import { APPOINTMENT_TYPE_LABEL } from "./intents";
import type { FrontDeskState, Slot, WorkItem } from "./types";
import { addWorkItem } from "./workflows";

/** Prefer care_episode_id from the booked slot when present. */
export function careEpisodeIdFromSlot(slot: Slot): string | null {
  return slot.careEpisodeId?.trim() || null;
}

export function buildNurseObservationSummary(slot: Slot, patientLabel?: string): string {
  const who = patientLabel?.trim() || slot.patientId || "patient";
  const typeLabel = APPOINTMENT_TYPE_LABEL[slot.type] ?? slot.type;
  const ep = careEpisodeIdFromSlot(slot);
  return ep
    ? `Nurse observations due for ${who} · ${typeLabel} · episode ${ep}`
    : `Nurse observations due for ${who} · ${typeLabel} · slot ${slot.id}`;
}

/**
 * Create an open nurse handoff work item after a successful new booking.
 * Skips idempotent re-books so we do not duplicate tasks.
 */
export function handoffBookingToNurse(
  state: FrontDeskState,
  slot: Slot,
  opts?: {
    patientLabel?: string;
    channel?: WorkItem["channel"];
    at?: string;
    skipIfExists?: boolean;
    careEpisodeId?: string | null;
  }
): WorkItem | null {
  if (!slot.patientId) return null;

  const careEpisodeId = (opts?.careEpisodeId?.trim() || careEpisodeIdFromSlot(slot)) ?? null;
  if (careEpisodeId && !slot.careEpisodeId) {
    slot.careEpisodeId = careEpisodeId;
  }

  if (opts?.skipIfExists !== false) {
    const exists = state.workItems.some(
      (w) =>
        w.kind === "nurse_observation" &&
        w.patientId === slot.patientId &&
        w.status === "open" &&
        (careEpisodeId
          ? w.careEpisodeId === careEpisodeId || w.summary.includes(careEpisodeId)
          : w.slotId === slot.id || w.summary.includes(slot.id))
    );
    if (exists) return null;
  }

  return addWorkItem(state, {
    kind: "nurse_observation",
    status: "open",
    channel: opts?.channel ?? "staff",
    direction: "inbound",
    patientId: slot.patientId,
    summary: buildNurseObservationSummary(slot, opts?.patientLabel),
    priority: slot.type === "diabetes_review" || slot.type === "foot_check" ? "urgent" : "routine",
    at: opts?.at,
    careEpisodeId,
    slotId: slot.id,
  });
}

/** List open nurse observation tasks (for nurse worklist / tests). */
export function listOpenNurseObservationTasks(state: FrontDeskState): WorkItem[] {
  return state.workItems.filter((w) => w.kind === "nurse_observation" && w.status === "open");
}

/** Shape used by nurse dashboard / API (synthetic only). */
export type NurseObservationWorklistItem = {
  id: string;
  patientId: string | null;
  summary: string;
  priority: WorkItem["priority"];
  careEpisodeId: string | null;
  slotId: string | null;
  at: string;
  status: "open";
  source: "front_desk_booking";
  synthetic: true;
  ehrWrite: false;
};

export function buildNurseObservationWorklist(state: FrontDeskState): NurseObservationWorklistItem[] {
  return listOpenNurseObservationTasks(state).map((w) => ({
    id: w.id,
    patientId: w.patientId,
    summary: w.summary,
    priority: w.priority,
    careEpisodeId: w.careEpisodeId ?? null,
    slotId: w.slotId ?? null,
    at: w.at,
    status: "open" as const,
    source: "front_desk_booking" as const,
    synthetic: true as const,
    ehrWrite: false as const,
  }));
}
