import type { Metadata } from "next";

import { OrganisationEnquiriesPanel } from "@/components/dashboard/OrganisationEnquiriesPanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Organisation Enquiries | Admin",
};

export default function AdminOrganisationEnquiriesPage() {
  return (
    <DashboardShell role="admin" title="Organisation Enquiries">
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Access requests from NHS organisations interested in deploying Aksh Health.
        </p>
        <OrganisationEnquiriesPanel />
      </div>
    </DashboardShell>
  );
}
