import type { FhirBundleDraft } from "./types";

export type FastApiSynthesisResponse = {
  fhir_draft?: FhirBundleDraft;
  extracted_summary?: string;
  safety_flags?: string[];
};

export type FastApiSynthesisValidationResult =
  | { ok: true; data: FastApiSynthesisResponse }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFhirBundleDraft(value: unknown): value is FhirBundleDraft {
  if (!isRecord(value)) return false;
  if (!isRecord(value.encounter) || !isRecord(value.condition)) return false;
  if (typeof value.encounter.reason !== "string" || typeof value.condition.codeText !== "string") {
    return false;
  }
  return true;
}

export function validateFastApiSynthesisResponse(payload: unknown): FastApiSynthesisValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, errors: ["FastAPI synthesis response must be a JSON object."] };
  }

  const errors: string[] = [];

  if (payload.fhir_draft !== undefined && !isFhirBundleDraft(payload.fhir_draft)) {
    errors.push("fhir_draft must include encounter.reason and condition.codeText when provided.");
  }

  if (payload.extracted_summary !== undefined && typeof payload.extracted_summary !== "string") {
    errors.push("extracted_summary must be a string when provided.");
  }

  if (payload.safety_flags !== undefined) {
    if (!Array.isArray(payload.safety_flags) || payload.safety_flags.some((item) => typeof item !== "string")) {
      errors.push("safety_flags must be an array of strings when provided.");
    }
  }

  if (!payload.fhir_draft && !payload.extracted_summary && !payload.safety_flags) {
    errors.push("FastAPI synthesis response must include fhir_draft, extracted_summary, or safety_flags.");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      fhir_draft: payload.fhir_draft as FhirBundleDraft | undefined,
      extracted_summary: payload.extracted_summary as string | undefined,
      safety_flags: payload.safety_flags as string[] | undefined
    }
  };
}

export function getFastApiSynthesisUrl() {
  return process.env.FASTAPI_SYNTHESIS_URL ?? "http://localhost:8000/api/v1/synthesis";
}

export async function requestFastApiSynthesis(input: {
  transcript: string;
  sourceType: string;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(getFastApiSynthesisUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: input.transcript,
      source_type: input.sourceType
    })
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: `FastAPI synthesis returned HTTP ${response.status}.`
    };
  }

  const payload = await response.json();
  const validation = validateFastApiSynthesisResponse(payload);
  if (!validation.ok) {
    return {
      ok: false as const,
      status: 502,
      error: validation.errors.join(" ")
    };
  }

  return {
    ok: true as const,
    data: validation.data
  };
}
