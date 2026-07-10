import type { Medication } from "./types";

export const commonDrugs = [
  "Apixaban",
  "Metformin",
  "Furosemide",
  "Amlodipine",
  "Sertraline",
  "Aspirin",
  "Atorvastatin",
  "Bisoprolol",
  "Lisinopril",
  "Salbutamol",
  "Warfarin",
  "Ibuprofen",
  "Omeprazole",
  "Amitriptyline",
  "Tramadol",
  "Prednisolone",
  "Insulin glargine",
  "Ramipril",
  "Clopidogrel",
  "Paracetamol",
];

export const medications: Medication[] = [
  {
    name: "Apixaban",
    genericName: "Apixaban",
    bnfSection: "2.9 Anticoagulants",
    dosing: "5mg BD (reduce to 2.5mg BD if ≥2 of: age ≥80, weight ≤60kg, creatinine ≥133)",
    interactions: [
      { drugA: "Apixaban", drugB: "Aspirin", severity: "High", bnfSection: "2.9", recommendation: "Additive bleeding risk — review aspirin indication" },
      { drugA: "Apixaban", drugB: "Ibuprofen", severity: "High", bnfSection: "2.9", recommendation: "Avoid NSAIDs — use paracetamol instead" },
    ],
  },
  {
    name: "Metformin",
    genericName: "Metformin",
    bnfSection: "6.1.2 Antidiabetic drugs",
    dosing: "500mg–1g BD with meals. Max 2g daily.",
    interactions: [
      { drugA: "Metformin", drugB: "Contrast media", severity: "Medium", bnfSection: "6.1.2", recommendation: "Withhold 48h before/after iodinated contrast" },
    ],
  },
  {
    name: "Furosemide",
    genericName: "Furosemide",
    bnfSection: "2.2 Diuretics",
    dosing: "20–80mg daily in heart failure. Adjust per response.",
    interactions: [
      { drugA: "Furosemide", drugB: "Lisinopril", severity: "Low", bnfSection: "2.2", recommendation: "Monitor renal function and electrolytes" },
    ],
  },
  {
    name: "Amlodipine",
    genericName: "Amlodipine",
    bnfSection: "2.6.2 Calcium-channel blockers",
    dosing: "5mg OD. Max 10mg daily.",
    interactions: [],
  },
  {
    name: "Sertraline",
    genericName: "Sertraline",
    bnfSection: "4.3 Antidepressants",
    dosing: "50mg OD. Increase gradually to max 200mg.",
    interactions: [
      { drugA: "Sertraline", drugB: "Tramadol", severity: "Medium", bnfSection: "4.3", recommendation: "Serotonin syndrome risk — monitor closely" },
    ],
  },
];

export const bnfEntries = medications.map((m) => ({
  name: m.name,
  section: m.bnfSection,
  dosing: m.dosing,
}));

export function checkInteractions(drug: string, patientMeds: string[]): { drugA: string; drugB: string; severity: "High" | "Medium" | "Low"; bnfSection: string; recommendation: string }[] {
  const results: { drugA: string; drugB: string; severity: "High" | "Medium" | "Low"; bnfSection: string; recommendation: string }[] = [];
  const drugLower = drug.toLowerCase();

  for (const med of medications) {
    if (med.name.toLowerCase() === drugLower || med.genericName.toLowerCase() === drugLower) {
      for (const interaction of med.interactions) {
        const otherDrug = interaction.drugA.toLowerCase() === drugLower ? interaction.drugB : interaction.drugA;
        if (patientMeds.some((pm) => pm.toLowerCase().includes(otherDrug.toLowerCase()))) {
          results.push(interaction);
        }
      }
    }
  }

  if (drugLower === "aspirin") {
    if (patientMeds.some((m) => m.toLowerCase().includes("apixaban") || m.toLowerCase().includes("warfarin"))) {
      results.push({
        drugA: "Aspirin",
        drugB: "Anticoagulant",
        severity: "High",
        bnfSection: "2.9",
        recommendation: "Review bleeding risk — consider gastroprotection",
      });
    }
  }

  return results;
}

export function searchDrugs(query: string): string[] {
  const q = query.toLowerCase();
  return commonDrugs.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
}
