"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { toOrgSlug } from "@/lib/profile/personalization";

export function ExportEvaluationButton() {
  const [exporting, setExporting] = useState(false);
  const { profile } = useUserProfile();
  const orgSlug = toOrgSlug(profile?.organisation);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/research/evaluation", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `${orgSlug}-research-evaluation-boundary.json`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({ title: "Evaluation export downloaded", description: filename });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast({ title: "Export failed", description: message });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      className="bg-[#E67E22] hover:bg-[#E67E22]/90"
      disabled={exporting}
      onClick={handleExport}
      size="sm"
    >
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting…" : "Export evaluation JSON"}
    </Button>
  );
}
