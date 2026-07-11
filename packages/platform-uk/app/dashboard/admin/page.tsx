"use client";

import { useState } from "react";
import Link from "next/link";

import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { PilotApplicationsPanel } from "@/components/dashboard/PilotApplicationsPanel";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { adminUsers as initialUsers, countAwaitingApproval } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function AdminDashboardPage() {
  const { adminUsers, inviteUser, updateUserStatus } = useDashboardStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "GP" });
  const users = [...initialUsers, ...adminUsers];

  return (
    <DashboardShell role="admin" title="Practice Manager">
      <div className="overflow-y-auto p-4 space-y-6">
        <ConsentBanner />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Total Users" value="12" sparkline={[10, 11, 11, 12, 12, 12, 12]} />
          <MetricCard label="Last Extraction" value="00:00 UTC ✓" trend="up" />
          <MetricCard label="FHIR Bundles Today" value="847" sparkline={[800, 820, 830, 840, 845, 847, 847]} />
          <MetricCard label="Open GUARDIAN Alerts" value="3" trend="down" />
          <MetricCard label="DCB0129 Status" value="Active" />
          <MetricCard label="Care Pathways" value={`4 / ${countAwaitingApproval()} pending`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <IntegrationStatus />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle className="text-sm">Audit Log</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Export initiated", description: "File ready in 2 minutes" })}>Export Full Audit Log</Button>
            </CardHeader>
            <CardContent><AuditLogTable limit={10} /></CardContent>
          </Card>
        </div>

        <PilotApplicationsPanel />

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-base">User Management</CardTitle>
            <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>MFA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.status}</TableCell>
                    <TableCell>{u.lastActive}</TableCell>
                    <TableCell>{u.mfa ? "✓" : "—"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => updateUserStatus(u.id, u.status === "Active" ? "Deactivated" : "Active")}>
                        {u.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted">
          <Link href="/dashboard/gp/review-queue" className="text-primary hover:underline">3 open GUARDIAN alerts → GP review queue</Link>
        </p>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
            <Select value={inviteForm.role} onValueChange={(r) => setInviteForm({ ...inviteForm, role: r })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["GP", "Nurse", "Pharmacist", "Admin", "ICS Lead", "Hospital Ops", "Patient", "Regional Lead"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="accent" className="w-full" onClick={() => {
              inviteUser({ ...inviteForm, status: "Invited", mfa: false });
              toast({ title: "Invite sent", description: inviteForm.email });
              setInviteOpen(false);
            }}>Send Invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
