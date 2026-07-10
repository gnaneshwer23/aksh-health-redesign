export type OdsLookupResult = {
  found: boolean;
  name?: string;
  address?: string;
  ehr?: string;
  ics?: string;
  beds?: number;
  message: string;
};

const ODS_LOOKUPS: Record<string, Omit<OdsLookupResult, "found" | "message">> = {
  E81001: {
    name: "The Oakfield Surgery",
    address: "SE15 4NX",
    ehr: "EMIS Web",
    ics: "South East London",
  },
  B82005: {
    name: "Harrogate Medical Centre",
    address: "HG1 2RD",
    ehr: "SystmOne",
    ics: "West Yorkshire",
  },
  RRK: {
    name: "University Hospitals Birmingham NHS Trust",
    address: "Birmingham",
    ehr: "Epic",
    beds: 1200,
  },
};

export async function lookupOdsCode(code: string): Promise<OdsLookupResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const normalized = code.trim().toUpperCase();
  const match = ODS_LOOKUPS[normalized];
  if (!match) {
    return {
      found: false,
      message: "Not found — please enter manually",
    };
  }
  const parts = [
    match.name,
    match.address,
    match.ehr,
    match.ics ? `ICS: ${match.ics}` : null,
    match.beds ? `${match.beds.toLocaleString()} beds` : null,
  ].filter(Boolean);
  return {
    found: true,
    ...match,
    message: parts.join(", "),
  };
}

export async function verifyGmc(number: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (!/^\d{7}$/.test(number)) throw new Error("Invalid GMC number");
  return "✓ GMC verified with NHS Spine";
}

export async function verifyNmc(number: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (!/^[0-9]{2}[A-Z][0-9]{4}[A-Z]$/i.test(number)) throw new Error("Invalid NMC number");
  return "✓ NMC verified";
}

export async function verifyGphc(number: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (!/^\d{7}$/.test(number)) throw new Error("Invalid GPhC number");
  return "✓ GPhC verified";
}
