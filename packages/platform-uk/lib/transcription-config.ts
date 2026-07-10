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
  const { createClient } = await import(/* webpackIgnore: true */ "@deepgram/sdk");
  const deepgram = createClient(deepgramApiKey);
  const buffer = Buffer.from(await audioFile.arrayBuffer());
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(buffer, {
    model: "nova-2",
    language: "en-GB",
    smart_format: true
  });

  if (error) {
    throw error;
  }

  return {
    mode,
    transcript: result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "",
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
      "@deepgram/sdk is optional and not installed by default; the transcribe route uses simulated output until both the SDK and DEEPGRAM_API_KEY are present.",
    defaultMode: "simulated"
  };
}
