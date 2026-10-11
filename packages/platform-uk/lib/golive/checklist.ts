/**
 * The go-live checklist. Evidence items are submitted by an organisation admin and accepted by an Aksh platform admin;
 * automatic items are computed from the organisation's own data at the moment they are read. Pure: no database access.
 */
import { z } from "zod";

/** A real calendar date (2000-02-31 is rejected), as YYYY-MM-DD. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date")
  .refine((d) => {
    const t = Date.parse(`${d}T00:00:00Z`);
    return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === d;
  }, "Not a real date");
/** Date-only values come from the user's own calendar: allow "today" anywhere on Earth (up to UTC+14). */
export const notFuture = (d: string) => d <= new Date(Date.now() + 14 * 3_600_000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export const EVIDENCE_ITEMS = {
  dpa: {
    title: "Data processing agreement signed",
    help: "The agreement between your organisation and Aksh that sets out how patient data is processed.",
    schema: z.object({
      signedOn: isoDate.refine(notFuture, "Cannot be in the future"),
      signatoryName: z.string().trim().min(2).max(120),
      signatoryRole: z.string().trim().min(2).max(120),
      documentRef: z.string().trim().min(2).max(200),
    }),
  },
  dpia: {
    title: "Privacy impact assessment completed",
    help: "Your data protection impact assessment for using Aksh, with its residual risk.",
    schema: z.object({
      completedOn: isoDate.refine(notFuture, "Cannot be in the future"),
      reference: z.string().trim().min(2).max(200),
      residualRisk: z.enum(["low", "medium", "high"]).refine((r) => r !== "high", "High residual risk must be reduced before go-live"),
      summary: z.string().trim().max(1000).optional(),
    }),
  },
  safety_lead: {
    title: "Clinical safety lead named",
    help: "A registered clinician in your organisation who owns clinical safety for this service. Their registration must be checked.",
    schema: z.object({ membershipId: z.string().min(1).max(64) }),
  },
  contact_channel: {
    title: "Patient contact channel agreed",
    help: "How your staff will contact patients about freed slots. Aksh drafts the message; your staff send it.",
    schema: z.object({
      channel: z.enum(["sms", "phone", "email", "app", "whatsapp"]),
      senderName: z.string().trim().min(2).max(80),
      optOutWording: z.string().trim().min(10).max(300),
      contactHours: z.string().trim().max(80).optional(),
    }),
  },
  baseline: {
    title: "Baseline locked",
    help: "How many freed slots you had and filled before Aksh, over at least four weeks. Locked once accepted: results are measured against it.",
    schema: z
      .object({
        periodStart: isoDate,
        periodEnd: isoDate.refine(notFuture, "Cannot be in the future"),
        freedSlots: z.number().int().min(0).max(100_000),
        filledSlots: z.number().int().min(0).max(100_000),
        method: z.string().trim().min(3).max(300),
      })
      .refine((b) => daysBetween(b.periodStart, b.periodEnd) >= 27, { message: "Use a period of at least four weeks", path: ["periodEnd"] })
      .refine((b) => b.filledSlots <= b.freedSlots, { message: "Filled cannot exceed freed", path: ["filledSlots"] }),
  },
} as const;

export type EvidenceKey = keyof typeof EVIDENCE_ITEMS;
export const EVIDENCE_KEYS = Object.keys(EVIDENCE_ITEMS) as EvidenceKey[];
/** Items that can never change once accepted. */
export const LOCKED_WHEN_ACCEPTED: EvidenceKey[] = ["baseline"];

export const AUTO_ITEMS = {
  settings: "Time zone and emergency number set",
  staff_verified: "Every clinician's registration checked",
  no_sample_data: "No sample patients or rehearsal slots",
  patients_loaded: "Patients and a waiting list loaded",
} as const;
export type AutoKey = keyof typeof AUTO_ITEMS;

export type GoLiveEvent = {
  id: number;
  item_key: string | null;
  action: "submitted" | "accepted" | "rejected" | "requested" | "approved" | "returned";
  evidence: Record<string, unknown>;
  note: string | null;
  actor_user_id: string;
  actor_kind: "org_admin" | "platform_admin";
  created_at: string;
};

export type ItemState = { key: EvidenceKey; title: string; help: string; state: "missing" | "submitted" | "accepted" | "rejected"; evidence: Record<string, unknown> | null; note: string | null; at: string | null; locked: boolean };

/** Current state of each evidence item: the latest event for that item wins (events arrive in id order). */
export function deriveItems(events: GoLiveEvent[]): ItemState[] {
  return EVIDENCE_KEYS.map((key) => {
    const def = EVIDENCE_ITEMS[key];
    let state: ItemState["state"] = "missing";
    let evidence: Record<string, unknown> | null = null;
    let note: string | null = null;
    let at: string | null = null;
    for (const e of events) {
      if (e.item_key !== key) continue;
      if (e.action === "submitted") {
        state = "submitted";
        evidence = e.evidence;
        note = null;
      } else if (e.action === "accepted" || e.action === "rejected") {
        state = e.action;
        note = e.note;
      }
      at = e.created_at;
    }
    return { key, title: def.title, help: def.help, state, evidence, note, at, locked: state === "accepted" && LOCKED_WHEN_ACCEPTED.includes(key) };
  });
}

export type AutoCheck = { key: AutoKey; title: string; ok: boolean; detail: string };

export function readiness(items: ItemState[], autos: AutoCheck[]) {
  const blockers = [
    ...autos.filter((a) => !a.ok).map((a) => `${a.title}: ${a.detail}`),
    ...items.filter((i) => i.state === "missing" || i.state === "rejected").map((i) => `${i.title}: ${i.state === "missing" ? "not submitted" : "returned for changes"}`),
  ];
  return {
    canRequest: blockers.length === 0,
    canApprove: blockers.length === 0 && items.every((i) => i.state === "accepted"),
    blockers,
  };
}
