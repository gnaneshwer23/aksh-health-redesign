"use client";

import { useState } from "react";

import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

const HANDOVER_DRAFT = `Night shift handover, Ward 3A
3 patients with elevated ORACLE scores. Mrs Johnson (P001): breathlessness reported via Voice Care Agent, requires same-day review. Mr Green (P008) | polypharmacy alert pending pharmacist review. All vital signs documented. 2 EQUITY flags raised for review.`;

export function HandoverPanel({ autoOpen = false }: { autoOpen?: boolean }) {
  const { addAuditEvent } = useDashboardStore();
  const [handoverOpen, setHandoverOpen] = useState(autoOpen);
  const [handoverAccepted, setHandoverAccepted] = useState(false);
  const [handoverEditing, setHandoverEditing] = useState(false);
  const [handoverContent, setHandoverContent] = useState(HANDOVER_DRAFT);
  const [handoverEdited, setHandoverEdited] = useState(false);

  return (
    <>
      <Card className="border-secondary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-secondary">Shift Handover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Generate an AI handover summary for the incoming shift. Review and approve before sharing. Nothing is sent
            without explicit nurse sign-off.
          </p>
          <Button className="bg-secondary hover:bg-secondary/90" onClick={() => setHandoverOpen(true)}>
            Generate Handover Summary
          </Button>
        </CardContent>
      </Card>

      <Dialog open={handoverOpen} onOpenChange={setHandoverOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              AI Handover Summary: 
              {handoverAccepted ? "Shared" : handoverEdited ? "Edited: re-acceptance required" : "Draft: not sent"}
            </DialogTitle>
          </DialogHeader>
          {handoverEditing ? (
            <SOAPEditor
              value={handoverContent}
              onChange={setHandoverContent}
              onSave={() => {
                setHandoverEditing(false);
                setHandoverEdited(true);
                setHandoverAccepted(false);
                addAuditEvent({
                  user: "Nurse Davies",
                  agent: "SYNTHESIS",
                  action: "Edited handover summary",
                  resource: "Night shift",
                });
              }}
              onCancel={() => {
                setHandoverEditing(false);
                setHandoverContent(HANDOVER_DRAFT);
              }}
            />
          ) : (
            <p className="whitespace-pre-line text-sm">{handoverContent}</p>
          )}
          {!handoverAccepted && !handoverEditing ? (
            <HitlActions
              status={handoverEdited ? "Edited" : "Pending"}
              onAccept={() => {
                setHandoverAccepted(true);
                setHandoverEdited(false);
                addAuditEvent({
                  user: "Nurse Davies",
                  agent: "SYNTHESIS",
                  action: "Approved handover summary",
                  resource: "Night shift",
                });
                toast({ title: "Handover shared" });
              }}
              onEdit={() => setHandoverEditing(true)}
              onReject={(reason) => {
                addAuditEvent({
                  user: "Nurse Davies",
                  agent: "SYNTHESIS",
                  action: `Rejected handover | ${reason || "No reason provided"}`,
                  resource: "Night shift",
                });
                setHandoverOpen(false);
              }}
            />
          ) : handoverAccepted ? (
            <p className="text-xs text-accent">Shared at {new Date().toLocaleTimeString("en-GB")}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
