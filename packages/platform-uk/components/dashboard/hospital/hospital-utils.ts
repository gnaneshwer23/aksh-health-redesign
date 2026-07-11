import type { HospitalData } from "@/lib/mock-data/types";

export function calcBedOccupancyPct(data: HospitalData) {
  const total = data.wards.reduce((s, w) => s + w.totalBeds, 0);
  const occupied = data.wards.reduce((s, w) => s + w.occupiedBeds, 0);
  return Math.round((occupied / total) * 100);
}
