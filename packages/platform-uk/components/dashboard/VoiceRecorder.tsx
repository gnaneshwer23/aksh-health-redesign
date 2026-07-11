"use client";

import { Mic, Square } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function VoiceRecorder({
  className,
  onRecordingComplete,
  onTranscript,
}: {
  className?: string;
  onRecordingComplete?: () => void;
  onTranscript?: (transcript: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

          const data = (await response.json()) as { transcript?: string };
          if (data.transcript) {
            onTranscript?.(data.transcript);
          }
          onRecordingComplete?.();
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
              description: "Check microphone access and that DEEPGRAM_API_KEY is configured in production.",
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
