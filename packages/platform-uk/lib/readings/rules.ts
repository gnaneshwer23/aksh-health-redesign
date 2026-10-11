/**
 * Patient-entered readings: input shape, unit conversion, plausibility, and flags. Pure.
 *
 * Flags are information, not decisions. They use widely published thresholds (hypoglycaemia level 1 < 3.9 mmol/L,
 * level 2 < 3.0 mmol/L; hyperglycaemia > 13.9 mmol/L; blood pressure ≥ 180/120) to show the patient general safety
 * wording and to surface the reading for the care team. Treatment advice stays with the patient's own plan.
 */
import { z } from "zod";

export const GLUCOSE_MGDL_PER_MMOL = 18.0182;

export const readingInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("glucose"),
    value: z.number().finite(),
    unit: z.enum(["mmol/L", "mg/dL"]),
    context: z.enum(["fasting", "before_meal", "after_meal", "bedtime", "other"]).optional(),
    observedAt: z.string().datetime({ offset: true }),
    clientRef: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).refine((r) => !/-(sys|dia)$/.test(r), "clientRef must not end in -sys or -dia (reserved for blood pressure halves)"),
  }),
  z.object({
    kind: z.literal("bp"),
    systolic: z.number().int(),
    diastolic: z.number().int(),
    observedAt: z.string().datetime({ offset: true }),
    clientRef: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).refine((r) => !/-(sys|dia)$/.test(r), "clientRef must not end in -sys or -dia (reserved for blood pressure halves)"),
  }),
  z.object({
    kind: z.literal("weight"),
    value: z.number().finite(),
    unit: z.enum(["kg", "lb"]),
    observedAt: z.string().datetime({ offset: true }),
    clientRef: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).refine((r) => !/-(sys|dia)$/.test(r), "clientRef must not end in -sys or -dia (reserved for blood pressure halves)"),
  }),
]);
export type ReadingInput = z.infer<typeof readingInputSchema>;

export type Flag = "very_low" | "low" | "high" | "very_high" | null;
export type StoredReading = { kind: "glucose" | "systolic_bp" | "diastolic_bp" | "weight"; value: number; unit: string; originalValue: number; originalUnit: string; context?: string; flag: Flag; clientRef: string };

export class ReadingError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;

export function glucoseFlag(mmol: number): Flag {
  if (mmol < 3.0) return "very_low";
  if (mmol < 3.9) return "low";
  if (mmol > 13.9) return "high";
  return null;
}

export function bpFlag(systolic: number, diastolic: number): Flag {
  return systolic >= 180 || diastolic >= 120 ? "very_high" : null;
}

/** Normalise to stored units (glucose mmol/L, weight kg) and reject values no meter or scale can produce. */
export function toStored(input: ReadingInput, now = Date.now()): StoredReading[] {
  const at = Date.parse(input.observedAt);
  if (at > now + 5 * 60_000) throw new ReadingError("The time is in the future");
  if (at < now - 30 * 86_400_000) throw new ReadingError("Readings older than 30 days can't be added here; tell your care team");
  if (input.kind === "glucose") {
    const mmol = input.unit === "mg/dL" ? input.value / GLUCOSE_MGDL_PER_MMOL : input.value;
    if (!(mmol >= 1 && mmol <= 40)) throw new ReadingError(input.unit === "mg/dL" ? "Glucose must be between 18 and 720 mg/dL" : "Glucose must be between 1 and 40 mmol/L");
    return [{ kind: "glucose", value: round(mmol, 1), unit: "mmol/L", originalValue: input.value, originalUnit: input.unit, context: input.context, flag: glucoseFlag(mmol), clientRef: input.clientRef }];
  }
  if (input.kind === "bp") {
    const { systolic, diastolic } = input;
    if (!(systolic >= 60 && systolic <= 260) || !(diastolic >= 30 && diastolic <= 160) || diastolic >= systolic) {
      throw new ReadingError("Check the numbers: top 60–260, bottom 30–160, top higher than bottom");
    }
    const flag = bpFlag(systolic, diastolic);
    return [
      { kind: "systolic_bp", value: systolic, unit: "mmHg", originalValue: systolic, originalUnit: "mmHg", flag, clientRef: `${input.clientRef}-sys` },
      { kind: "diastolic_bp", value: diastolic, unit: "mmHg", originalValue: diastolic, originalUnit: "mmHg", flag, clientRef: `${input.clientRef}-dia` },
    ];
  }
  const kg = input.unit === "lb" ? input.value * 0.45359237 : input.value;
  if (!(kg >= 20 && kg <= 350)) throw new ReadingError("Weight must be between 20 and 350 kg");
  return [{ kind: "weight", value: round(kg, 1), unit: "kg", originalValue: input.value, originalUnit: input.unit, flag: null, clientRef: input.clientRef }];
}

/** What the patient sees after saving a flagged reading. General wording; the emergency number is the clinic's own. */
export function safetyNotice(flag: Flag, kind: string, emergencyNumber: string | null) {
  if (!flag) return null;
  const emergency = emergencyNumber ? `call ${emergencyNumber}` : "call your local emergency number";
  if (kind === "glucose" && (flag === "very_low" || flag === "low")) {
    return {
      severity: flag === "very_low" ? ("urgent" as const) : ("warning" as const),
      text: `This glucose reading is ${flag === "very_low" ? "very " : ""}low. Follow the low-glucose plan your care team gave you, and check again as your plan says. If you feel confused, drowsy or can't treat it yourself, ${emergency} or ask someone to.`,
    };
  }
  if (kind === "glucose" && flag === "high") {
    return { severity: "warning" as const, text: `This glucose reading is high. Follow your care team's plan for high readings. If you are being sick, very thirsty and drowsy, or breathing fast, ${emergency}.` };
  }
  return { severity: "warning" as const, text: `This blood pressure is very high. Sit quietly for five minutes and measure again. If it stays this high or you have chest pain, severe headache, weakness or trouble speaking, ${emergency}.` };
}
