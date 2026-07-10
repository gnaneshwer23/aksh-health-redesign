"use client";

import { Mic, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceRecorder({ className }: { className?: string }) {
  const [recording, setRecording] = useState(false);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Button
        type="button"
        aria-label={recording ? "Stop dictation" : "Start dictation"}
        className={cn("h-14 w-14 rounded-full", recording ? "bg-danger" : "bg-primary")}
        onClick={() => setRecording(!recording)}
      >
        {recording ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
      </Button>
      <p className="text-xs text-muted">{recording ? "Recording… (mock)" : "Click to start dictation"}</p>
    </div>
  );
}
