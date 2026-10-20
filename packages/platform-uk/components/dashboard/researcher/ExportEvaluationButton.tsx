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

      try {
        await fetch("/api/audit/shield", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "exported", subject: "evaluation", action: "export", agent: "SHIELD", note: filename, resourceRef: `research-evaluation/${orgSlug}` })
        });
      } catch {
        // Download still succeeded even if audit write failed.
      }

      toast({
        title: "Evaluation export downloaded",
        description: `${filename} · SHIELD export logged when durable audit is available`
      });
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
      onClick={() => void handleExport()}
      size="sm"
    >
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting…" : "Export evaluation JSON"}
    </Button>
  );
}
