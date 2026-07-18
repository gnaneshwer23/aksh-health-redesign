const PLACEHOLDER_DEEPGRAM_KEYS = new Set(["", "your_deepgram_api_key_here"]);

export type TranscriptionMode = "simulated" | "deepgram";

export function isDeepgramApiKeyConfigured() {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
  return Boolean(apiKey && !PLACEHOLDER_DEEPGRAM_KEYS.has(apiKey));
}

export async function isDeepgramSdkAvailable() {
  try {
    await import(/* webpackIgnore: true */ "@deepgram/sdk");
    return true;
  } catch {
    return false;
  }
}

export async function resolveTranscriptionMode(): Promise<TranscriptionMode> {
  if (!isDeepgramApiKeyConfigured()) {
    return "simulated";
  }

  return (await isDeepgramSdkAvailable()) ? "deepgram" : "simulated";
}

export function getSimulatedTranscript() {
  return "Patient presents with a severe cough and a mild fever. I suspect an upper respiratory tract infection. I will prescribe Amoxicillin 500mg three times a day.";
}

export async function transcribeAudioBlob(audioFile: Blob) {
  const mode = await resolveTranscriptionMode();

  if (mode === "simulated") {
    return {
      mode,
      transcript: getSimulatedTranscript(),
      dependencyStatus: {
        deepgramApiKeyConfigured: isDeepgramApiKeyConfigured(),
        deepgramSdkInstalled: await isDeepgramSdkAvailable()
      }
    };
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY?.trim() ?? "";
  const { DeepgramClient } = await import(/* webpackIgnore: true */ "@deepgram/sdk");
  const deepgram = new DeepgramClient({ apiKey: deepgramApiKey });
  const buffer = Buffer.from(await audioFile.arrayBuffer());
  const result = await deepgram.listen.v1.media.transcribeFile(buffer, {
    model: "nova-2",
    language: "en-GB",
    smart_format: true
  });

  const transcript =
    "results" in result
      ? result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
      : "";

  return {
    mode,
    transcript,
    dependencyStatus: {
      deepgramApiKeyConfigured: true,
      deepgramSdkInstalled: true
    }
  };
}

export function buildTranscriptionDependencyStatus() {
  return {
    artifactType: "aksh-uk-eu-transcription-dependency-status",
    deepgramApiKeyConfigured: isDeepgramApiKeyConfigured(),
    packageAlignmentNote:
      "@deepgram/sdk is installed when available. Without DEEPGRAM_API_KEY the route returns a clearly labelled simulated transcript.",
    defaultMode: "simulated" as const,
    liveModeRequires: ["DEEPGRAM_API_KEY"],
    userFacingSimulatedMessage:
      "Simulated transcript (Deepgram not configured). Values are for rehearsal only — verify before save."
  };
}
