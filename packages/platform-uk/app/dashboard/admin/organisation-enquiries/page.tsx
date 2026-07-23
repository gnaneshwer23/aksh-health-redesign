import type { Metadata } from "next";
import Link from "next/link";

import { AdminHeroDemoPath } from "@/components/dashboard/admin/AdminHeroDemoPath";
import { OrganisationEnquiriesPanel } from "@/components/dashboard/OrganisationEnquiriesPanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Organisation Enquiries | Admin",
};

export default function AdminOrganisationEnquiriesPage() {
  return (
    <DashboardShell role="admin" title="Organisation Enquiries">
      <div className="space-y-6 p-4">
        <AdminHeroDemoPath />
        <p className="text-sm text-muted">
          Access requests from NHS organisations interested in deploying Aksh Health. Staff invites
          live under{" "}
          <Link
            href="/dashboard/admin/users"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            User Management
          </Link>
          . Ops oversight only — clinicians keep clinical Accept · liveEmis:false.
        </p>
        <OrganisationEnquiriesPanel />
      </div>
    </DashboardShell>
  );
}
