import type { Metadata } from "next";

import { CompliancePageLayout } from "@/components/marketing/compliance-page-layout";

export const metadata: Metadata = {
  title: "Integrations & Interoperability | Aksh Health",
  description:
    "FHIR R4 resources, EMIS Web and SystmOne integration pathways, HL7 v2 messaging, NHS CIS2 SSO readiness, and API architecture for NHS healthtech deployments.",
};

export default function IntegrationsPage() {
  return (
    <CompliancePageLayout
      eyebrow="Integrations"
      headline="Integration-ready architecture for NHS care settings."
      subline="Aksh Health is designed to sit above your existing systems. FHIR R4 resources, HL7 v2 messaging patterns, and NHS identity pathways are mapped for procurement conversations. Production EHR connections are on the roadmap."
      sections={[
        {
          title: "FHIR R4 resources",
          body: "Clinical outputs are staged as FHIR R4 draft resources until a named reviewer approves them. Resources align with NHS interoperability standards for primary and secondary care.",
          bullets: [
            "Patient, Encounter, Condition, Observation",
            "MedicationRequest, DocumentReference, RiskAssessment",
            "AuditEvent for SHIELD compliance trail",
          ],
        },
        {
          title: "EMIS Web and SystmOne",
          body: "Aksh Health is designed for the two dominant UK primary care EHR systems. Integration architecture follows vendor API patterns and FHIR exchange conventions. Live production connections are not available in this build.",
          bullets: [
            "Designed for EMIS Web and SystmOne workflows",
            "FHIR R4 staging layer above existing records",
            "Production interoperability on the roadmap",
          ],
        },
        {
          title: "HL7 v2 messaging",
          body: "Where FHIR is not yet available, HL7 v2 message patterns support ADT, ORU, and ORM flows for hospital and interface engine connectivity. Mirth Connect integration scaffolding is documented.",
          bullets: [
            "ADT, ORU, and ORM message pattern support",
            "Mirth Connect interface engine compatibility",
            "Bidirectional messaging where clinically appropriate",
          ],
        },
        {
          title: "NHS CIS2 single sign-on",
          body: "Enterprise clinical identity via NHS Care Identity Service 2 is mapped in our authentication architecture. CIS2 federation is a deployment pathway, not a live connection in this build.",
          bullets: [
            "CIS2 SSO pathway for NHS workforce identity",
            "NextAuth session layer with role resolution",
            "Proof-mode role selection for demo environments",
          ],
        },
        {
          title: "API architecture",
          body: "A RESTful API layer exposes clinical agents, review queue operations, and FHIR bundle export. Integration boundaries are documented with explicit contracts for database and external system adapters.",
          bullets: [
            "REST API for agent orchestration and review queue",
            "FHIR bundle export on case acceptance",
            "Documented integration and database contracts",
          ],
        },
        {
          title: "Synthetic demo data",
          body: "Walkthroughs and product reviews use synthetic patient scenarios. No real identifiers, no live feeds, and no production write-back. Integration health views show scaffolded status for demonstration.",
          bullets: [
            "Synthetic patients for all demo walkthroughs",
            "Integration health dashboard with scaffolded status",
            "External connections gated off by default",
          ],
        },
      ]}
      ctaPrimary={{ label: "Book a demo", href: "/get-started" }}
      ctaSecondary={{ label: "Read documentation", href: "/docs" }}
      complianceNote="Integration status reflects design readiness and roadmap position. See documentation for contracts and architecture detail."
    />
  );
}
