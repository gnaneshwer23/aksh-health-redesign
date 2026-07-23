import type { Metadata } from "next";

import { CompliancePageLayout } from "@/components/marketing/compliance-page-layout";

export const metadata: Metadata = {
  title: "Integrations & Interoperability | Aksh Health",
  description:
    "FHIR standards, EMIS Web and SystmOne integration pathways, HL7 v2 messaging patterns, NHS CIS2 SSO pathway mapping, and API architecture for NHS care settings.",
};

export default function IntegrationsPage() {
  return (
    <CompliancePageLayout
      eyebrow="Integrations"
      headline="Integration-ready architecture for NHS care settings."
      subline="Aksh Health is designed to sit above your existing systems. FHIR resources, HL7 v2 messaging patterns, and NHS identity pathways are mapped for procurement conversations."
      sections={[
        {
          title: "FHIR resources",
          body: "Clinical outputs are prepared as FHIR draft resources until a named reviewer approves them. Resources align with NHS interoperability standards for primary and secondary care.",
          bullets: [
            "Patient, Encounter, Condition, Observation",
            "MedicationRequest, DocumentReference, RiskAssessment",
            "AuditEvent for compliance trail",
          ],
        },
        {
          title: "EMIS Web and SystmOne",
          body: "Aksh Health is designed for the two dominant UK primary care EHR systems. Integration architecture follows vendor API patterns and FHIR exchange conventions.",
          bullets: [
            "Designed for EMIS Web and SystmOne workflows",
            "FHIR exchange layer above existing records",
            "Governed pathways for organisation deployment",
          ],
        },
        {
          title: "HL7 v2 messaging",
          body: "Where FHIR is not yet available, HL7 v2 message patterns support ADT, ORU, and ORM flows for hospital and interface engine connectivity.",
          bullets: [
            "ADT, ORU, and ORM message pattern support",
            "Mirth Connect interface engine compatibility",
            "Bidirectional messaging where clinically appropriate",
          ],
        },
        {
          title: "NHS CIS2 single sign-on",
          body: "Enterprise clinical identity via NHS Care Identity Service 2 is mapped in our authentication architecture as a deployment pathway for NHS workforce identity.",
          bullets: [
            "CIS2 SSO pathway for NHS workforce identity",
            "Session layer with role resolution",
            "Role-based access for NHS workforce identity",
          ],
        },
        {
          title: "API architecture",
          body: "A RESTful API layer exposes clinical workflows, review queue operations, and FHIR bundle export. Integration boundaries are documented with explicit contracts.",
          bullets: [
            "REST API for workflow orchestration and review queue",
            "FHIR bundle export on case acceptance",
            "Documented integration and database contracts",
          ],
        },
        {
          title: "EHR connection pathways",
          body: "Aksh Health is designed for EMIS Web and SystmOne through FHIR exchange paths. Admin integration views show adapter readiness and governed write-back controls.",
          bullets: [
            "FHIR bundle exchange on clinician-approved outputs",
            "Integration health views for adapter readiness",
            "Write-back gated behind organisation governance",
          ],
        },
      ]}
      ctaPrimary={{ label: "Book a demonstration", href: "/get-started" }}
      ctaSecondary={{ label: "View resources", href: "/resources" }}
      complianceNote="Integration status reflects design readiness and governed pathways — not live partner certifications. See platform resources for contracts and architecture detail."
    />
  );
}
