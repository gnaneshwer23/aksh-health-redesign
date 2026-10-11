/**
 * Map what a scheduling system sends (FHIR R4 Slot / Appointment, single or in a Bundle, or plain JSON) onto Aksh's
 * slot and booking facts. Pure and strict: anything ambiguous is reported back with a code instead of guessed.
 */
import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";

export type ConnectorConfig = { typeMap?: Record<string, string>; offerCloseHours?: number; site?: string };

export type SlotFact =
  | { ok: true; ref: string; version: number; free: true; appointmentType: string; startsAt: string; durationMin: number; offerExpiresAt: string; site?: string }
  | { ok: true; ref: string; version: number; free: false; status: string }
  | { ok: false; ref: string | null; code: string; message: string };

export type AppointmentFact =
  | { ok: true; ref: string; status: string; slotRefs: string[]; patientIdentifiers: string[] }
  | { ok: false; ref: string | null; code: string; message: string };

type Json = Record<string, unknown>;
const asArray = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Unpack a Bundle (searchset, transaction, collection) or a single resource of the wanted type. */
export function resourcesOf(body: unknown, type: "Slot" | "Appointment"): Json[] | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Json;
  if (b.resourceType === type) return [b];
  if (b.resourceType === "Bundle") return asArray(b.entry).map((e) => (e && typeof e === "object" ? (e.resource as Json) : (null as unknown as Json))).filter((r) => !r || r.resourceType === type);
  return null;
}

/** Resolve their appointment code/text to our type: explicit mapping first, then our own codes or labels. */
export function resolveType(candidates: string[], config: ConnectorConfig): string | null {
  for (const c of candidates) {
    const mapped = config.typeMap?.[c] ?? config.typeMap?.[c.toLowerCase()];
    if (mapped && mapped in APPOINTMENT_TYPE_LABEL) return mapped;
  }
  for (const c of candidates) {
    const k = c.toLowerCase().replace(/[\s-]+/g, "_");
    if (k in APPOINTMENT_TYPE_LABEL) return k;
    const byLabel = Object.entries(APPOINTMENT_TYPE_LABEL).find(([, label]) => label.toLowerCase() === c.toLowerCase());
    if (byLabel) return byLabel[0];
  }
  return null;
}

function codingCandidates(concepts: unknown): string[] {
  const out: string[] = [];
  for (const cc of Array.isArray(concepts) ? (concepts as Json[]) : concepts ? [concepts as Json] : []) {
    for (const c of asArray(cc.coding)) {
      if (str(c.code)) out.push(str(c.code)!);
      if (str(c.display)) out.push(str(c.display)!);
    }
    if (str(cc.text)) out.push(str(cc.text)!);
  }
  return out;
}

/** Instants must carry an offset (Z or ±hh:mm): a bare local time means different moments on different servers. */
const WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const instant = (v: unknown) => (typeof v === "string" && WITH_OFFSET.test(v) ? Date.parse(v) : NaN);

export const FHIR_SLOT_STATUSES = new Set(["free", "busy", "busy-unavailable", "busy-tentative", "entered-in-error"]);

/**
 * FHIR versionId is opaque. Use it when it is a plain integer; otherwise fall back to meta.lastUpdated (seconds since
 * the epoch), which is monotonic for a given slot. Anything else is rejected rather than truncated.
 */
