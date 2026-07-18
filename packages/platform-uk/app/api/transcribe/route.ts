import { NextResponse } from "next/server";

import { buildTranscriptionDependencyStatus, resolveTranscriptionMode, transcribeAudioBlob } from "@/lib/transcription-config";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const mode = await resolveTranscriptionMode();
  return NextResponse.json({
    ...buildTranscriptionDependencyStatus(),
    resolvedMode: mode
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  try {
    const mode = await resolveTranscriptionMode();
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (mode === "deepgram") {
      if (!audioFile) {
        return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
      }

      const result = await transcribeAudioBlob(audioFile);
      return NextResponse.json({
        transcript: result.transcript,
        mode: result.mode,
        simulated: result.mode === "simulated",
        notice:
          result.mode === "simulated"
            ? "Simulated transcript — set DEEPGRAM_API_KEY for live speech-to-text."
            : "Live Deepgram transcript — clinician must still verify before save.",
        dependencyStatus: result.dependencyStatus
      });
    }

    const result = await transcribeAudioBlob(audioFile ?? new Blob());
    return NextResponse.json({
      transcript: result.transcript,
      mode: result.mode,
      simulated: true,
      notice: "Simulated transcript — set DEEPGRAM_API_KEY for live speech-to-text.",
      dependencyStatus: result.dependencyStatus
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        mode: "integration_rehearsal_failed"
      },
      { status: 500 }
    );
  }
}
