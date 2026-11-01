"use client";

import Link from "next/link";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HcpFacilitatorSessionPanel } from "@/components/dashboard/hcp-eval/HcpFacilitatorSessionPanel";
import { HCP_FACILITATOR_SESSION_PATH } from "@/lib/eval/hcp-facilitator-session";

/**
 * Milestone C1 — admin/ops discoverability for the same facilitator session UI.
 * Feedback POST still requires a clinical reviewer AppRole at the API.
 */
export default function AdminHcpEvalSessionPage() {
  return (
    <DashboardShell role="admin" title="HCP eval session" honesty={{ surface: "HCP facilitator session (synthetic)" }}>
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted" data-testid="hcp-session-admin-intro">
          Same synthetic facilitator UI as the GP path (
          <Link href={HCP_FACILITATOR_SESSION_PATH} className="underline text-primary">
            {HCP_FACILITATOR_SESSION_PATH}
          </Link>
          ). Case pack is readable for Agent Ops roles; submitting scores requires a clinical reviewer mapping.
          Aggregates stay on{" "}
          <Link href="/dashboard/admin/agent-ops" className="underline text-primary">
            Agent Ops
          </Link>
          .
        </p>
        <HcpFacilitatorSessionPanel />
      </div>
    </DashboardShell>
  );
}
