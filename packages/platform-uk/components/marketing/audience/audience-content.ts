import {
  Activity,
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  FileText,
  HeartPulse,
  Link2,
  Scale,
  Send,
  Shield,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AudienceCta = {
  label: string;
  href: string;
};

export type AudienceWorkflowStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  label?: string;
};

export type AudienceWorkflow = {
  sectionLabel: string;
  sectionTitle: string;
  sectionDescription: string;
  disclaimer?: string;
  steps: AudienceWorkflowStep[];
};

export type AudiencePageContent = {
  eyebrow: string;
  headline: string;
  subline: string;
  roles?: string[];
  problem: {
    title: string;
    body: string;
    icon: LucideIcon;
  };
  outcome: {
    title: string;
    body: string;
    icon: LucideIcon;
  };
  workflow: AudienceWorkflow;
  ctaPrimary: AudienceCta;
  ctaSecondary: AudienceCta;
  complianceNote: string;
};

export const audiencePages = {
  clinicians: {
    eyebrow: "For clinicians",
    headline: "Spend time with patients, not paperwork.",
    subline:
      "Care coordination for EMIS Web and SystmOne. Draft notes and safety checks arrive ready for review — you approve before anything reaches the record.",
    roles: ["GP", "Nurse", "Pharmacist"],
    problem: {
      title: "Notes and checks steal the evening",
      body: "You know the plan before the consult ends, then spend twenty minutes typing, reconciling meds, and chasing referrals across systems.",
      icon: ClipboardList,
    },
    outcome: {
      title: "One review queue before the record",
      body: "Consultation capture produces structured drafts and clinical checks in one place. Accept, edit, or reject — nothing writes without you.",
      icon: Stethoscope,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Capture, draft, approve",
      sectionDescription: "Three calm steps from consult to governed record.",
      disclaimer: "No outputs are written to the EHR without clinician approval.",
      steps: [
        {
          label: "01",
          title: "Capture",
          description: "Voice or notes during the consult. Context loads from EMIS Web or SystmOne.",
          icon: Activity,
        },
        {
          label: "02",
          title: "Draft + checks",
          description: "SOAP drafts, interaction flags, and referral packages stage for review.",
          icon: FileText,
        },
        {
          label: "03",
          title: "You approve",
          description: "Accept, edit, or reject. Only then can content stage toward the record.",
          icon: CheckSquare,
        },
      ],
    },
    ctaPrimary: { label: "Create account", href: "/signup?role=gp" },
    ctaSecondary: { label: "See walkthrough", href: "/walkthrough" },
    complianceNote:
      "Clinician approval on every clinical output. NHS DCB0129 safety case in progress. See documentation for architecture and compliance pathways.",
  },
  hospitals: {
    eyebrow: "For hospitals",
    headline: "One command view for trust pressure.",
    subline:
      "Ward status, demand foresight, and workforce signals in one place — with an audit trail for every operational recommendation.",
    roles: ["Hospital Executive", "Medical Director", "COO"],
    problem: {
      title: "Operational data lives in silos",
      body: "ED waits, beds, and staffing sit in separate tools. Leaders react after pressure arrives.",
      icon: Building2,
    },
    outcome: {
      title: "A single view before the surge",
      body: "See capacity and demand together, act earlier, and keep every recommendation auditable.",
      icon: BarChart3,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, monitor, act",
      sectionDescription: "Three steps from fragmented feeds to governed executive action.",
      disclaimer: "Production deployment requires trust governance sign-off.",
      steps: [
        {
          label: "01",
          title: "Connect systems",
          description: "Bring ED, ward, and workforce signals into one command view.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Monitor pressure",
          description: "Track waits, beds, and staffing gaps as they shift.",
          icon: Building2,
        },
        {
          label: "03",
          title: "Act with audit",
          description: "Recommendations stay visible and logged for medical directors and CIOs.",
          icon: Shield,
        },
      ],
    },
    ctaPrimary: { label: "Open hospital demo", href: "/dashboard/hospital" },
    ctaSecondary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Public command-centre demo uses synthetic capacity data only — not a live PAS/EPR feed. Immutable audit trails for operational recommendations. See documentation for architecture and compliance pathways.",
  },
  research: {
    eyebrow: "For research",
    headline: "Evaluate outcomes with governed access.",
    subline:
      "Study cohort metrics and care outcomes with clear ethics boundaries — aggregates by default, patient-level access only when approved.",
    roles: ["Researcher", "Clinical Informatics"],
    problem: {
      title: "Evaluation data without clear gates",
      body: "Research teams need outcomes evidence, but access paths often blur ethics and operational safety.",
      icon: Scale,
    },
    outcome: {
      title: "Governed cohorts, clear boundaries",
      body: "Aggregate views first. Explicit review for sensitive access. Exportable audit of what was used and why.",
      icon: BarChart3,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Request, review, study",
      sectionDescription: "Three steps from access request to governed analysis.",
      steps: [
        {
          label: "01",
          title: "Request access",
          description: "Define cohort scope and research purpose up front.",
          icon: Send,
        },
        {
          label: "02",
          title: "Governance review",
          description: "Ethics and data-minimisation checks gate what can be seen.",
          icon: Shield,
        },
        {
          label: "03",
          title: "Study outcomes",
          description: "Work in governed views with an audit trail of queries and exports.",
          icon: TrendingUp,
        },
      ],
    },
    ctaPrimary: { label: "Create account", href: "/signup?role=researcher" },
    ctaSecondary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Aggregate access by default. Ethics boundaries remain explicit. See documentation for research governance pathways.",
  },
  patients: {
    eyebrow: "For patients",
    headline: "Your health, understood and supported.",
    subline:
      "Invited by your GP practice. Clear plans, check-ins, and support between appointments — never alone with paperwork.",
    roles: ["Patient"],
    problem: {
      title: "Care fades after the appointment",
      body: "Plans live in letters and portals. Between visits it is hard to know what matters next.",
      icon: HeartPulse,
    },
    outcome: {
      title: "A clear plan you can follow",
      body: "See what your care team agreed, complete check-ins, and raise concerns without guessing who to call.",
      icon: Users,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Invite, follow, stay supported",
      sectionDescription: "Three steps from practice invite to ongoing support.",
      steps: [
        {
          label: "01",
          title: "Practice invite",
          description: "Your GP practice creates your secure access.",
          icon: Users,
        },
        {
          label: "02",
          title: "See your plan",
          description: "View agreed next steps in plain language.",
          icon: ClipboardList,
        },
        {
          label: "03",
          title: "Stay in touch",
          description: "Complete check-ins and message the team when something changes.",
          icon: HeartPulse,
        },
      ],
    },
    ctaPrimary: { label: "Create account", href: "/signup?role=patient" },
    ctaSecondary: { label: "How it works", href: "/how-it-works" },
    complianceNote:
      "Patient access is practice-invited. Clinical decisions remain with your care team.",
  },
  practices: {
    eyebrow: "For practices",
    headline: "Run the practice with clear oversight.",
    subline:
      "See queue health, integrations, and audit posture without another spreadsheet — designed for EMIS Web and SystmOne practice operations.",
    roles: ["Practice Manager", "Admin"],
    problem: {
      title: "Ops visibility is scattered",
      body: "Who approved what, which integrations failed overnight, and whether the review queue is clearing are hard to answer in one place.",
      icon: Building2,
    },
    outcome: {
      title: "One operations view with audit",
      body: "Monitor team workload, integration health, and approval trails from a single practice dashboard.",
      icon: Shield,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Set up, oversee, evidence",
      sectionDescription: "Three steps from practice setup to governance-ready reporting.",
      disclaimer: "Clinical approval remains with named clinicians.",
      steps: [
        {
          label: "01",
          title: "Set up the practice",
          description: "Link organisation context and role access for your team.",
          icon: Building2,
        },
        {
          label: "02",
          title: "Oversee the queue",
          description: "See review backlog and integration health without peeking into clinical detail you do not need.",
          icon: ClipboardList,
        },
        {
          label: "03",
          title: "Evidence governance",
          description: "Exportable audit trails for ICS and internal assurance.",
          icon: FileText,
        },
      ],
    },
    ctaPrimary: { label: "Discuss a pilot", href: "/get-started" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Practice oversight stays separate from clinical sign-off. See documentation for architecture and compliance pathways.",
  },
  ics: {
    eyebrow: "For ICS leads",
    headline: "See population health across your system.",
    subline:
      "Population signals, equity views, and capacity foresight across practices — without patient-level spill by default.",
    roles: ["ICS Lead", "Clinical Informatics"],
    problem: {
      title: "System intelligence arrives too late",
      body: "ICS teams need disparity and capacity signals across sites, but data often arrives as lagged extracts.",
      icon: TrendingUp,
    },
    outcome: {
      title: "System view without losing trust",
      body: "Aggregate and equity-aware views help leaders plan earlier while keeping patient detail out of population dashboards.",
      icon: BarChart3,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, compare, plan",
      sectionDescription: "Three steps from site connection to ICS planning.",
      steps: [
        {
          label: "01",
          title: "Connect sites",
          description: "Bring practices into a shared regional view.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Compare signals",
          description: "See demand, outcomes, and equity gaps across the system.",
          icon: BarChart3,
        },
        {
          label: "03",
          title: "Plan capacity",
          description: "Use foresight views to prioritise support before winter pressure peaks.",
          icon: TrendingUp,
        },
      ],
    },
    ctaPrimary: { label: "Try ICS demo", href: "/dashboard/ics" },
    ctaSecondary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Population views are aggregate by default. Public demo uses synthetic data only. See documentation for ICS governance pathways.",
  },
  administrators: {
    eyebrow: "For administrators",
    headline: "Keep integrations healthy and auditable.",
    subline:
      "Integration uptime, ETL health, and access control for organisations running Aksh Health above EMIS Web and SystmOne.",
    roles: ["Administrator", "IT Lead"],
    problem: {
      title: "Integration failure is silent until clinics stall",
      body: "When overnight jobs fail or connectors drift, clinical teams feel it first — and audit answers arrive last.",
      icon: Link2,
    },
    outcome: {
      title: "Ops health you can prove",
      body: "Monitor connectors, tenancy controls, and immutable audit events from one admin surface.",
      icon: Shield,
    },
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, monitor, evidence",
      sectionDescription: "Three steps from integration setup to governance evidence.",
      steps: [
        {
          label: "01",
          title: "Connect systems",
          description: "Configure FHIR-ready paths and organisation tenancy.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Monitor health",
          description: "See ETL and connector status before clinic hours start.",
          icon: Activity,
        },
        {
          label: "03",
          title: "Evidence control",
          description: "Audit who accessed what and which writes were approved.",
          icon: Shield,
        },
      ],
    },
    ctaPrimary: { label: "Download integration brief", href: "/resources#integration" },
    ctaSecondary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Admin tools do not bypass clinician approval. See documentation for architecture and compliance pathways.",
  },
} as const satisfies Record<string, AudiencePageContent>;
