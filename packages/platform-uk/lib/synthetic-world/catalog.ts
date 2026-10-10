import type { Market, MarketCode, ProfessionalRole } from "./types";

/**
 * Market configuration. Emergency and crisis numbers are used in patient-facing safety messages,
 * so only numbers we are confident of are listed; anything else defers to the clinic's own
 * configuration rather than guessing.
 */
export const MARKETS: Market[] = [
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    patientIdLabel: "Health ID (synthetic)",
    emergencyNumber: "999",
    urgentAdviceLine: "111",
    crisisLine: "Samaritans on 116 123",
    regulator: "MHRA",
    dataProtection: "UK GDPR",
    hba1cUnitPrimary: "mmol/mol",
    timezone: "Europe/London",
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    patientIdLabel: "Health ID (synthetic)",
    emergencyNumber: "112",
    urgentAdviceLine: null,
    crisisLine: "Tele-MANAS on 14416",
    regulator: "CDSCO",
    dataProtection: "DPDP Act 2023",
    hba1cUnitPrimary: "%",
    timezone: "Asia/Kolkata",
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    patientIdLabel: "MRN (synthetic)",
    emergencyNumber: "911",
    urgentAdviceLine: null,
    crisisLine: "the 988 Suicide & Crisis Lifeline",
    regulator: "FDA",
    dataProtection: "HIPAA",
    hba1cUnitPrimary: "%",
    timezone: "America/New_York",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    patientIdLabel: "Health ID (synthetic)",
    emergencyNumber: "998",
    urgentAdviceLine: null,
    crisisLine: "your clinic’s crisis support line",
    regulator: "MOHAP / DHA",
    dataProtection: "UAE PDPL",
    hba1cUnitPrimary: "%",
    timezone: "Asia/Dubai",
  },
];

export const MARKET_BY_CODE = Object.fromEntries(MARKETS.map((m) => [m.code, m])) as Record<MarketCode, Market>;

export const NAMES: Record<MarketCode, { female: string[]; male: string[]; family: string[]; cities: string[]; languages: string[] }> = {
  GB: {
    female: ["Olivia", "Amelia", "Isla", "Grace", "Freya", "Priya", "Aisha", "Hannah", "Sophie", "Zara", "Margaret", "Joan", "Niamh", "Chloe", "Fatima"],
    male: ["Oliver", "George", "Harry", "Jack", "Mohammed", "Arjun", "Callum", "Liam", "Thomas", "Kwame", "David", "Rhys", "Samuel", "Omar", "Peter"],
    family: ["Smith", "Jones", "Taylor", "Brown", "Patel", "Khan", "Evans", "Wilson", "Ahmed", "Murphy", "Walker", "Okafor", "Hughes", "Campbell", "Begum", "Wright"],
    cities: ["Leeds", "Birmingham", "Manchester", "Bristol", "Glasgow", "Cardiff", "Leicester", "London"],
    languages: ["English", "English", "English", "Urdu", "Punjabi", "Polish", "Bengali"],
  },
  IN: {
    female: ["Ananya", "Priya", "Lakshmi", "Meera", "Sunita", "Kavya", "Fatima", "Divya", "Pooja", "Asha", "Neha", "Sarita", "Deepa", "Rekha", "Shreya"],
    male: ["Rahul", "Arjun", "Vikram", "Suresh", "Ravi", "Imran", "Amit", "Karthik", "Rajesh", "Manoj", "Sanjay", "Anil", "Harish", "Farhan", "Gopal"],
    family: ["Sharma", "Reddy", "Iyer", "Nair", "Gupta", "Singh", "Khan", "Patel", "Rao", "Menon", "Das", "Joshi", "Kulkarni", "Banerjee", "Pillai", "Verma"],
    cities: ["Bengaluru", "Hyderabad", "Chennai", "Mumbai", "Pune", "Delhi", "Kochi", "Ahmedabad"],
    languages: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi"],
  },
  US: {
    female: ["Emma", "Ava", "Sophia", "Maria", "Keisha", "Jennifer", "Linda", "Grace", "Camila", "Aaliyah", "Mei", "Rosa", "Hannah", "Olivia", "Patricia"],
    male: ["James", "Michael", "Daniel", "Jose", "Marcus", "David", "Robert", "Luis", "Andre", "William", "Kevin", "Ethan", "Wei", "Carlos", "Anthony"],
    family: ["Johnson", "Williams", "Garcia", "Martinez", "Brown", "Davis", "Rodriguez", "Washington", "Nguyen", "Lee", "Hernandez", "Jackson", "Lopez", "Miller", "Kim", "Thomas"],
    cities: ["Atlanta", "Houston", "Chicago", "Phoenix", "Boston", "Detroit", "San Antonio", "Philadelphia"],
    languages: ["English", "English", "English", "Spanish", "Spanish", "Vietnamese", "Mandarin"],
  },
  AE: {
    female: ["Fatima", "Mariam", "Aisha", "Noura", "Layla", "Sara", "Hessa", "Reem", "Priya", "Anjali", "Maria", "Amna", "Shamma", "Dana", "Rania"],
    male: ["Mohammed", "Ahmed", "Khalid", "Omar", "Saeed", "Rashid", "Yousef", "Abdullah", "Rahul", "Joseph", "Hamdan", "Faisal", "Imran", "Sultan", "Tariq"],
    family: ["Al Mansoori", "Al Hashimi", "Al Suwaidi", "Al Ketbi", "Al Nuaimi", "Haddad", "Nair", "Fernandes", "Khan", "Al Marzouqi", "Rahman", "Thomas", "Al Shamsi", "Saleh", "Qureshi", "Menon"],
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman"],
    languages: ["Arabic", "Arabic", "English", "Hindi", "Malayalam", "Urdu", "Tagalog"],
  },
};

