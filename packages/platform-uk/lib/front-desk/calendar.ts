import type { AppointmentType, FrontDeskState, Slot, WaitlistEntry } from "./types";

/**
 * Synthetic practice calendar (hazard H-ACC-6). Booking is keyed by slot and idempotent;
 * a move is cancel + book in one state transition. Track A only: the GP Connect Appointment
 * Management transport replaces this for a real practice.
 */

const CLINICIANS: { id: string; name: string; role: Slot["clinicianRole"]; types: AppointmentType[]; days: number[]; times: string[] }[] = [
  { id: "clin-morgan", name: "Dr Morgan", role: "GP", types: ["gp_routine"], days: [1, 2, 3, 4, 5], times: ["09:00", "09:20", "09:40", "10:00", "10:20", "14:00", "14:20", "14:40", "15:00"] },
  { id: "clin-williams", name: "Dr S. Williams", role: "GP", types: ["gp_routine"], days: [1, 3, 5], times: ["10:40", "11:00", "11:20", "15:20", "15:40"] },
  { id: "clin-osei", name: "Nurse Osei", role: "Diabetes nurse", types: ["diabetes_review", "foot_check"], days: [2, 4], times: ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00"] },
  { id: "clin-hughes", name: "Nurse Hughes", role: "Practice nurse", types: ["nurse_review", "foot_check"], days: [1, 2, 3, 4, 5], times: ["11:00", "11:30", "16:00"] },
  { id: "clin-baker", name: "HCA Baker", role: "HCA", types: ["blood_test"], days: [1, 2, 3, 4, 5], times: ["08:30", "08:40", "08:50", "09:00", "09:10", "09:20"] },
];

const DURATION: Record<AppointmentType, number> = {
  gp_routine: 10,
  diabetes_review: 30,
  blood_test: 10,
  nurse_review: 20,
  foot_check: 20,
};

/** London wall time → UTC ISO (BST/GMT aware). */
export function londonIso(date: string, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const guess = new Date(`${date}T${hhmm}:00Z`);
  const londonHour = Number(
    guess.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/London" })
  );
  const offset = (londonHour - h + 24) % 24; // 1 in BST, 0 in GMT
  return new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), h - offset, m)).toISOString();
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function generateSlots(anchorDate: string, days = 14): Slot[] {
  const slots: Slot[] = [];
  for (let i = 1; i <= days; i++) {
    const date = addDays(anchorDate, i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    for (const c of CLINICIANS) {
      if (!c.days.includes(dow)) continue;
      c.times.forEach((t, ti) => {
        const type = c.types[ti % c.types.length]!;
        slots.push({
          id: `slot-${date}-${c.id}-${t.replace(":", "")}`,
          clinicianId: c.id,
          clinicianName: c.name,
          clinicianRole: c.role,
          start: londonIso(date, t),
          durationMin: DURATION[type],
          type,
          patientId: null,
          bookedVia: null,
          bookingKey: null,
        });
      });
    }
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

/** Pre-book roughly a third of slots for synthetic patients so the calendar looks real. */
export function seedBookings(slots: Slot[], patientIds: string[]) {
  slots.forEach((s, i) => {
    if (i % 3 === 0 && patientIds.length) {
      s.patientId = patientIds[(i * 7) % patientIds.length]!;
      s.bookedVia = "staff";
      s.bookingKey = `seed-${s.id}`;
    }
  });
}

export function findFreeSlots(state: FrontDeskState, type: AppointmentType, opts: { after: string; limit?: number; excludeIds?: string[] }) {
  return state.slots
    .filter((s) => s.type === type && !s.patientId && s.start > opts.after && !opts.excludeIds?.includes(s.id))
    .slice(0, opts.limit ?? 3);
}

export function nextAppointmentFor(state: FrontDeskState, patientId: string, after: string) {
  return state.slots.find((s) => s.patientId === patientId && s.start > after) ?? null;
}

export type BookResult = { ok: true; slot: Slot; idempotent: boolean } | { ok: false; reason: "slot_taken" | "slot_not_found" };

export function bookSlot(state: FrontDeskState, slotId: string, patientId: string, via: Slot["bookedVia"], bookingKey: string): BookResult {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) return { ok: false, reason: "slot_not_found" };
  if (slot.patientId === patientId && slot.bookingKey === bookingKey) return { ok: true, slot, idempotent: true };
  if (slot.patientId) return { ok: false, reason: "slot_taken" };
  slot.patientId = patientId;
  slot.bookedVia = via;
  slot.bookingKey = bookingKey;
  const wait = state.waitlist.find((w) => w.patientId === patientId && w.type === slot.type && w.status !== "booked");
  if (wait) wait.status = "booked";
  return { ok: true, slot, idempotent: false };
}

export function cancelSlot(state: FrontDeskState, slotId: string, patientId: string): Slot | null {
  const slot = state.slots.find((s) => s.id === slotId && s.patientId === patientId);
  if (!slot) return null;
  slot.patientId = null;
  slot.bookedVia = null;
  slot.bookingKey = null;
  return slot;
}

export function moveSlot(state: FrontDeskState, fromSlotId: string, toSlotId: string, patientId: string, via: Slot["bookedVia"], bookingKey: string) {
  const target = state.slots.find((s) => s.id === toSlotId);
  if (!target || target.patientId) return { ok: false as const, reason: "slot_taken" as const };
  const from = cancelSlot(state, fromSlotId, patientId);
  if (!from) return { ok: false as const, reason: "no_existing_appointment" as const };
  const booked = bookSlot(state, toSlotId, patientId, via, bookingKey);
  return booked.ok ? { ok: true as const, from, to: booked.slot } : { ok: false as const, reason: booked.reason };
}

/**
 * Demo only: offer a freed slot in the synthetic Front Desk calendar to the longest-waiting matching patient. This is
 * not the product's slot fill. The canonical workflow, metric (slot-fill-v1.2) and audit trail are `lib/access`; Front
 * Desk APIs are closed in the real workspace, so this never runs on a clinic's calendar (platform map G3).
 */
export function offerFreedSlot(state: FrontDeskState, slot: Slot): WaitlistEntry | null {
  const candidate = state.waitlist
    .filter((w) => w.type === slot.type && w.status === "waiting")
    .sort((a, b) => (a.priority === b.priority ? a.addedAt.localeCompare(b.addedAt) : a.priority === "soon" ? -1 : 1))[0];
  if (!candidate) return null;
  candidate.status = "offered";
  candidate.offeredSlotId = slot.id;
  return candidate;
}
