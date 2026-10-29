import type {
  AllergyRecord,
  ConditionRecord,
  DiabetesProfile,
  EncounterRecord,
  FamilyHistoryRecord,
  ObservationItem,
  QualityIndicator,
  SharingPreference,
} from "./types";

const STALE_DAYS = 180;

export function assessPatient360Quality(input: {
  hasNhsNumber: boolean;
  conditions: ConditionRecord[];
  allergies: AllergyRecord[];
  familyHistory: FamilyHistoryRecord[];
  diabetes: DiabetesProfile | null;
  encounters: EncounterRecord[];
  observations: ObservationItem[];
  medicationsCount: number;
  careTeamCount: number;
  sharing: SharingPreference[];
}): { indicators: QualityIndicator[]; dataCompleteness: number } {
  const indicators: QualityIndicator[] = [];
  let score = 0;
  const weights = 10;

  if (!input.hasNhsNumber) {
    indicators.push({
      code: "missing_nhs_number",
      message: "NHS number not on file",
      flag: "missing",
      field: "nhsNumber",
    });
  } else score += 1;

  if (input.conditions.length === 0) {
    indicators.push({
      code: "missing_conditions",
      message: "No structured conditions recorded",
      flag: "missing",
      field: "conditions",
    });
  } else score += 1;

  if (input.allergies.length === 0) {
    indicators.push({
      code: "missing_allergies",
      message: "Allergy list empty — confirm NKDA or document allergies",
      flag: "missing",
      field: "allergies",
    });
  } else score += 1;

  if (input.familyHistory.length === 0) {
    indicators.push({
      code: "missing_family_history",
      message: "No family history entries",
      flag: "missing",
      field: "familyHistory",
    });
  } else score += 1;

  if (!input.diabetes || input.diabetes.diabetesType === "unspecified") {
    indicators.push({
      code: "diabetes_unclassified",
      message: "Diabetes type not classified",
      flag: "unassessed",
      field: "diabetes",
    });
  } else score += 1;

  if (input.medicationsCount === 0) {
    indicators.push({
      code: "missing_medications",
      message: "No medications on file — run reconciliation if expected",
      flag: "missing",
      field: "medications",
    });
  } else score += 1;

  if (input.encounters.length === 0) {
    indicators.push({
      code: "missing_encounters",
      message: "No clinical encounters recorded",
      flag: "missing",
      field: "encounters",
    });
  } else score += 1;

  if (input.observations.length === 0) {
    indicators.push({
      code: "missing_observations",
      message: "No laboratory or vital-sign observations",
      flag: "missing",
      field: "observations",
    });
  } else {
    score += 1;
    const cutoff = Date.now() - STALE_DAYS * 86400_000;
    for (const o of input.observations) {
      if (!o.verified) {
        indicators.push({
          code: "unverified_observation",
          message: `${o.display} is unverified`,
          flag: "unverified",
          field: o.kind,
        });
      }
      if (new Date(o.observedAt).getTime() < cutoff) {
        indicators.push({
          code: "stale_observation",
          message: `${o.display} older than ${STALE_DAYS} days`,
          flag: "stale",
          field: o.kind,
        });
      }
      if (o.qualityFlag === "conflict") {
        indicators.push({
          code: "observation_conflict",
          message: `${o.display} flagged conflict`,
          flag: "conflict",
          field: o.kind,
        });
      }
    }
  }

  if (input.careTeamCount === 0) {
    indicators.push({
      code: "missing_care_team",
      message: "No care-team assignments",
      flag: "missing",
      field: "careTeam",
    });
  } else score += 1;

  if (input.sharing.length === 0) {
    indicators.push({
      code: "missing_sharing_prefs",
      message: "No consent / data-sharing preferences recorded",
      flag: "missing",
      field: "sharingPreferences",
    });
  } else score += 1;

  // Deduplicate by code+field
  const seen = new Set<string>();
  const unique = indicators.filter((i) => {
    const k = `${i.code}:${i.field ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    indicators: unique,
    dataCompleteness: Math.round((score / weights) * 100) / 100,
  };
}
