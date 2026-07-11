"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SOAPEditor({
  value,
  onChange,
  onSave,
  onCancel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <textarea
        aria-label="Edit AI output"
        className="min-h-[120px] w-full rounded-sm border border-border bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="accent" onClick={onSave}>Save edit</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function HitlActions({
  status,
  acceptedAt,
  acceptedBy,
  rejectionReason,
  onAccept,
  onEdit,
  onReject,
  onDismiss,
  disabled,
  variant = "review",
}: {
  status: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  rejectionReason?: string | null;
  onAccept: () => void;
  onEdit: () => void;
  onReject: (reason: string) => void;
  onDismiss?: () => void;
  disabled?: boolean;
  variant?: "review" | "command";
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "Accepted") {
    return (
      <p className="text-xs text-accent font-medium">
        Written to Record · {acceptedBy} · {acceptedAt ? new Date(acceptedAt).toLocaleString("en-GB") : ""}
      </p>
    );
  }

  if (status === "Rejected") {
    return <p className="text-xs text-danger font-medium">Rejected — {rejectionReason || "No reason provided"}</p>;
  }

  if (status === "Edited") {
    return (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-warning font-semibold">Edited — re-acceptance required</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="accent" onClick={onAccept} disabled={disabled} aria-label="Accept edited AI output">
            Accept
          </Button>
          <Button size="sm" variant="outline" className="border-primary text-primary" onClick={onEdit} disabled={disabled} aria-label="Edit AI output again">
            Edit
          </Button>
          <Button size="sm" variant="outline" className="border-danger text-danger hover:bg-danger/5" onClick={() => setRejecting(true)} disabled={disabled} aria-label="Reject AI output">
            Reject
          </Button>
        </div>
      </div>
    );
  }

  if (status === "Dismissed") {
    return <p className="text-xs text-muted font-medium">Dismissed — not actioned</p>;
  }

  if (rejecting) {
    return (
      <div className="space-y-2">
        <input
          aria-label="Rejection reason"
          className="w-full rounded-sm border border-border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Reason for rejection (optional but encouraged)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-danger text-danger hover:bg-danger/5" onClick={() => { onReject(reason.trim()); setRejecting(false); setReason(""); }}>
            Confirm reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setRejecting(false); setReason(""); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (variant === "command") {
    return (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-warning font-semibold">Draft — not in record</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="accent" onClick={onAccept} disabled={disabled} aria-label="Accept recommendation">
            Accept
          </Button>
          <Button size="sm" variant="outline" className="border-danger text-danger hover:bg-danger/5" onClick={onDismiss} disabled={disabled} aria-label="Dismiss recommendation">
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wide text-warning font-semibold">Draft — not in record</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="accent" onClick={onAccept} disabled={disabled} aria-label="Accept AI output">Accept</Button>
        <Button size="sm" variant="outline" className="border-primary text-primary" onClick={onEdit} disabled={disabled} aria-label="Edit AI output">Edit</Button>
        <Button size="sm" variant="outline" className="border-danger text-danger hover:bg-danger/5" onClick={() => setRejecting(true)} disabled={disabled} aria-label="Reject AI output">Reject</Button>
      </div>
    </div>
  );
}
