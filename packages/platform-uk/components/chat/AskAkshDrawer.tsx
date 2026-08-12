"use client";

import { MessageCircle } from "lucide-react";
import { useId, useState } from "react";

import { AskAkshPanel } from "@/components/chat/AskAkshPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { PatientChatAudience } from "@/lib/chat/patient-access";
import { cn } from "@/lib/utils";

export type AskAkshDrawerProps = {
  patientId: string | null;
  patientLabel?: string | null;
  audience?: PatientChatAudience;
  triggerClassName?: string;
  triggerTestId?: string;
  drawerTestId?: string;
};

/**
 * Right-side Ask Aksh drawer for clinical dashboards (GP / nurse / pharmacist).
 * Empty state when no patient is selected.
 */
export function AskAkshDrawer({
  patientId,
  patientLabel,
  audience = "clinician",
  triggerClassName,
  triggerTestId = "ask-aksh-drawer-trigger",
  drawerTestId = "ask-aksh-drawer",
}: AskAkshDrawerProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn("h-8 shrink-0 gap-1.5 rounded-full text-xs", triggerClassName)}
        data-testid={triggerTestId}
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Ask Aksh
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
          data-testid={drawerTestId}
          aria-labelledby={titleId}
        >
          <AskAkshPanel
            patientId={patientId}
            patientLabel={patientLabel}
            audience={audience}
            headingId={titleId}
            className="h-full"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
