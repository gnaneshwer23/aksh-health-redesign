import Link from "next/link";

import { doNotClaimYet } from "@/lib/roadmap";

export function KnownLimitationsFooter({
  artifactLabel = "This printable artifact",
  roadmapReportHref = "/review/roadmap/report"
}: {
  artifactLabel?: string;
  roadmapReportHref?: string;
}) {
  return (
    <section className="report-section known-limitations-footer" data-testid="known-limitations-footer">
      <h2>Known Limitations</h2>
      <p>
        {artifactLabel} is part of the Aksh Health UK/EU synthetic proof system. It supports internal review, advisor
        walkthroughs, and evidence rehearsal. It is not production clinical software, live health system/EHR integration, or
        real-patient-data handling evidence.
      </p>
      <div className="list">
        {doNotClaimYet.map((item) => (
          <div className="row" key={item}>
            <div>
              <strong>{item}</strong>
              <p>Use preparation, rehearsal, or future-milestone language only.</p>
            </div>
            <span className="tag danger">not yet</span>
          </div>
        ))}
      </div>
      <p>
        Full guardrails and build-state boundaries are also available in the{" "}
        <Link href={roadmapReportHref}>roadmap report</Link> and{" "}
        <Link href="/review/command-centre/report">command centre report</Link>.
      </p>
    </section>
  );
}
