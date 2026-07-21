"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type AsrMode = "simulated" | "deepgram" | "unknown";

export function VoiceRecorder({
  className,
  onRecordingComplete,
  onTranscript,
}: {
  className?: string;
  onRecordingComplete?: () => void;
  onTranscript?: (
    transcript: string,
    meta?: { simulated?: boolean; mode?: string }
  ) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [asrMode, setAsrMode] = useState<AsrMode>("unknown");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/transcribe", { credentials: "include" });
        if (!response.ok || cancelled) {
          if (!cancelled && response.status === 401) {
            // Unauthenticated: still assume simulated rehearsal until live key is confirmed.
            setAsrMode("simulated");
          }
          return;
        }
        const data = (await response.json()) as {
          resolvedMode?: string;
          deepgramApiKeyConfigured?: boolean;
        };
        if (cancelled) return;
        if (data.resolvedMode === "deepgram" || data.deepgramApiKeyConfigured === true) {
          setAsrMode("deepgram");
        } else {
          setAsrMode("simulated");
        }
      } catch {
        if (!cancelled) setAsrMode("simulated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setProcessing(true);
        stopStream();

        const formData = new FormData();
        formData.append("audio", new Blob(chunksRef.current, { type: "audio/webm" }));

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (response.status === 401) {
            throw new Error("sign_in_required");
          }

          if (!response.ok) {
            throw new Error("transcription_failed");
          }

          const data = (await response.json()) as {
            transcript?: string;
            simulated?: boolean;
            notice?: string;
            mode?: string;
          };
          const simulated = Boolean(data.simulated || data.mode === "simulated");
          setAsrMode(simulated ? "simulated" : "deepgram");
          if (data.transcript) {
            onTranscript?.(data.transcript, {
              simulated,
              mode: typeof data.mode === "string" ? data.mode : undefined
            });
          }
          onRecordingComplete?.();
          if (simulated) {
            toast({
              title: "Simulated transcript",
              description:
                data.notice ??
                "Deepgram is not configured. Values are for rehearsal — verify before save.",
            });
          } else {
            toast({
              title: "Live transcript ready",
              description: data.notice ?? "Verify the transcript before saving clinical data.",
            });
          }
        } catch (error) {
          console.error("Voice transcription failed:", error);
          if (error instanceof Error && error.message === "sign_in_required") {
            toast({
              title: "Sign in required",
              description: "Voice transcription requires an authenticated session.",
            });
          } else {
            toast({
              title: "Transcription failed",
              description:
                "Check microphone access. Without DEEPGRAM_API_KEY the route uses a labelled simulated transcript.",
            });
          }
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
      toast({
        title: "Microphone unavailable",
        description: "Allow microphone access in your browser and try again.",
      });
      stopStream();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (processing) return;
    if (recording) {
      stopRecording();
      return;
    }
    void startRecording();
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {asrMode === "simulated" ? (
        <p
          role="status"
          data-testid="voice-simulated-asr-banner"
          className="w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-950"
        >
          <strong>Simulated ASR</strong> — <code className="text-[10px]">DEEPGRAM_API_KEY</code> not
          configured locally. Dictation returns a labelled rehearsal transcript, not live speech-to-text.
        </p>
      ) : null}
      {asrMode === "deepgram" ? (
        <p
          role="status"
          data-testid="voice-live-asr-banner"
          className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-950"
        >
          <strong>Live Deepgram ASR</strong> — clinician must still verify before save. Not an EHR write.
        </p>
      ) : null}
      <Button
        type="button"
        aria-label={recording ? "Stop dictation" : "Start dictation"}
        className={cn("h-14 w-14 rounded-full", recording ? "bg-danger" : "bg-secondary")}
        onClick={toggleRecording}
        disabled={processing}
      >
        {recording ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
      </Button>
      <p className="text-xs text-muted">
        {processing
          ? "Transcribing consultation audio..."
          : recording
            ? "Recording. Click to stop and transcribe."
            : "Click to start dictation"}
      </p>
    </div>
  );
}
