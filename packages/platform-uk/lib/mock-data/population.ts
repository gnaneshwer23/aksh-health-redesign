import type { PopulationData } from "./types";

function generateAdmissionForecast() {
  const forecast: PopulationData["admissionForecast"] = [];
  const base = new Date("2026-07-10");
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const predicted = 42 + Math.round(Math.sin(i / 2.5) * 8) + (i > 8 ? 5 : 0);
    const historical = 38 + Math.round(Math.cos(i / 3) * 5);
    forecast.push({
      day: d.toISOString().slice(5, 10),
      predicted,
      historical,
      upper: predicted + 6,
      lower: predicted - 5,
    });
  }
  return forecast;
}

export const populationData: PopulationData = {
  icsName: "West Yorkshire Health and Care Partnership",
  totalPatients: 47832,
  practices: 23,
  aiActionsThisMonth: 12447,
  synthesisApprovalRate: 0.913,
  guardianAlertsGenerated: 328,
  conditionPrevalenceByIMD: [
    { quintile: "Q1", t2d: 8.2, hypertension: 18.4, copd: 4.1, depression: 12.3 },
    { quintile: "Q2", t2d: 6.8, hypertension: 16.2, copd: 3.4, depression: 10.1 },
    { quintile: "Q3", t2d: 5.4, hypertension: 14.8, copd: 2.8, depression: 8.7 },
    { quintile: "Q4", t2d: 4.1, hypertension: 13.2, copd: 2.2, depression: 7.2 },
    { quintile: "Q5", t2d: 2.6, hypertension: 11.5, copd: 1.5, depression: 5.8 },
  ],
  riskDistribution: { low: 28450, medium: 12840, high: 5200, veryHigh: 1342 },
  equityFlags: 47,
  benchmarkByPractice: [
    { name: "Riverside Medical Centre", listSize: 12400, aiAdoption: 94, queueClearance: 88, guardianAlerts: 42, equityFlags: 3, overallScore: 91 },
    { name: "Oakwood Health Practice", listSize: 8900, aiAdoption: 87, queueClearance: 82, guardianAlerts: 28, equityFlags: 5, overallScore: 84 },
    { name: "Valley View Surgery", listSize: 6200, aiAdoption: 76, queueClearance: 71, guardianAlerts: 35, equityFlags: 8, overallScore: 72 },
    { name: "Harrogate Road GP", listSize: 9800, aiAdoption: 91, queueClearance: 90, guardianAlerts: 22, equityFlags: 2, overallScore: 93 },
    { name: "East Leeds Family Practice", listSize: 10500, aiAdoption: 68, queueClearance: 65, guardianAlerts: 48, equityFlags: 12, overallScore: 61 },
  ],
  admissionForecast: generateAdmissionForecast(),
  equityDeepDive: [
    { category: "Ethnicity: South Asian", flagCount: 14, practice: "East Leeds Family Practice", recommendedAction: "Targeted diabetes screening outreach", status: "In progress" },
    { category: "IMD Q1 deprivation", flagCount: 18, practice: "Valley View Surgery", recommendedAction: "Extended hours for working-age patients", status: "Planned" },
    { category: "Language barrier", flagCount: 6, practice: "Riverside Medical Centre", recommendedAction: "Interpreter service integration", status: "Completed" },
    { category: "Digital exclusion", flagCount: 9, practice: "Oakwood Health Practice", recommendedAction: "Telephone-first care pathway", status: "In progress" },
  ],
};

export const metricSparklines = {
  patients: [47200, 47350, 47500, 47620, 47700, 47780, 47832],
  aiActions: [11200, 11500, 11800, 12000, 12200, 12350, 12447],
  approvalRate: [0.89, 0.90, 0.905, 0.908, 0.91, 0.912, 0.913],
  guardianAlerts: [280, 295, 302, 310, 318, 325, 328],
};
