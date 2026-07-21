import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileCode2,
  Layers,
  Link2,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import {
  container,
  frame,
} from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";
import { COMPLIANCE_DISCLAIMER, SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Platform resources | ${SEO_DEFAULTS.title}`,
  description:
    "Architecture overview, FHIR R4 staging, human-in-the-loop specification, compliance pathways, and integration design for Aksh Health.",
};

const resourceCategories = [
  {
    id: "architecture",
    icon: Layers,
    title: "Architecture",
    description: "Five-layer clinical AI design from intake through governed export.",
  },
  {
    id: "compliance",
    icon: ShieldCheck,
    title: "Compliance",
    description: "NHS clinical safety, DTAC alignment, and GDPR Art. 9 design pathways.",
  },
  {
    id: "dcb0129",
    icon: ShieldCheck,
    title: "DCB0129 hazard log",
    description: "Safety case in progress, with hazard log structure outlined.",
  },
  {
    id: "dtac",
    icon: ShieldCheck,
    title: "DTAC checklist",
    description: "Alignment status across the five DTAC assessment domains.",
  },
  {
    id: "integration",
    icon: Link2,
    title: "Integration",
    description: "FHIR R4 staging, EMIS Web, and SystmOne interoperability patterns.",
  },
  {
    id: "precision-health",
    icon: BookOpen,
    title: "Precision Health roadmap",
    description: "Honest phased scaffolding toward multimodal contracts — not a live digital twin claim.",
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    description: "Data protection, RBAC, audit trails, and tenancy boundaries.",
    href: "/security",
  },
  {
    id: "api",
    icon: FileCode2,
    title: "API",
    description: "REST endpoints, adapter contracts, and integration boundaries.",
  },
  {
    id: "onboarding",
    icon: UserPlus,
    title: "Onboarding",
    description: "Organisation access requests and individual account setup.",
    href: "/get-started",
  },
] as const;

const resourceSections = [
  {
    id: "architecture",
    label: "Architecture",
    title: "Five layers from intake to export",
    body: "Aksh Health organises clinical AI into five layers: intake, agent orchestration, synthesis, review queue, and export. Consultation data flows through named clinical agents. Outputs land in a draft review queue. No autonomous write-back to active clinical records.",
    bullets: [
      "Five layers: intake, agents, synthesis, review, export",
      "Seven agents: VOICE, SYNTHESIS, Dr.Assist, GUARDIAN, HORIZON, COMPASS, SHIELD",
      "FHIR R4 resources staged as DRAFT until named reviewer approval",
      "Human-in-the-loop on every clinical output before record impact",
    ],
  },
  {
    id: "hitl",
    label: "Human-in-the-loop",
    title: "Named reviewer approval on every output",
    body: "Every AI-generated clinical output requires named clinician review before it reaches a care record or pathway. Queue items carry agent badges and DRAFT status until a reviewer records a decision.",
    bullets: [
      "Accept: freeze evidence artifacts and append FHIR AuditEvent to export bundle",
      "Edit: reviewer modifies draft content before acceptance",
      "Reject: discard output with audit trail; no write to clinical record",
      "Draft-only writes: no production record impact without explicit approval",
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    title: "Aligned design pathways, not certification claims",
    body: "Aksh Health aligns with NHS clinical safety and digital technology assessment pathways. We do not claim certification. Internal clinical safety evidence remains confidential; public resources describe design alignment only.",
    bullets: [
      "DCB0129 clinical safety case pathway in active development",
      "DTAC-aligned evidence scaffolding for NHS procurement",
      "GDPR Art. 9 special category health data handling",
      "MHRA-aware positioning: decision support, not autonomous diagnosis",
    "Human-in-the-loop review on every clinical output",
    ],
  },
  {
    id: "dcb0129",
    label: "DCB0129 hazard log",
    title: "Safety case in progress: hazard log structure",
    body: "The clinical safety case for Aksh Health follows the DCB0129 hazard log structure. This build has not completed a signed-off safety case; the outline below describes the working structure our clinical safety officer maintains internally.",
    bullets: [
      "Hazard identification: catalogue where an agent output could cause patient harm if acted on unreviewed",
      "Risk evaluation: likelihood and severity scoring per hazard, aligned to NHS clinical risk grading",
      "Mitigation: control measures, including the human-in-the-loop review gate on every clinical output",
      "Residual risk sign-off: named clinical safety officer approval before any production deployment",
      "Status: safety case in progress. No production EHR write-back is enabled until sign-off completes",
    ],
  },
  {
    id: "dtac",
    label: "DTAC checklist",
    title: "DTAC alignment checklist status",
    body: "The NHS Digital Technology Assessment Criteria covers five domains. Status below reflects design alignment work completed in this build, not a submitted or approved DTAC assessment.",
    bullets: [
      "Clinical safety: DCB0129 hazard log in progress (see above)",
      "Data protection: GDPR Art. 9 handling and RBAC design in place",
      "Technical assurance: FHIR R4 staging and audit trail architecture documented",
      "Interoperability: EMIS Web and SystmOne integration paths designed, not yet live",
      "Usability and accessibility: WCAG 2.1 AA target across dashboards, ongoing review",
    ],
  },
  {
    id: "integration",
    label: "FHIR & interoperability",
    title: "FHIR R4 staging above existing EHR systems",
    body: "Clinical outputs are staged as FHIR R4 draft resources for reviewer inspection. Integration architecture is designed for EMIS Web and SystmOne, the dominant UK primary care EHR systems. Production EHR connections are not live in this build.",
    bullets: [
      "Encounter, Condition, MedicationRequest, Observation in collection bundles",
      "DocumentReference for SYNTHESIS SOAP output in the review queue",
      "RiskAssessment for HORIZON score updates",
      "AuditEvent for SHIELD compliance trail on Accept, Edit, Reject",
      "Designed for EMIS Web and SystmOne FHIR exchange patterns",
    ],
  },
  {
    id: "precision-health",
    label: "Precision Health",
    title: "Roadmap scaffolding — not a living physiological twin",
    body: "Aksh Health publishes an honest delivery roadmap for Precision Health / digital twin work. What is in the product today is HITL clinical proof plus Phase 1–3 contracts, a synthetic whole-loop demo, connector stubs, and role UI. We do not claim live Fitbit/DICOM/omics streams, live EMIS write-back, MHRA-approved CDS, or a validated physiological digital twin.",
    bullets: [
      "Phase 0: HITL clinical proof on synthetic cohort (staging / sim write only)",
      "Synthetic whole-loop demo shipped: /demo/precision-health-loop (every flowchart stage; live modalities/EMR still Phase 2–3 partner)",
      "Phase 1–3: consent registry, modality contracts, connector stubs, synthetic twin ranking, causal/federated/pharma stubs",
      "Admin Precision Health status surfaces connector and honesty flags (liveEmis:false · physiologicalTwin:false)",
      "Partner credentials, DPIA, CSO signatures, and regulatory submissions remain outside the codebase",
      "Internal roadmap: docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md (engineering / auditor reference)",
    ],
  },
] as const;

const relatedLinks = [
  {
    label: "Security",
    description: "Data protection, GDPR Art. 9, RBAC, and audit trails.",
    href: "/security",
  },
  {
    label: "Integrations",
    description: "FHIR R4, EMIS Web, SystmOne, and API architecture.",
    href: "/integrations",
  },
  {
    label: "Platform",
    description: "Eight role dashboards and agent orchestration overview.",
    href: "/platform",
  },
  {
    label: "Request organisation access",
    description: "Enquire about onboarding your NHS organisation.",
    href: "/get-started",
  },
] as const;

function getSection(id: (typeof resourceSections)[number]["id"]) {
  const section = resourceSections.find((entry) => entry.id === id);
  if (!section) throw new Error(`Unknown resource section: ${id}`);
  return section;
}

function ResourceDetailCard({ section }: { section: (typeof resourceSections)[number] }) {
  return (
    <article
      id={section.id}
      className={`${frame} scroll-mt-28`}
    >
      <p className="marketing-section-label mb-3">{section.label}</p>
      <h3 className="text-xl font-bold text-navy md:text-2xl">{section.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-steel">{section.body}</p>
      <ul className="mt-5 space-y-2">
        {section.bullets.map((bullet, bulletIndex) => (
          <li
            key={bullet}
            className="flex gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-steel"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                bulletIndex % 2 === 0 ? "bg-pastel-mint text-pastel-mint-ink" : "bg-pastel-blue text-pastel-blue-ink"
              }`}
            >
              {bulletIndex + 1}
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ResourcesPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Resources"
        title="Architecture, compliance, and integration documentation"
        lede="Technical reference for NHS procurement, clinical safety review, and integration planning. FHIR R4 staging, human-in-the-loop review, and compliance design pathways for primary and secondary care."
        primary={{ label: "Create account", href: "/signup" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Browse by topic"
            title="Find the documentation you need"
            description="Jump to architecture, compliance, integration, security, API contracts, or onboarding pathways."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resourceCategories.map((category, index) => (
              <PastelCapabilityCard
                key={category.title}
                variant={pastelVariantAt(index)}
                icon={category.icon}
                title={category.title}
                description={category.description}
                href={"href" in category ? category.href : `#${category.id}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Technical reference"
            title="Architecture and review specification"
            description={`${COMPLIANCE_DISCLAIMER} Resources below describe design alignment, not certification or regulatory approval.`}
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <ResourceDetailCard section={getSection("architecture")} />
            <ResourceDetailCard section={getSection("hitl")} />
          </div>
        </div>
      </section>

      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Governance & interoperability"
            title="Compliance, safety case, and FHIR staging"
            description="Design alignment for NHS clinical safety, DCB0129 hazard log status, DTAC evidence, and EHR integration pathways."
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <ResourceDetailCard section={getSection("compliance")} />
            <ResourceDetailCard section={getSection("dcb0129")} />
            <ResourceDetailCard section={getSection("dtac")} />
            <ResourceDetailCard section={getSection("integration")} />
            <ResourceDetailCard section={getSection("precision-health")} />
          </div>
        </div>
      </section>

      <section id="api" className="scroll-mt-28 bg-white py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="API contracts"
            title="Integration and database boundaries"
            description="Explicit contracts for adapter implementations and external system integration."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Link
              href="/api/system/database-contract"
              className={`${frame} group flex items-start gap-4 transition-all hover:-translate-y-0.5 hover:border-emerald/30`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pastel-lavender">
                <BookOpen className="h-5 w-5 text-pastel-lavender-ink" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-navy group-hover:text-emerald">Database adapter contract</p>
                <p className="mt-1 text-sm text-steel">Schema boundaries and adapter interface for data persistence.</p>
              </div>
            </Link>
            <Link
              href="/api/system/integration-contract"
              className={`${frame} group flex items-start gap-4 transition-all hover:-translate-y-0.5 hover:border-emerald/30`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pastel-peach">
                <FileCode2 className="h-5 w-5 text-pastel-peach-ink" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-navy group-hover:text-emerald">Integration boundary contract</p>
                <p className="mt-1 text-sm text-steel">External system interfaces and FHIR exchange boundaries.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Related pages"
            title="Explore the platform in depth"
            description="Security posture, integration architecture, platform capabilities, and organisation onboarding."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedLinks.map((link, index) => (
              <PastelCapabilityCard
                key={link.href}
                variant={pastelVariantAt(index)}
                icon={BookOpen}
                title={link.label}
                description={link.description}
                href={link.href}
                compact
                footer={
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-navy">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to evaluate Aksh Health?"
        lede="Create an individual account to explore the platform, or request organisation access for NHS deployment conversations."
        primary={{ label: "Create account", href: "/signup" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />
    </MarketingShell>
  );
}
