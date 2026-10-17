import { STATUS_LABEL, STATUS_MEANING, type CapabilityStatus } from "@/lib/status/capabilities";

const CLASS: Record<CapabilityStatus, string> = { production: "production", synthetic_demo: "synthetic", in_validation: "partial", planned: "planned" };

/** A capability's status, from the capability register; the meaning is in the title for hover and screen readers. */
export function StatusPill({ s }: { s: CapabilityStatus }) {
  return <span className={`s-status s-status--${CLASS[s]}`} title={STATUS_MEANING[s]}>{STATUS_LABEL[s]}</span>;
}

/** What each status means, shown once above a list. */
export function StatusLegend({ only }: { only?: CapabilityStatus[] }) {
  const all = (["production", "in_validation", "synthetic_demo", "planned"] as CapabilityStatus[]).filter((s) => !only || only.includes(s));
  return (
    <dl className="s-status-legend" aria-label="What the statuses mean">
      {all.map((s) => (
        <div key={s}><dt><StatusPill s={s} /></dt><dd>{STATUS_MEANING[s]}</dd></div>
      ))}
    </dl>
  );
}
