/**
 * Degraded state for Patient Access (PRD v1.1 §5.3 "no silent drop", §5.4, §14 "audit persistence failure",
 * "hand-off queue down"). Every slot-fill step is written in one transaction with its audit row, so when the database
 * cannot persist, nothing changes. This turns that failure into an explicit, visible NOT_RECORDED answer with the
 * alternate route staff must use, instead of a generic error, and reports the fault.
 */
import { ZodError } from "zod";

import { NetworkError } from "@/lib/network/service";
import { reportError } from "@/lib/observability/errors";

export const NOT_RECORDED = "NOT_RECORDED";

export type PersistKind = "slot" | "action" | "handoff";

export const ALTERNATE_ROUTE: Record<PersistKind, string> = {
  slot: "The freed slot was not recorded and Aksh cannot audit it right now. Fill it with your usual booking process; record it here when Aksh is back if you want it counted.",
  action:
    "This step was not recorded and nothing changed for this slot, because the audit trail could not be written. Do not act on it from Aksh until this clears; if the slot must be filled now, use your usual booking process.",
  handoff:
    "The hand-off could not be recorded. Pass it to the duty team directly now (phone or in person), then record it here when Aksh is back.",
};

/** True for the failures this module produces, so callers and the UI can show the degraded state. */
export const isNotRecorded = (message: string | null | undefined) => Boolean(message?.startsWith(`${NOT_RECORDED}:`));

export async function persisted<T>(kind: PersistKind, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof NetworkError || error instanceof ZodError) throw error;
    await reportError(error, { source: "server", route: `access.${kind}` }).catch(() => undefined);
    throw new NetworkError(`${NOT_RECORDED}: ${ALTERNATE_ROUTE[kind]}`, 503);
  }
}