export const ROLE_LABEL: Record<ProfessionalRole, string> = {
  family_physician: "Family physician / GP",
  endocrinologist: "Endocrinologist",
  diabetes_specialist_nurse: "Diabetes specialist nurse",
  diabetes_educator: "Diabetes educator",
  practice_nurse: "Practice nurse",
  clinical_pharmacist: "Clinical pharmacist",
  community_pharmacist: "Community pharmacist",
  dietitian: "Dietitian",
  podiatrist: "Podiatrist",
  eye_specialist: "Ophthalmologist / optometrist",
  nephrologist: "Nephrologist",
  cardiologist: "Cardiologist",
  psychologist: "Clinical psychologist",
  care_coordinator: "Care coordinator / health coach",
  practice_manager: "Practice manager",
};

/** 100 professionals in total. */
export const ROLE_MIX: [ProfessionalRole, number][] = [
  ["family_physician", 22],
  ["endocrinologist", 10],
  ["diabetes_specialist_nurse", 10],
  ["diabetes_educator", 6],
  ["practice_nurse", 8],
  ["clinical_pharmacist", 6],
  ["community_pharmacist", 8],
  ["dietitian", 7],
  ["podiatrist", 5],
  ["eye_specialist", 4],
  ["nephrologist", 3],
  ["cardiologist", 2],
  ["psychologist", 2],
  ["care_coordinator", 4],
  ["practice_manager", 3],
];

export const REGISTRATION_PREFIX: Record<MarketCode, string> = {
  GB: "REG-GB",
  IN: "REG-IN",
  US: "NPI-SYN",
  AE: "REG-AE",
};

/** Fictional device and product names; no real brands. */
export const CGM_DEVICES = ["GlucoStream S2 (synthetic)", "SenseLoop 3 (synthetic)", "Continua Flash (synthetic)"];

export const ORG_NAME_PARTS = {
  clinic: ["Riverside", "Parkview", "Lakeside", "Northgate", "Hillcrest", "Meadowbank", "Harbour", "Oakwood", "Cedar", "Sunrise", "Greenfield", "Elm Street"],
  pharmacy: ["Wellbeing", "Corner", "Care Plus", "Lifeline", "Family", "Metro", "Green Cross", "Trust"],
  lab: ["Precision", "Clearpath", "Insight", "Apex"],
  payer: ["Unity Health Cover", "Shield Health Plans", "Sahayak Health Insurance", "Crescent Health Assurance", "Commonwealth Care", "Horizon Mutual"],
};

/** Medicines by class with typical doses (synthetic plans, not prescribing guidance). */
export const MEDS = {
  metformin: { name: "Metformin", class: "Biguanide", dose: "1 g twice daily" },
  sglt2: { name: "Empagliflozin", class: "SGLT2 inhibitor", dose: "10 mg daily" },
  dapagliflozin: { name: "Dapagliflozin", class: "SGLT2 inhibitor", dose: "10 mg daily" },
  glp1: { name: "Semaglutide", class: "GLP-1 receptor agonist", dose: "1 mg weekly" },
  dulaglutide: { name: "Dulaglutide", class: "GLP-1 receptor agonist", dose: "1.5 mg weekly" },
  dpp4: { name: "Sitagliptin", class: "DPP-4 inhibitor", dose: "100 mg daily" },
  su: { name: "Gliclazide", class: "Sulfonylurea", dose: "80 mg twice daily" },
  basal: { name: "Insulin glargine", class: "Basal insulin", dose: "Individualised units nightly" },
  bolus: { name: "Insulin aspart", class: "Rapid-acting insulin", dose: "Carbohydrate-matched with meals" },
  statin: { name: "Atorvastatin", class: "Statin", dose: "20 mg nightly" },
  acei: { name: "Ramipril", class: "ACE inhibitor", dose: "5 mg daily" },
  arb: { name: "Losartan", class: "ARB", dose: "50 mg daily" },
} as const;
