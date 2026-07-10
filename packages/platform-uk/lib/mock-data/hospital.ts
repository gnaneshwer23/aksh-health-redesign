import type { HospitalData } from "./types";

function generateForecast(): HospitalData["capacityForecast"] {
  const days: HospitalData["capacityForecast"] = [];
  const baseDate = new Date("2026-07-10");
  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const admissions = 18 + Math.round(Math.sin(i / 2) * 4) + (i > 10 ? 3 : 0);
    const discharges = 15 + Math.round(Math.cos(i / 3) * 3);
    days.push({
      day: d.toISOString().slice(0, 10),
      predictedAdmissions: admissions,
      predictedDischarges: discharges,
      netBedDemand: admissions - discharges,
    });
  }
  return days;
}

export const hospitalData: HospitalData = {
  hospitalName: "Leeds General Infirmary",
  edWaitingTime: 6.2,
  edPatientsWaiting: 34,
  theatresRunning: 7,
  theatresTotal: 10,
  staffingAlerts: [
    "Night shift — 2 nurses below minimum (Ward 3A)",
    "Agency cover requested for Ward 4B — pending",
    "Theatre 3 — anaesthetist unavailable 14:00–18:00",
  ],
  wards: [
    { name: "Ward 2A — Medical", totalBeds: 28, occupiedBeds: 22, availableBeds: 6, status: "Normal", staffRatio: "1:7", averageLos: 4.2, awaitingDischarge: 3 },
    { name: "Ward 2B — Respiratory", totalBeds: 24, occupiedBeds: 21, availableBeds: 3, status: "Pressured", staffRatio: "1:8", averageLos: 5.1, awaitingDischarge: 5 },
    { name: "Ward 3A — Cardiology", totalBeds: 32, occupiedBeds: 31, availableBeds: 1, status: "Critical", staffRatio: "1:9", averageLos: 3.8, awaitingDischarge: 7 },
    { name: "Ward 3B — Cardiology", totalBeds: 30, occupiedBeds: 27, availableBeds: 3, status: "Pressured", staffRatio: "1:8", averageLos: 4.0, awaitingDischarge: 4 },
    { name: "Ward 4A — Surgical", totalBeds: 26, occupiedBeds: 20, availableBeds: 6, status: "Normal", staffRatio: "1:6", averageLos: 2.5, awaitingDischarge: 2 },
    { name: "Ward 4B — Orthopaedics", totalBeds: 28, occupiedBeds: 25, availableBeds: 3, status: "Pressured", staffRatio: "1:7", averageLos: 6.2, awaitingDischarge: 6 },
    { name: "Ward 5A — Elderly Care", totalBeds: 30, occupiedBeds: 29, availableBeds: 1, status: "Critical", staffRatio: "1:8", averageLos: 12.4, awaitingDischarge: 11 },
    { name: "Ward 5B — Stroke", totalBeds: 22, occupiedBeds: 18, availableBeds: 4, status: "Normal", staffRatio: "1:5", averageLos: 7.8, awaitingDischarge: 3 },
  ],
  capacityForecast: generateForecast(),
  aiRecommendations: [
    { id: "HR001", text: "Increase discharge planning team hours tomorrow — predicted +18 admissions", urgency: "Urgent" },
    { id: "HR002", text: "Open 4 additional beds in Ward 2B overflow — respiratory surge expected", urgency: "High" },
    { id: "HR003", text: "Expedite medically fit discharges in Ward 3A — 7 patients awaiting placement", urgency: "Urgent" },
  ],
  agencyTriggers: [
    { ward: "Ward 3A", message: "2 nurses below minimum. Trigger agency request?" },
    { ward: "Ward 5A", message: "1 nurse below minimum. Trigger agency request?" },
  ],
};

export const wardStaffing = hospitalData.wards.map((w) => ({
  ward: w.name,
  required: Math.ceil(w.occupiedBeds / 6),
  actual: Math.ceil(w.occupiedBeds / 6) - (w.status === "Critical" ? 2 : w.status === "Pressured" ? 1 : 0),
}));
