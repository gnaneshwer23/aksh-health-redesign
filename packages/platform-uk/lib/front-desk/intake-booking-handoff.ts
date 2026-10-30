/**
 * P1 intake → Front Desk booking handoff.
 * Carries verified patient identity + care_episode_id so reception can book
 * without re-entering name/DOB/reason.
 */
import { displayName, getPatient, type DeskPatient } from "./patients";
import { addWorkItem } from "./workflows";
import type { FrontDeskState, ReferralIntake, WorkItem } from "./types";

export type VerifiedPatientIdentity = {
  id: string;
  name: string;
  dob: string;
};

export type IntakeBookingHandoff = {
  careEpisodeId: string;
  patientId: string;
  verifiedPatient: VerifiedPatientIdentity;
  intakeSummary: string;
  reviewCaseId?: string | null;
  reason?: string | null;
};

export function verifiedPatientFromId(patientId: string): VerifiedPatientIdentity | null {
  const p = getPatient(patientId);
  if (!p) return null;
  return { id: p.id, name: displayName(p), dob: p.dob };
}

export function enrichReferralIdentity(
  referral: ReferralIntake,
  opts?: { careEpisodeId?: string | null; intakeSummary?: string | null }
): ReferralIntake {
  const verified =
    referral.verifiedPatient ??
    (referral.patientId ? verifiedPatientFromId(referral.patientId) : null);
  return {
    ...referral,
    verifiedPatient: verified,
    careEpisodeId: opts?.careEpisodeId?.trim() || referral.careEpisodeId || null,
    intakeSummary:
      opts?.intakeSummary?.trim() ||
      referral.intakeSummary ||
      (verified
        ? `${verified.name} · DOB ${verified.dob} · ${referral.reason || "referral"}`
        : referral.reason || null),
  };
}

/**
 * Open a Front Desk booking work item after classic intake / review-case create,
 * so reception books from the same care_episode_id without re-typing identity.
 */
export function openIntakeBookingWorkItem(
  state: FrontDeskState,
  handoff: IntakeBookingHandoff,
  at = new Date().toISOString()
): WorkItem {
  const existing = state.workItems.find(
    (w) =>
      w.kind === "booking" &&
      w.status === "open" &&
      w.careEpisodeId === handoff.careEpisodeId &&
      w.patientId === handoff.patientId
  );
  if (existing) return existing;

  const who = handoff.verifiedPatient.name;
  const summary = `Book from intake · ${who} · DOB ${handoff.verifiedPatient.dob} · episode ${handoff.careEpisodeId}${
    handoff.reason ? ` · ${handoff.reason.slice(0, 120)}` : ""
  }`;

  return addWorkItem(state, {
    kind: "booking",
    status: "open",
    channel: "staff",
    direction: "inbound",
    patientId: handoff.patientId,
    summary,
    priority: "routine",
    at,
    careEpisodeId: handoff.careEpisodeId,
  });
}

export function deskPatientCard(p: DeskPatient | VerifiedPatientIdentity) {
  return {
    id: p.id,
    name: "name" in p ? p.name : displayName(p as DeskPatient),
    dob: p.dob,
  };
}
