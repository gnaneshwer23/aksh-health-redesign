import { patients } from "@/lib/mock-data/patients";

import { displayName } from "./patients";
import { FRONT_DESK_HONESTY, type FrontDeskState } from "./types";
import { campaignTargets, computeMetrics } from "./workflows";

const nameOf = (id: string | null) => {
  if (!id) return null;
  const p = patients.find((x) => x.id === id);
  return p ? displayName(p) : id;
};

/** What the Front Desk console needs; synthetic data only. */
export function buildFrontDeskView(state: FrontDeskState, storage: "postgres" | "memory") {
  const now = new Date().toISOString();
  const upcoming = state.slots.filter((s) => s.start > now);
  const byDay = new Map<string, { date: string; total: number; booked: number }>();
  for (const s of upcoming) {
    const date = new Date(s.start).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const d = byDay.get(date) ?? { date, total: 0, booked: 0 };
    d.total += 1;
    if (s.patientId) d.booked += 1;
    byDay.set(date, d);
  }
  return {
    practiceName: state.practiceName,
    storage,
    honesty: FRONT_DESK_HONESTY,
    metrics: computeMetrics(state),
    workItems: state.workItems.slice(0, 80).map((w) => ({ ...w, patientName: nameOf(w.patientId) })),
    drafts: state.drafts.slice(0, 40),
    campaigns: state.campaigns.map((c) => ({ ...c, targets: c.targets.map((t) => ({ ...t, patientName: nameOf(t.patientId) })) })),
    campaignPreview: {
      missed_appointment: campaignTargets(state, "missed_appointment").length,
      lapsed_review: campaignTargets(state, "lapsed_review").length,
      recall: campaignTargets(state, "recall").length,
      health_check_in: campaignTargets(state, "health_check_in").length,
    },
    referrals: state.referrals.slice(0, 20).map((r) => ({
      ...r,
      patientName: nameOf(r.patientId),
      proposedSlot: r.proposedSlotId ? state.slots.find((s) => s.id === r.proposedSlotId) ?? null : null,
    })),
    waitlist: state.waitlist.map((w) => ({ ...w, patientName: nameOf(w.patientId) })),
    calendar: [...byDay.values()].slice(0, 10),
    recentBookings: upcoming
      .filter((s) => s.patientId && s.bookedVia && s.bookedVia !== "staff")
      .slice(0, 12)
      .map((s) => ({ ...s, patientName: nameOf(s.patientId) })),
  };
}
