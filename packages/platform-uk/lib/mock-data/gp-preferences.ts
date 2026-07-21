import type { z } from "zod";

import { gpPreferencesSchema } from "@/lib/onboarding/validation";

export type GpPreferences = z.infer<typeof gpPreferencesSchema>;

export const DEFAULT_GP_PREFERENCES: GpPreferences = {
  synthesisLength: "Standard",
  oracleAlerts: "High risk only",
  guardianSensitivity: "All interactions",
  voiceAgent: "On",
  equityReports: "Monthly",
  dailyDigest: "8am",
};

export const GP_PREFERENCE_LABELS: Record<keyof GpPreferences, string> = {
  synthesisLength: "SYNTHESIS summary length",
  oracleAlerts: "HORIZON alerts",
  guardianSensitivity: "GUARDIAN sensitivity",
  voiceAgent: "Voice Care Agent",
  equityReports: "EQUITY reports",
  dailyDigest: "Daily digest email",
};
