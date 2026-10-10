"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AgentBadge } from "@/components/dashboard/AgentBadge";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReviewQueueItem as ReviewQueueItemType, ReviewStatus } from "@/lib/mock-data/types";
import { useReviewerIdentity } from "@/lib/hooks/use-reviewer-identity";
import { describeShieldOutcome, recordShieldEvent } from "@/lib/shield-client";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

function statusBadgeVariant(status: ReviewStatus) {
  switch (status) {
    case "Accepted":
      return "success" as const;
    case "Rejected":
      return "danger" as const;
    case "Edited":
      return "warning" as const;
    default:
      return "warning" as const;
  }
}

function statusLabel(status: ReviewStatus) {
  if (status === "Pending") return "Draft";
  return status;
}

export function ReviewQueueItem({ item }: { item: ReviewQueueItemType }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.editedContent ?? item.content);
  const { acceptReviewItem, rejectReviewItem, editReviewItem } = useDashboardStore();
  const reviewer = useReviewerIdentity();

  const audit = (action: "accept" | "reject" | "edit", detail: string) =>
    recordShieldEvent(
      {
        action,
        label: `${action === "accept" ? "Accepted" : action === "reject" ? "Rejected" : "Edited"} ${item.agentType} draft: ${item.title}`,
        detail,
        agentLabel: item.agentType,
        resourceRef: `${item.id} / ${item.patientName}`,
      },
      { authenticated: reviewer.authenticated }
    );

  const displayContent = item.editedContent ?? item.content;
  const needsApproval = item.status === "Pending" || item.status === "Edited";

  return (
    <Card className="dashboard-card border-border-subtle">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AgentBadge agent={item.agentType} />
          <span className="text-sm font-semibold text-foreground">{item.patientName}</span>
          <Badge
            variant={item.priority === "Urgent" ? "danger" : item.priority === "High" ? "warning" : "outline"}
          >
            {item.priority}
          </Badge>
          <Badge variant={statusBadgeVariant(item.status)} className="ml-auto font-semibold">
            {statusLabel(item.status)}
          </Badge>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.title}</p>
        {editing ? (
          <SOAPEditor
            value={editContent}
            onChange={setEditContent}
            onSave={async () => {
              editReviewItem(item.id, editContent, reviewer.name);
              setEditing(false);
              const outcome = await audit("edit", editContent);
              toast({
                title: "Edit saved",
                description: `${item.patientName}: awaiting re-acceptance before record write · ${describeShieldOutcome(outcome)}.`,
              });
            }}
            onCancel={() => {
              setEditing(false);
              setEditContent(item.editedContent ?? item.content);
            }}
          />
        ) : (
          <p className={cn("rounded-xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground", !expanded && "line-clamp-3")}>
            {displayContent}
          </p>
        )}
        {!editing && (
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <span className="inline-flex items-center gap-1">
                <ChevronUp className="h-3 w-3" /> Collapse
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> Expand
              </span>
            )}
          </button>
        )}
        {item.confidenceScore !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted">
              <span>Confidence</span>
              <span className="text-foreground">{item.confidenceScore}%</span>
            </div>
            <Progress value={item.confidenceScore} className="h-2" aria-label="Confidence score" />
          </div>
        )}
        {item.evidenceSources.length > 0 && (
          <TooltipProvider>
            <p className="text-xs text-muted">
              Based on:{" "}
              {item.evidenceSources.map((e, i) => (
                <Tooltip key={e.resourceId}>
                  <TooltipTrigger asChild>
                    <button type="button" className="font-medium text-primary underline-offset-2 hover:underline">
                      {e.resourceType}/{e.resourceId}
                      {i < item.evidenceSources.length - 1 ? ", " : ""}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{e.summary}</TooltipContent>
                </Tooltip>
              ))}
            </p>
          </TooltipProvider>
        )}
        {needsApproval && !editing && (
          <HitlActions
            status={item.status}
            itemContext={item.patientName}
            onAccept={async () => {
              acceptReviewItem(item.id, reviewer.name);
              const outcome = await audit("accept", displayContent);
              toast({
                title: reviewer.authenticated ? "Accepted · staged via BRIDGE" : "Accepted in demo",
                description: `${item.patientName}: ${describeShieldOutcome(outcome)} · liveEmis:false · sim/staging only.`,
              });
            }}
            onEdit={() => setEditing(true)}
            onReject={async (reason) => {
              rejectReviewItem(item.id, reason, reviewer.name);
              const outcome = await audit("reject", reason || "No reason given");
              toast({
                title: "Rejected",
                description: `${item.patientName}: ${reason || "output rejected"} · ${describeShieldOutcome(outcome)}.`,
              });
            }}
          />
        )}
        {item.status === "Accepted" && (
          <HitlActions
            status="Accepted"
            acceptedAt={item.acceptedAt}
            acceptedBy={item.acceptedBy}
            onAccept={() => {}}
            onEdit={() => {}}
            onReject={() => {}}
          />
        )}
        {item.status === "Rejected" && (
          <HitlActions
            status="Rejected"
            rejectionReason={item.rejectionReason}
            onAccept={() => {}}
            onEdit={() => {}}
            onReject={() => {}}
          />
        )}
      </CardContent>
    </Card>
  );
}
