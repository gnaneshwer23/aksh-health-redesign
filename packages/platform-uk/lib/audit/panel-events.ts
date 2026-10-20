/**
 * Audit events from dashboard panels, composed on the server. A panel says what happened in structured terms (event
 * kind, subject, agent, action); the server writes the wording from this catalogue, stamps who, where and when, and
 * marks the origin. Free-text labels from the browser are not accepted, so a panel cannot write an arbitrary audit
 * line. A clinician's own note is kept separately, attributed to them (detail).
 */
import { AGENTS } from "../agents/register";

export const PANEL_EVENT_KINDS = ["staged", "decided", "exported", "escalated"] as const;
export type PanelEventKind = (typeof PANEL_EVENT_KINDS)[number];

export const PANEL_SUBJECTS = {
  draft: "draft",
  health_plan: "health plan draft",
  risk_brief: "risk brief",
  interaction_alert: "medication interaction alert",
  handover: "nurse handover",
  scenario_ranking: "synthetic scenario ranking (not a physiological twin)",
  coaching: "coaching draft",
  capacity_recommendation: "capacity recommendation",
  staffing_recommendation: "staffing recommendation",
  evaluation: "research evaluation export",
} as const;
export type PanelSubject = keyof typeof PANEL_SUBJECTS;

export const PANEL_ACTIONS = ["accept", "reject", "edit", "defer", "export", "view"] as const;
export type PanelAction = (typeof PANEL_ACTIONS)[number];

/** Agent names a panel may cite: the register's ids and legacy ids, plus the synthetic twin used by scenario ranking. */
/** Coaching drafts (lifestyle support) come from four rules-based coaching agents under Aksh Diabetes. */
export const PANEL_AGENTS = new Set<string>([...AGENTS.flatMap((a) => [a.id, ...a.legacyIds]), "TWIN_SIM", "Dr.Assist", "NUTRITION", "SLEEP", "EXERCISE", "MENTAL_HEALTH"]);

const VERB: Record<PanelAction, string> = { accept: "accepted", reject: "rejected", edit: "edited", defer: "deferred", export: "exported", view: "viewed" };

export type PanelEventInput = { event: PanelEventKind; subject: PanelSubject; agent?: string; action: PanelAction };

export type PanelEventError = { error: string };

/** Validates a panel event and returns the server-written label and category. */
export function composePanelEvent(e: Partial<Record<keyof PanelEventInput, unknown>>): (PanelEventInput & { label: string; category: string }) | PanelEventError {
  if (!PANEL_EVENT_KINDS.includes(e.event as PanelEventKind)) return { error: "Unknown event." };
  // Own keys only: `in` would also accept inherited names such as "__proto__" or "constructor".
  if (typeof e.subject !== "string" || !Object.prototype.hasOwnProperty.call(PANEL_SUBJECTS, e.subject)) return { error: "Unknown subject." };
  if (!PANEL_ACTIONS.includes(e.action as PanelAction)) return { error: "Unknown action." };
  if (e.agent !== undefined && (typeof e.agent !== "string" || !PANEL_AGENTS.has(e.agent))) return { error: "Unknown agent." };
  const event = e.event as PanelEventKind;
  const subject = e.subject as PanelSubject;
  const action = e.action as PanelAction;
  const agent = e.agent as string | undefined;
  const what = PANEL_SUBJECTS[subject];
  const who = agent ? `${agent} ` : "";
  const label =
    event === "staged" ? `${who}${what} staged for clinician review`
    : event === "escalated" ? `${who}${what} escalated to a clinician`
    : event === "exported" ? `${what} exported`
    : `${who}${what} ${VERB[action]}`;
  const category = event === "decided" ? "reviewer_decision" : event === "exported" ? "system" : "reviewer_note";
  return { event, subject, agent, action, label: `SHIELD: ${label}`, category };
}
