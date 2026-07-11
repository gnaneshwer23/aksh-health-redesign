"use client";

import { useState, useRef } from "react";

export function AudioRecorder({
  onTranscriptionComplete
}: {
  onTranscriptionComplete: (transcript: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (response.status === 401) {
            throw new Error("sign_in_required");
          }

          if (!response.ok) throw new Error("transcription_failed");
          
          const data = await response.json();
          if (data.transcript) {
            onTranscriptionComplete(data.transcript);
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
          if (error instanceof Error && error.message === "sign_in_required") {
            alert("Sign in is required for live transcription.");
          } else {
            alert("Failed to transcribe audio. Check microphone access, sign in, and configure DEEPGRAM_API_KEY for live transcription.");
          }
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none", marginTop: "1rem" }}>
      <div className="row" style={{ alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Voice Intake</h3>
          <p style={{ margin: 0, fontSize: "0.9em", color: "var(--ink-light)" }}>Record live consultation audio (Deepgram ASR)</p>
        </div>
        <button 
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`button ${isRecording ? "danger" : "primary"}`}
          style={{ padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {isRecording ? (
            <>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "white", animation: "pulse 1.5s infinite" }}></span>
              Stop Recording
            </>
          ) : isProcessing ? (
            "Transcribing..."
          ) : (
            "Start Recording"
          )}
        </button>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
