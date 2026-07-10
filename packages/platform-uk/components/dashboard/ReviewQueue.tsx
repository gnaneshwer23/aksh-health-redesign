"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AgentBadge } from "@/components/dashboard/AgentBadge";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CURRENT_GP } from "@/lib/mock-data";
import type { ReviewQueueItem } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

function ReviewQueueItemCard({ item }: { item: ReviewQueueItem }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const { acceptReviewItem, rejectReviewItem, editReviewItem } = useDashboardStore();

  const displayContent = item.editedContent ?? item.content;
  const isPending = item.status === "Pending" || item.status === "Edited";

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <AgentBadge agent={item.agentType} />
          <span className="text-sm font-medium">{item.patientName}</span>
          <Badge variant="outline" className={cn(item.priority === "Urgent" && "border-danger text-danger", item.priority === "High" && "border-warning text-warning")}>
            {item.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted font-medium">{item.title}</p>
        {editing ? (
          <SOAPEditor
            value={editContent}
            onChange={setEditContent}
            onSave={() => { editReviewItem(item.id, editContent, CURRENT_GP); setEditing(false); }}
            onCancel={() => { setEditing(false); setEditContent(item.content); }}
          />
        ) : (
          <p className={cn("text-sm whitespace-pre-line", !expanded && "line-clamp-3")}>{displayContent}</p>
        )}
        {!editing && (
          <button type="button" className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setExpanded(!expanded)}>
            {expanded ? <span className="inline-flex items-center gap-1"><ChevronUp className="h-3 w-3" /> Collapse</span> : <span className="inline-flex items-center gap-1"><ChevronDown className="h-3 w-3" /> Expand</span>}
          </button>
        )}
        {item.confidenceScore !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Confidence</span><span>{item.confidenceScore}%</span></div>
            <Progress value={item.confidenceScore} />
          </div>
        )}
        {item.evidenceSources.length > 0 && (
          <TooltipProvider>
            <p className="text-xs text-muted">
              Based on:{" "}
              {item.evidenceSources.map((e, i) => (
                <Tooltip key={e.resourceId}>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-primary underline-offset-2 hover:underline">{e.resourceType}/{e.resourceId}{i < item.evidenceSources.length - 1 ? ", " : ""}</button>
                  </TooltipTrigger>
                  <TooltipContent>{e.summary}</TooltipContent>
                </Tooltip>
              ))}
            </p>
          </TooltipProvider>
        )}
        {isPending && !editing && (
          <HitlActions
            status={item.status}
            onAccept={() => acceptReviewItem(item.id, CURRENT_GP)}
            onEdit={() => setEditing(true)}
            onReject={(reason) => rejectReviewItem(item.id, reason, CURRENT_GP)}
          />
        )}
        {item.status === "Accepted" && (
          <HitlActions status="Accepted" acceptedAt={item.acceptedAt} acceptedBy={item.acceptedBy} onAccept={() => {}} onEdit={() => {}} onReject={() => {}} />
        )}
        {item.status === "Rejected" && (
          <HitlActions status="Rejected" rejectionReason={item.rejectionReason} onAccept={() => {}} onEdit={() => {}} onReject={() => {}} />
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewQueue({ patientId, showAll }: { patientId?: string | null; showAll?: boolean }) {
  const items = useDashboardStore((s) => s.reviewQueueItems);
  const filtered = showAll || !patientId ? items : items.filter((i) => i.patientId === patientId);
  const pending = filtered.filter((i) => i.status === "Pending" || i.status === "Edited").length;

  return (
    <section aria-label="AI Review Queue">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold">AI Review Queue</h2>
        {pending > 0 && <Badge className="bg-danger text-white">{pending} pending</Badge>}
      </div>
      <div className="space-y-3">
        {filtered.map((item) => <ReviewQueueItemCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export { ReviewQueueItemCard as ReviewQueueItem };