export function slotVersion(meta: Json | undefined): number | null {
  const v = meta?.versionId;
  if (v === undefined) return meta?.lastUpdated === undefined ? 1 : lastUpdatedVersion(meta.lastUpdated);
  if (typeof v === "string" && /^\d{1,9}$/.test(v) && Number(v) >= 1) return Number(v);
  if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v < 1e9) return v;
  return meta?.lastUpdated === undefined ? null : lastUpdatedVersion(meta.lastUpdated);
}
function lastUpdatedVersion(v: unknown): number | null {
  const t = instant(v);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

function slotTimes(ref: string, start: unknown, end: unknown, durationMin: unknown, config: ConnectorConfig, now: number) {
  const s = instant(start);
  if (Number.isNaN(s)) return { error: { ok: false as const, ref, code: "INVALID_START", message: "start must be an ISO date-time with an offset (Z or +hh:mm)" } };
  if (end !== undefined && Number.isNaN(instant(end))) return { error: { ok: false as const, ref, code: "INVALID_END", message: "end must be an ISO date-time with an offset (Z or +hh:mm)" } };
  const e = end !== undefined ? instant(end) : NaN;
  const minutes = typeof durationMin === "number" ? durationMin : Number.isNaN(e) ? NaN : Math.round((e - s) / 60_000);
  if (!(minutes >= 5 && minutes <= 240)) return { error: { ok: false as const, ref, code: "INVALID_DURATION", message: "Slot must last 5–240 minutes" } };
  if (s <= now) return { error: { ok: false as const, ref, code: "SLOT_STALE", message: "The slot has already started" } };
  const closeHours = Math.min(Math.max(config.offerCloseHours ?? 2, 0), 72);
  const expires = s - closeHours * 3_600_000;
  if (expires <= now) return { error: { ok: false as const, ref, code: "OFFER_WINDOW_CLOSED", message: `Starts within ${closeHours}h; too late to offer` } };
  return { startsAt: new Date(s).toISOString(), durationMin: minutes, offerExpiresAt: new Date(expires).toISOString() };
}

export function slotFromFhir(r: Json, config: ConnectorConfig, now = Date.now()): SlotFact {
  if (!r || typeof r !== "object") return { ok: false, ref: null, code: "INVALID_ITEM", message: "Each entry must be a Slot resource" };
  const ref = str(r.id);
  if (!ref) return { ok: false, ref: null, code: "MISSING_ID", message: "Slot.id is required" };
  if (!/^[A-Za-z0-9\-.]{1,64}$/.test(ref)) return { ok: false, ref, code: "INVALID_ID", message: "Slot.id must be a FHIR id" };
  const version = slotVersion(r.meta as Json | undefined);
  if (version === null) return { ok: false, ref, code: "INVALID_VERSION", message: "meta.versionId must be an integer, or send meta.lastUpdated" };
  const status = str(r.status);
  if (!status) return { ok: false, ref, code: "MISSING_STATUS", message: "Slot.status is required" };
  if (!FHIR_SLOT_STATUSES.has(status)) return { ok: false, ref, code: "INVALID_STATUS", message: `Unknown Slot.status "${status.slice(0, 40)}"` };
  if (status !== "free") return { ok: true, ref, version, free: false, status };
  const type = resolveType([...codingCandidates(r.appointmentType), ...codingCandidates(r.serviceType)], config);
  if (!type) return { ok: false, ref, code: "UNKNOWN_APPOINTMENT_TYPE", message: "Map this appointment type in Organisation → Connections" };
  const t = slotTimes(ref, r.start, r.end, undefined, config, now);
  if ("error" in t) return t.error!;
  return { ok: true, ref, version, free: true, appointmentType: type, ...t, site: config.site };
}

/** Plain JSON: { id, version?, status: "free"|"busy" (required), appointmentType, start, durationMin|end, site? }. */
export function slotFromJson(r: Json, config: ConnectorConfig, now = Date.now()): SlotFact {
  if (!r || typeof r !== "object" || Array.isArray(r)) return { ok: false, ref: null, code: "INVALID_ITEM", message: "Each slot must be an object" };
  const ref = str(r.id);
  if (!ref || !/^[A-Za-z0-9\-._]{1,64}$/.test(ref)) return { ok: false, ref: ref ?? null, code: "INVALID_ID", message: "id is required (letters, digits, - . _)" };
  const version = r.version === undefined ? 1 : r.version;
  if (!(typeof version === "number" && Number.isInteger(version) && version >= 1 && version < 1e9)) return { ok: false, ref, code: "INVALID_VERSION", message: "version must be a positive integer" };
  const status = str(r.status);
  if (status !== "free" && status !== "busy") return { ok: false, ref, code: status ? "INVALID_STATUS" : "MISSING_STATUS", message: 'status must be "free" or "busy"' };
  if (status === "busy") return { ok: true, ref, version, free: false, status };
  const type = resolveType([str(r.appointmentType) ?? ""].filter(Boolean), config);
  if (!type) return { ok: false, ref, code: "UNKNOWN_APPOINTMENT_TYPE", message: "Map this appointment type in Organisation → Connections" };
  const t = slotTimes(ref, r.start, r.end, r.durationMin, config, now);
  if ("error" in t) return t.error!;
  return { ok: true, ref, version, free: true, appointmentType: type, ...t, site: str(r.site) ?? config.site };
}

const refId = (reference: unknown, type: string) => {
  const s = str(reference);
  if (!s) return undefined;
  const m = s.match(new RegExp(`(?:^|/)${type}/([A-Za-z0-9\\-.]{1,64})(?:/_history/\\d+)?$`));
  return m?.[1];
};

export function appointmentFromFhir(r: Json): AppointmentFact {
  if (!r || typeof r !== "object") return { ok: false, ref: null, code: "INVALID_ITEM", message: "Each entry must be an Appointment resource" };
  const ref = str(r.id);
  if (!ref) return { ok: false, ref: null, code: "MISSING_ID", message: "Appointment.id is required" };
  const status = str(r.status);
  if (!status) return { ok: false, ref, code: "MISSING_STATUS", message: "Appointment.status is required" };
  const slotRefs = asArray(r.slot).map((s) => refId(s.reference, "Slot")).filter((x): x is string => Boolean(x));
  const patientIdentifiers = asArray(r.participant)
    .map((p) => p.actor as Json | undefined)
    .filter((a) => a && (String(a.reference ?? "").includes("Patient/") || a.type === "Patient" || (a.identifier && !a.reference)))
    .map((a) => str((a!.identifier as Json | undefined)?.value))
    .filter((x): x is string => Boolean(x));
  return { ok: true, ref, status, slotRefs, patientIdentifiers };
}

/** Plain JSON: { id, status, slotId, patientRecordNumber }. */
export function appointmentFromJson(r: Json): AppointmentFact {
  if (!r || typeof r !== "object" || Array.isArray(r)) return { ok: false, ref: null, code: "INVALID_ITEM", message: "Each appointment must be an object" };
  const ref = str(r.id);
  if (!ref) return { ok: false, ref: null, code: "MISSING_ID", message: "id is required" };
  return { ok: true, ref, status: str(r.status) ?? "booked", slotRefs: [str(r.slotId)].filter((x): x is string => Boolean(x)), patientIdentifiers: [str(r.patientRecordNumber)].filter((x): x is string => Boolean(x)) };
}

/** FHIR statuses that mean the patient holds the appointment. */
export const BOOKED_STATUSES = new Set(["booked", "arrived", "fulfilled", "checked-in"]);
