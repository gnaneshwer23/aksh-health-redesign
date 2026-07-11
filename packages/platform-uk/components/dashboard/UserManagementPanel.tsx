"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { adminUsers as initialUsers } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function UserManagementPanel({ embedded = false }: { embedded?: boolean }) {
  const { adminUsers, inviteUser, updateUserStatus } = useDashboardStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "GP" });
  const users = [...initialUsers, ...adminUsers];

  const table = (
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateUserStatus(u.id, u.status === "Active" ? "Deactivated" : "Active")}
              >
                {u.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const inviteDialog = (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={inviteForm.name}
            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          />
          <Select value={inviteForm.role} onValueChange={(r) => setInviteForm({ ...inviteForm, role: r })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GP", "Nurse", "Pharmacist", "Admin", "ICS Lead", "Hospital Ops", "Patient", "Regional Lead"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="accent"
            className="w-full"
            onClick={() => {
              inviteUser({ ...inviteForm, status: "Invited", mfa: false });
              toast({ title: "Invite sent", description: inviteForm.email });
              setInviteOpen(false);
            }}
          >
            Send Invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (embedded) {
    return (
      <>
        <div className="mb-3 flex justify-end">
          <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
        </div>
        {table}
        {inviteDialog}
      </>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">User Management</CardTitle>
          <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
        </CardHeader>
        <CardContent>{table}</CardContent>
      </Card>
      {inviteDialog}
    </>
  );
}
