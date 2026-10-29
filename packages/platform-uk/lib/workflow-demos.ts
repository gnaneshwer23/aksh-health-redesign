/**
 * Catalog for interactive production-workflow demos (synthetic data only).
 * Pattern: catalog → variants (journey beats) → controls → renderer props.
 * Clinician/staff always decide; demos never claim autonomous treatment changes.
 */

export type DemoControl =
  | { kind: "checkpoint"; key: string; label: string; options: { value: string; label: string }[]; default: string }
  | { kind: "choice"; key: string; label: string; options: { value: string; label: string }[]; default: string };

export type DemoVariant = {
  id: string;
  label: string;
  description: string;
  props: Record<string, string | number | boolean>;
};

export type WorkflowDemoEntry = {
  id: "slot-fill" | "glucose";
  category: string;
  label: string;
  tags: string[];
  description: string;
  interaction: string;
  href: string;
  duration: string;
  capabilityId: "slot_fill" | "cgm_monitoring";
  controls: DemoControl[];
  variants: DemoVariant[];
};

export const WORKFLOW_DEMOS: WorkflowDemoEntry[] = [
  {
    id: "slot-fill",
    category: "Production workflow",
    label: "Cancelled-slot fill",
    tags: ["slots", "waiting-list", "staff-decision", "synthetic"],
    description:
      "A freed diabetes-review slot arrives, Aksh ranks who fits with reasons, staff choose and contact, and the slot counts only when the schedule confirms the booking.",
    interaction: "Step through the journey; at the decision beat, choose offer / skip / hand off",
    href: "/demo/slot-fill",
    duration: "~3 minutes",
    capabilityId: "slot_fill",
    controls: [
      {
        kind: "checkpoint",
        key: "step",
        label: "Journey step",
        options: [
          { value: "event", label: "1 · Slot frees" },
          { value: "rank", label: "2 · Ranked worklist" },
          { value: "decide", label: "3 · Staff decide" },
          { value: "result", label: "4 · Recorded result" },
        ],
        default: "event",
      },
      {
        kind: "choice",
        key: "decision",
        label: "Staff decision (demo scenario)",
        options: [
          { value: "offer", label: "Draft offer to top match" },
          { value: "skip", label: "Skip with reason" },
          { value: "handoff", label: "Hand off to reception" },
        ],
        default: "offer",
      },
    ],
    variants: [
      {
        id: "shadow-offer",
        label: "Shadow · offer accepted",
        description: "Staff draft an offer; booking waits for schedule read-back.",
        props: { step: "result", decision: "offer" },
      },
      {
        id: "handoff",
        label: "Uncertain booking → hand-off",
        description: "Schedule does not confirm; a named person gets a due time.",
        props: { step: "result", decision: "handoff" },
      },
    ],
  },
  {
    id: "glucose",
    category: "Production workflow",
    label: "Glucose and CGM monitoring",
    tags: ["cgm", "worklist", "clinician-review", "synthetic"],
    description:
      "CGM and shared readings become one worklist with low glucose first; the clinician reviews the explanation and records the response. No autonomous treatment changes.",
    interaction: "Step through readings → worklist → explanation → clinician review → recorded result",
    href: "/demo/glucose",
    duration: "~3 minutes",
    capabilityId: "cgm_monitoring",
    controls: [
      {
        kind: "checkpoint",
        key: "step",
        label: "Journey step",
        options: [
          { value: "readings", label: "1 · Readings arrive" },
          { value: "worklist", label: "2 · Prioritised worklist" },
          { value: "explain", label: "3 · Explanation" },
          { value: "review", label: "4 · Clinician review" },
          { value: "result", label: "5 · Recorded result" },
        ],
        default: "readings",
      },
      {
        kind: "choice",
        key: "decision",
        label: "Clinician decision (demo scenario)",
        options: [
          { value: "reviewed", label: "Mark reviewed · no change today" },
          { value: "followup", label: "Book follow-up" },
          { value: "escalate", label: "Escalate to named clinician" },
        ],
        default: "reviewed",
      },
    ],
    variants: [
      {
        id: "low-glucose",
        label: "Low glucose first",
        description: "Urgent time-below-range case at the top of the worklist.",
        props: { step: "review", decision: "followup" },
      },
      {
        id: "thin-data",
        label: "Insufficient sensor wear",
        description: "Data completeness warning; clinician decides not to act on thin data.",
        props: { step: "result", decision: "reviewed" },
      },
    ],
  },
];

export function workflowDemo(id: WorkflowDemoEntry["id"]): WorkflowDemoEntry {
  const entry = WORKFLOW_DEMOS.find((d) => d.id === id);
  if (!entry) throw new Error(`Unknown workflow demo ${id}`);
  return entry;
}

/** Defaults from controls, then variant props override. */
export function demoControlDefaults(
  entry: WorkflowDemoEntry,
  variantId?: string
): Record<string, string> {
  const base = Object.fromEntries(entry.controls.map((c) => [c.key, c.default])) as Record<string, string>;
  if (!variantId) return base;
  const variant = entry.variants.find((v) => v.id === variantId);
  if (!variant) return base;
  return { ...base, ...Object.fromEntries(Object.entries(variant.props).map(([k, v]) => [k, String(v)])) };
}
