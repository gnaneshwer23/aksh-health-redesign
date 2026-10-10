import type { PatientReportedObservation } from "./types";

/**
 * Asha health capture: turns what a patient says into patient-reported, unverified observation
 * drafts (hazard H-ACC-4). Deterministic parsing only. Nothing here interprets a value
 * clinically; thresholds live in safety.ts and decisions belong to a clinician.
 */

const SYMPTOM_TERMS: Record<string, string> = {
  thirst: "Increased thirst",
  thirsty: "Increased thirst",
  "passing urine": "Passing urine more often",
  "weeing more": "Passing urine more often",
  "peeing more": "Passing urine more often",
  tired: "Tiredness",
  exhausted: "Tiredness",
  "blurred vision": "Blurred vision",
  "blurry vision": "Blurred vision",
  numb: "Numbness or tingling",
  tingling: "Numbness or tingling",
  "pins and needles": "Numbness or tingling",
  dizzy: "Dizziness",
  "sore foot": "Sore foot",
  "foot pain": "Sore foot",
  "calf swelling": "Calf swelling",
  "leg swelling": "Leg swelling",
  "swollen leg": "Leg swelling",
  headache: "Headache",
  shaky: "Shakiness",
  sweaty: "Sweating",
};

const NUM = String.raw`(\d{1,3}(?:\.\d{1,2})?)`;

function obs(partial: Omit<PatientReportedObservation, "verified" | "source">): PatientReportedObservation {
  return { ...partial, verified: false, source: "patient_reported" };
}

export function captureHealthData(utterance: string): PatientReportedObservation[] {
  const text = utterance.toLowerCase();
  const out: PatientReportedObservation[] = [];

  // HbA1c first so its number is not read as a glucose value.
  const a1c = text.match(new RegExp(String.raw`(?:hba1c|a1c|hb a1c)[^0-9]{0,20}` + NUM));
  let a1cSpan: [number, number] | null = null;
  if (a1c && a1c.index !== undefined) {
    const v = Number(a1c[1]);
    a1cSpan = [a1c.index, a1c.index + a1c[0].length];
    const isPercent = v <= 20;
    const mmol = isPercent ? Math.round((v - 2.15) * 10.929) : Math.round(v);
    out.push(
      obs({
        kind: "hba1c",
        code: "59261-8",
        display: "HbA1c (patient-reported)",
        value: isPercent ? `${mmol} mmol/mol (reported as ${v}%)` : `${mmol} mmol/mol`,
        unit: "mmol/mol",
        numeric: mmol,
        raw: a1c[0],
      })
    );
  }

  const glucoseRe = new RegExp(
    String.raw`(?:sugar|sugars|glucose|bm|blood sugar|readings?)[^0-9]{0,24}` + NUM + String.raw`(?:\s*(?:to|-|and)\s*` + NUM + ")?",
    "g"
  );
  for (const m of text.matchAll(glucoseRe)) {
    if (m.index === undefined) continue;
    if (a1cSpan && m.index >= a1cSpan[0] && m.index < a1cSpan[1]) continue;
    const lo = Number(m[1]);
    const hi = m[2] ? Number(m[2]) : undefined;
    if (!(lo > 0 && lo < 40)) continue; // not plausibly mmol/L (e.g. a blood pressure)
    out.push(
      obs({
        kind: "capillary_glucose",
        code: "15074-8",
        display: "Blood glucose (patient-reported)",
        value: hi ? `${lo}–${hi} mmol/L` : `${lo} mmol/L`,
        unit: "mmol/L",
        numeric: lo,
        numeric2: hi,
        raw: m[0],
      })
    );
    break;
  }

  const bp = text.match(/(\d{2,3})\s*(?:\/|over)\s*(\d{2,3})/);
  if (bp) {
    const sys = Number(bp[1]);
    const dia = Number(bp[2]);
    if (sys >= 60 && sys <= 260 && dia >= 30 && dia <= 160 && sys > dia) {
      out.push(
        obs({
          kind: "blood_pressure",
          code: "85354-9",
          display: "Blood pressure (patient-reported)",
          value: `${sys}/${dia} mmHg`,
          unit: "mmHg",
          numeric: sys,
          numeric2: dia,
          raw: bp[0],
        })
      );
    }
  }

  const weight = text.match(new RegExp(NUM + String.raw`\s*(kg|kilos|kilograms|stone)`));
  if (weight) {
    const v = Number(weight[1]);
    const kg = weight[2] === "stone" ? Math.round(v * 6.35 * 10) / 10 : v;
    if (kg >= 25 && kg <= 300) {
      out.push(
        obs({
          kind: "weight",
          code: "29463-7",
          display: "Body weight (patient-reported)",
          value: weight[2] === "stone" ? `${kg} kg (reported as ${v} stone)` : `${kg} kg`,
          unit: "kg",
          numeric: kg,
          raw: weight[0],
        })
      );
    }
  }

  const missed = /(missed|forgot|forgotten|stopped|not taking|haven't been taking|havent been taking|run out of)[^.]{0,40}(tablet|tablets|medicine|medicines|meds|metformin|insulin|dose|doses|injection)/.exec(
    text
  );
  const taking = /(taking|take)[^.]{0,20}(every day|as prescribed|all of them|regularly)/.exec(text);
  if (missed) {
    out.push(
      obs({
        kind: "medication_adherence",
        code: null,
        display: "Medication adherence (patient-reported)",
        value: "Reports missed or stopped doses",
        unit: null,
        raw: missed[0],
      })
    );
  } else if (taking) {
    out.push(
      obs({
        kind: "medication_adherence",
        code: null,
        display: "Medication adherence (patient-reported)",
        value: "Reports taking medicines as prescribed",
        unit: null,
        raw: taking[0],
      })
    );
  }

  const seen = new Set<string>();
  for (const [term, label] of Object.entries(SYMPTOM_TERMS)) {
    if (text.includes(term) && !seen.has(label)) {
      seen.add(label);
      out.push(
        obs({ kind: "symptom", code: null, display: "Symptom (patient-reported)", value: label, unit: null, raw: term })
      );
    }
  }

  return out;
}

export function describeObservations(items: PatientReportedObservation[]): string {
  if (!items.length) return "nothing specific yet";
  return items
    .map((o) => {
      if (o.kind === "symptom") return o.value.toLowerCase();
      if (o.kind === "medication_adherence") return o.value.replace(/^Reports /, "").replace(/^taking/, "taking");
      return `${o.display.replace(" (patient-reported)", "").toLowerCase().replace("hba1c", "HbA1c")} ${o.value}`;
    })
    .reduce((acc, part, i, all) => (i === 0 ? part : i === all.length - 1 ? `${acc} and ${part}` : `${acc}, ${part}`), "");
}

/** FHIR R4 Observation drafts, tagged patient-reported and unverified. Never final. */
export function toFhirObservationDrafts(patientId: string, items: PatientReportedObservation[], at: string) {
  return items.map((o, i) => ({
    resourceType: "Observation" as const,
    id: `pr-${patientId}-${Date.parse(at)}-${i}`,
    status: "preliminary" as const,
    meta: {
      tag: [
        { system: "https://akshhealth.com/fhir/tags", code: "patient-reported" },
        { system: "https://akshhealth.com/fhir/tags", code: "unverified" },
        { system: "https://akshhealth.com/fhir/tags", code: "synthetic" },
      ],
    },
    code: o.code
      ? { coding: [{ system: "http://loinc.org", code: o.code, display: o.display }], text: o.display }
      : { text: o.display },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: at,
    valueString: o.value,
    performer: [{ reference: `Patient/${patientId}` }],
  }));
}
