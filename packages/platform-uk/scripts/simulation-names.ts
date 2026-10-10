/** Fictional place names for simulation organisations: the product never names real countries or cities. */
export const PLACE: Record<string, string> = {
  "Abu Dhabi": "Palm Bay",
  "Al Ain": "Oasis",
  Ajman: "Harbourside",
  Atlanta: "Pinecrest",
  Bengaluru: "Greenhill",
  Birmingham: "Westbrook",
  Boston: "Bayview",
  Bristol: "Southport",
  Chennai: "Coastline",
  Chicago: "Lakeshore",
  Dubai: "Marina",
  Glasgow: "Highmoor",
  Houston: "Riverbend",
  Hyderabad: "Pearl Valley",
  Leeds: "Northfield",
  Manchester: "Eastvale",
  Mumbai: "Seaview",
  Phoenix: "Sunridge",
  Pune: "Hillside",
  Sharjah: "Old Town",
  Deccan: "Plateau",
};

export function neutralOrgName(name: string): string {
  let out = name.replace(/\s*\(synthetic\)\s*/gi, "").trim();
  // Longest first so "Abu Dhabi" wins over shorter matches.
  for (const city of Object.keys(PLACE).sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`\\b${city}\\b`, "g"), PLACE[city]!);
  }
  return out;
}
