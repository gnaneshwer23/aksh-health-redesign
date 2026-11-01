"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HcpFacilitatorSessionPanel } from "@/components/dashboard/hcp-eval/HcpFacilitatorSessionPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/**
 * Milestone C1 — clinician/facilitator path for synthetic HCP case-pack sessions.
 * Capture Accept/Edit/Reject + rubrics without curl/JSON.
 */
export default function GpHcpEvalSessionPage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell
      role="gp"
      title="HCP eval session"
      organisation={profile?.organisation}
      honesty={{ surface: "HCP facilitator session (synthetic)" }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted" data-testid="hcp-session-page-intro">
          Facilitator-led synthetic evaluation only. Load the Milestone B case pack, brief the case, then capture
          Accept/Edit/Reject with rubric scores. This is not clinical validation and never writes to a live EHR.
        </p>
        <HcpFacilitatorSessionPanel />
      </div>
    </DashboardShell>
  );
}
