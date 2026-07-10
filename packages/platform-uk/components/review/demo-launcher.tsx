"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoLauncher({
  caseId,
  label,
  mode = "case",
  demoMode = false,
  recordingMode = false,
  onReset
}: {
  caseId: string;
  label: string;
  mode?: "case" | "evidence";
  demoMode?: boolean;
  recordingMode?: boolean;
  onReset: () => Promise<void>;
}) {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  async function handleLaunch() {
    setIsLaunching(true);

    try {
      await onReset();
      router.push(
        mode === "evidence"
          ? `/cases/${caseId}/evidence${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
          : `/cases/${caseId}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
      );
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <button className="button secondary" disabled={isLaunching} onClick={() => void handleLaunch()} type="button">
      {isLaunching ? "Preparing..." : label}
    </button>
  );
}
