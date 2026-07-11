import type { Metadata } from "next";

import { CompliancePageLayout } from "@/components/marketing/compliance-page-layout";

export const metadata: Metadata = {
  title: "Security & Compliance | Aksh Health",
  description:
    "Data protection, UK/EU residency, GDPR Art. 9 health data handling, RBAC, audit logs, and NHS clinical safety pathways. Human-in-the-loop AI with synthetic-safe demos.",
};

export default function SecurityPage() {
  return (
    <CompliancePageLayout
      eyebrow="Security & compliance"
      headline="Data protection and clinical safety for NHS deployments."
      subline="Aksh Health is designed for UK primary and secondary care with encryption, role-based access, immutable audit trails, and human approval on every clinical output. Demo uses synthetic data only."
      sections={[
        {
          title: "Data residency and encryption",
          body: "Clinical data is processed within UK and EU hosting boundaries appropriate for NHS workloads. Data in transit uses TLS. Data at rest uses platform-level encryption with tenant-scoped access controls.",
          bullets: [
            "UK/EU data residency framing for NHS procurement conversations",
            "Encryption in transit and at rest by default",
            "Tenant isolation for multi-site practice deployments",
          ],
        },
        {
          title: "GDPR Art. 9 special category data",
          body: "Health data receives heightened protection under UK GDPR. Aksh Health maps consent, purpose limitation, data minimisation, and subject rights workflows for special category health information.",
          bullets: [
            "Purpose limitation on clinical AI processing",
            "Consent and lawful basis scaffolding per deployment",
            "Data minimisation: only fields required for the clinical task",
          ],
        },
        {
          title: "RBAC, audit logs, and session security",
          body: "Role-based access control governs who can view, edit, and approve clinical outputs. NextAuth manages authenticated sessions. SHIELD records an immutable audit trail of AI recommendations and clinician decisions.",
          bullets: [
            "Role-based access across GP, nurse, pharmacist, and admin views",
            "NextAuth session management with secure cookie handling",
            "SHIELD AuditEvent trail on Accept, Edit, and Reject actions",
          ],
        },
        {
          title: "DCB0129 and DTAC pathways",
          body: "Aksh Health is aligned with NHS clinical safety and digital technology assessment pathways. We do not claim certification. Our safety case documentation and hazard logs are in active development.",
          bullets: [
            "DCB0129 clinical safety case in progress",
            "DTAC-aligned evidence scaffolding for procurement",
            "Hazard-aware workflow design with human-in-the-loop gates",
          ],
        },
        {
          title: "MHRA-aware AI positioning",
          body: "Aksh Health is a clinical decision support tool, not an autonomous diagnostic system. Every AI output requires named clinician review before it reaches a record or care pathway.",
          bullets: [
            "Human-in-the-loop on all clinical outputs",
            "No autonomous diagnosis or treatment decisions",
            "Agent outputs staged as DRAFT until reviewer approval",
          ],
        },
        {
          title: "Synthetic-safe demo boundary",
          body: "Public demos and walkthroughs use synthetic patient data only. No live EHR connection, no real patient identifiers, and no production write-back in this build.",
          bullets: [
            "Synthetic patients for all demonstration environments",
            "No live EMIS Web or SystmOne connection in demo",
            "External integrations gated off by default",
          ],
        },
      ]}
      ctaPrimary={{ label: "View resources", href: "/resources" }}
      ctaSecondary={{ label: "Request organisation access", href: "/get-started" }}
      complianceNote="Compliance badges describe aligned design pathways, not certification. See platform resources for architecture and compliance evidence."
    />
  );
}
