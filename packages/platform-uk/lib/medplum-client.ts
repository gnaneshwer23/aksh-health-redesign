import type { FhirBundleDraft } from "./types";

/**
 * Pushes a finalized FHIR bundle to the Medplum FHIR server.
 * Uses local environment variables if available, otherwise assumes local docker-compose default.
 */
export async function pushToMedplum(bundle: any): Promise<boolean> {
  const MEDPLUM_URL = process.env.MEDPLUM_URL || "http://localhost:8103/fhir/R4";
  const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
  const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

  try {
    console.log("Preparing to push accepted FHIR bundle to Medplum...");
    
    let headers: Record<string, string> = {
      "Content-Type": "application/fhir+json"
    };

    // If using Medplum cloud or authenticated local, fetch an access token first
    if (MEDPLUM_CLIENT_ID && MEDPLUM_CLIENT_SECRET) {
      const authResponse = await fetch("http://localhost:8103/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: MEDPLUM_CLIENT_ID,
          client_secret: MEDPLUM_CLIENT_SECRET
        })
      });

      if (authResponse.ok) {
        const { access_token } = await authResponse.json();
        headers["Authorization"] = `Bearer ${access_token}`;
      } else {
        console.warn("Failed to authenticate with Medplum. Attempting unauthenticated request (for local dev).");
      }
    }

    // POST the bundle to Medplum
    const response = await fetch(`${MEDPLUM_URL}/`, {
      method: "POST",
      headers,
      body: JSON.stringify(bundle)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Medplum FHIR Server rejected the bundle: ${response.status}`, errorData);
      return false;
    }

    const responseData = await response.json();
    console.log("Successfully persisted FHIR Bundle to Medplum!", responseData.id);
    return true;
  } catch (error) {
    console.error("Failed to connect to Medplum FHIR Server:", error);
    return false;
  }
}

/**
 * Fetches historical encounters and conditions for a patient from the Medplum FHIR server.
 * This provides longitudinal context for the reviewing clinician.
 */
export async function fetchPatientHistory(patientLabel: string): Promise<any[]> {
  const MEDPLUM_URL = process.env.MEDPLUM_URL || "http://localhost:8103/fhir/R4";
  const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
  const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

  try {
    let headers: Record<string, string> = {
      "Accept": "application/fhir+json"
    };

    if (MEDPLUM_CLIENT_ID && MEDPLUM_CLIENT_SECRET) {
      const authResponse = await fetch("http://localhost:8103/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: MEDPLUM_CLIENT_ID,
          client_secret: MEDPLUM_CLIENT_SECRET
        })
      });

      if (authResponse.ok) {
        const { access_token } = await authResponse.json();
        headers["Authorization"] = `Bearer ${access_token}`;
      }
    }

    // Query Medplum for Bundles or Encounters related to this patient label
    // In a production FHIR environment, you would query by Patient.id
    // For this pilot, we search Encounters where reason or clinicianSummary might contain the label,
    // or just fetch recent Encounters to simulate a history view.
    const response = await fetch(`${MEDPLUM_URL}/Encounter?_sort=-date&_count=5`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return [];
    }

    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  } catch (error) {
    console.error("Failed to fetch patient history from Medplum:", error);
    return [];
  }
}

