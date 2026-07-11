"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UserManagementPanel } from "@/components/dashboard/UserManagementPanel";

export default function AdminUsersPage() {
  return (
    <DashboardShell role="admin" title="User Management">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <UserManagementPanel />
      </div>
    </DashboardShell>
  );
}
