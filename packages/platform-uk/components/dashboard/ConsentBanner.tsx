"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function ConsentBanner({ className }: { className?: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("aksh-consent-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 rounded-sm bg-accent/15 border border-accent/30 px-3 py-2 text-xs text-secondary",
        className
      )}
      role="status"
      aria-label="Human-in-the-loop reminder"
    >
      <p>AI assistance active. Capture → draft → approve — all outputs require your decision before the record.</p>
      <button
        type="button"
        aria-label="Dismiss consent banner"
        className="shrink-0 rounded-sm p-0.5 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => {
          sessionStorage.setItem("aksh-consent-dismissed", "1");
          setDismissed(true);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
