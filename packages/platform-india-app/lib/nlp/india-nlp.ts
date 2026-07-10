/** Indic NLP pipeline interfaces — Phase 0 stubs for V-IN1 harness. */

export type IndicLanguage = "hi" | "ta" | "te" | "bn" | "kn" | "en";

export type NerEntity = {
  text: string;
  label: "SYMPTOM" | "MEDICATION" | "CONDITION" | "VITAL" | "ALLERGY";
  start: number;
  end: number;
  confidence: number;
};

export type NerResult = {
  language: IndicLanguage;
  entities: NerEntity[];
  model: string;
};

export type AsrResult = {
  language: IndicLanguage;
  transcript: string;
  werEstimate?: number;
  provider: "azure-speech" | "deepgram" | "stub";
};

export interface IndicBertNerService {
  extractEntities(text: string, language: IndicLanguage): Promise<NerResult>;
}

export interface SpeechToTextService {
  transcribe(audioUri: string, language: IndicLanguage): Promise<AsrResult>;
}

/** Stub IndicBERT NER — deterministic keyword patterns for Phase 0 demos. */
export function createStubIndicBertNer(): IndicBertNerService {
  return {
    async extractEntities(text, language) {
      const entities: NerEntity[] = [];
      const lower = text.toLowerCase();

      for (const [label, terms] of [
        ["SYMPTOM", ["खांसी", "cough", "बुखार", "fever"]] as const,
        ["MEDICATION", ["amoxicillin", "doxycycline", "amlodipine"]] as const,
        ["ALLERGY", ["penicillin", "पेनिसिलिन"]] as const
      ]) {
        for (const term of terms) {
          const idx = lower.indexOf(term.toLowerCase());
          if (idx >= 0) {
            entities.push({
              text: text.slice(idx, idx + term.length),
              label,
              start: idx,
              end: idx + term.length,
              confidence: 0.75
            });
          }
        }
      }

      return { language, entities, model: "indicbert-stub-v0" };
    }
  };
}

/** Stub Azure Speech wrapper — returns input unchanged for text-only Phase 0. */
export function createStubAzureSpeech(): SpeechToTextService {
  return {
    async transcribe(_audioUri, language) {
      return {
        language,
        transcript: "",
        provider: "stub",
        werEstimate: undefined
      };
    }
  };
}

export type Vin1Case = {
  id: string;
  language: IndicLanguage;
  text: string;
  expectedLabels: NerEntity["label"][];
};

export type Vin1EvalResult = {
  caseId: string;
  f1: number;
  passed: boolean;
};

/** V-IN1 harness skeleton — wire gold set in Phase 1. */
export function runVin1EvalHarness(
  cases: Vin1Case[],
  ner: IndicBertNerService,
  f1Threshold = 0.82
): Promise<Vin1EvalResult[]> {
  return Promise.all(
    cases.map(async (testCase) => {
      const result = await ner.extractEntities(testCase.text, testCase.language);
      const predicted = new Set(result.entities.map((e) => e.label));
      const expected = new Set(testCase.expectedLabels);
      let tp = 0;
      for (const label of expected) {
        if (predicted.has(label)) tp += 1;
      }
      const precision = predicted.size ? tp / predicted.size : 0;
      const recall = expected.size ? tp / expected.size : 0;
      const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

      return { caseId: testCase.id, f1, passed: f1 >= f1Threshold };
    })
  );
}
