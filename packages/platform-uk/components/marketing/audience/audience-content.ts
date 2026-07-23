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

import { AUDIENCE_AGENT_MAPS, type AudienceAgentMap } from "@/lib/marketing/audience-agent-maps";

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
  agentMap: AudienceAgentMap;
  workflow: AudienceWorkflow;
  ctaPrimary: AudienceCta;
  ctaSecondary: AudienceCta;
  /** Optional third CTA (e.g. role dashboard) shown in hero / band */
  ctaTertiary?: AudienceCta;
  complianceNote: string;
};

export const audiencePages = {
  clinicians: {
    eyebrow: "For clinicians",
    headline: "Spend time with patients, not paperwork.",
    subline:
      "CANVAS → SYNTHESIS / GUARDIAN / HORIZON / PATHWAY under CONDUCTOR. You Approve before BRIDGE stages — liveEmis:false.",
    roles: ["GP", "Nurse", "Pharmacist"],
    problem: {
      title: "Notes and checks steal the evening",
      body: "You know the plan before the consult ends, then spend twenty minutes typing, reconciling meds, and chasing referrals across systems.",
      icon: ClipboardList,
    },
    outcome: {
      title: "One review queue before the record",
      body: "Named agents draft SOAP, safety, risk, and referrals. Accept, edit, or reject — SHIELD audits; nothing writes without you.",
      icon: Stethoscope,
    },
    agentMap: AUDIENCE_AGENT_MAPS.clinicians,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Capture, draft, approve",
      sectionDescription: "Three calm steps naming the agents in your loop.",
      disclaimer:
        "No outputs are written to the EHR without clinician approval. VOICE feeds CANVAS; Dr.Assist codes under SYNTHESIS — both are sub-capabilities. PRISM/ATLAS Phase 2. liveEmis:false.",
      steps: [
        {
          label: "01",
          title: "Capture (CANVAS)",
          description: "VOICE or notes during the consult. CANVAS structures shared intake context.",
          icon: Activity,
        },
        {
          label: "02",
          title: "Draft (agents)",
          description:
            "SYNTHESIS SOAP, GUARDIAN safety, HORIZON risk, PATHWAY referrals, NEXUS impression — CONDUCTOR orders the run.",
          icon: FileText,
        },
        {
          label: "03",
          title: "You approve (HITL)",
          description: "Accept, edit, or reject. SHIELD audits; BRIDGE stages only approved drafts — liveEmis:false.",
          icon: CheckSquare,
        },
      ],
    },
    ctaPrimary: { label: "Create account", href: "/signup?role=gp" },
    ctaSecondary: { label: "Guided demo script", href: "/demo/script" },
    ctaTertiary: { label: "Open GP dashboard", href: "/dashboard/gp" },
    complianceNote:
      "Clinician approval on every clinical output. NHS DCB0129 safety case in progress. See documentation for architecture and compliance pathways.",
  },
  hospitals: {
    eyebrow: "For hospitals",
    headline: "One command view for trust pressure.",
    subline:
      "HORIZON foresight, PATHWAY flow, COMPASS equity — with SHIELD audit. Synthetic PAS demo · not a live EPR feed.",
    roles: ["Hospital Executive", "Medical Director", "COO"],
    problem: {
      title: "Operational data lives in silos",
      body: "ED waits, beds, and staffing sit in separate tools. Leaders react after pressure arrives.",
      icon: Building2,
    },
    outcome: {
      title: "A single view before the surge",
      body: "See capacity and demand together via named agents, act earlier, and keep every recommendation auditable.",
      icon: BarChart3,
    },
    agentMap: AUDIENCE_AGENT_MAPS.hospitals,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, monitor, act",
      sectionDescription: "Three steps from fragmented feeds to governed executive action — agents named.",
      disclaimer:
        "Production deployment requires trust governance sign-off. Public demo uses synthetic capacity only — not live PAS/EPR. liveEmis:false.",
      steps: [
        {
          label: "01",
          title: "Connect (BRIDGE)",
          description: "Bring ED, ward, and workforce signals toward one command view — staging, not live PAS write-back.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Monitor (HORIZON · PATHWAY)",
          description: "Track waits, beds, and staffing gaps with foresight and flow drafts.",
          icon: Building2,
        },
        {
          label: "03",
          title: "Act with audit (SHIELD)",
          description: "Recommendations stay visible and logged for medical directors and CIOs.",
          icon: Shield,
        },
      ],
    },
    ctaPrimary: { label: "Open hospital demo", href: "/dashboard/hospital" },
    ctaSecondary: { label: "Guided demo script", href: "/demo/script" },
    ctaTertiary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Public command-centre demo uses synthetic capacity data only — not a live PAS/EPR feed. Immutable audit trails for operational recommendations. See documentation for architecture and compliance pathways.",
  },
  research: {
    eyebrow: "For research",
    headline: "Evaluate outcomes with governed access.",
    subline:
      "COMPASS aggregates and SHIELD audit today. ATLAS is Phase 2 — not built. Never claim live research agent.",
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
    agentMap: AUDIENCE_AGENT_MAPS.research,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Request, review, study",
      sectionDescription: "Three steps from access request to governed analysis — ATLAS stays roadmap.",
      disclaimer: "ATLAS Phase 2 (live:false). Aggregate access by default. Synthetic demo cohorts. liveEmis:false.",
      steps: [
        {
          label: "01",
          title: "Request access",
          description: "Define cohort scope and research purpose up front.",
          icon: Send,
        },
        {
          label: "02",
          title: "Governance (SHIELD)",
          description: "Ethics and data-minimisation checks gate what can be seen; SHIELD audits access.",
          icon: Shield,
        },
        {
          label: "03",
          title: "Study (COMPASS · not ATLAS)",
          description: "Work in governed aggregate views. ATLAS remains Phase 2 — not live in this build.",
          icon: TrendingUp,
        },
      ],
    },
    ctaPrimary: { label: "Create account", href: "/signup?role=researcher" },
    ctaSecondary: { label: "Open research demo", href: "/dashboard/researcher" },
    ctaTertiary: { label: "See platform agents", href: "/platform#agents" },
    complianceNote:
      "Aggregate access by default. ATLAS is Phase 2 — not built. Ethics boundaries remain explicit. See documentation for research governance pathways.",
  },
  patients: {
    eyebrow: "For patients",
    headline: "Your health, understood and supported.",
    subline:
      "Invited by your GP practice. Clinicians Approve CANVAS / SYNTHESIS / PATHWAY drafts — you follow the agreed plan.",
    roles: ["Patient"],
    problem: {
      title: "Care fades after the appointment",
      body: "Plans live in letters and portals. Between visits it is hard to know what matters next.",
      icon: HeartPulse,
    },
    outcome: {
      title: "A clear plan you can follow",
      body: "See what your care team agreed after clinician review, complete check-ins, and raise concerns without guessing who to call.",
      icon: Users,
    },
    agentMap: AUDIENCE_AGENT_MAPS.patients,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Invite, follow, stay supported",
      sectionDescription: "Three steps from practice invite to ongoing support — clinicians keep HITL.",
      disclaimer:
        "Patient access is practice-invited. Clinical decisions and EHR writes remain with your care team. liveEmis:false.",
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
          description: "View next steps after clinicians Approve PATHWAY / SYNTHESIS drafts.",
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
    ctaTertiary: { label: "Patient companion", href: "/dashboard/patient" },
    complianceNote:
      "Patient access is practice-invited. Clinical decisions remain with your care team. Agents draft for clinicians — not for patient self-write to the record.",
  },
  practices: {
    eyebrow: "For practices",
    headline: "Run the practice with clear oversight.",
    subline:
      "Oversee CONDUCTOR queue health, BRIDGE integrations, and SHIELD audit — clinicians still Approve clinical drafts. liveEmis:false.",
    roles: ["Practice Manager", "Admin"],
    problem: {
      title: "Ops visibility is scattered",
      body: "Who approved what, which integrations failed overnight, and whether the review queue is clearing are hard to answer in one place.",
      icon: Building2,
    },
    outcome: {
      title: "One operations view with audit",
      body: "Monitor team workload, BRIDGE health, and SHIELD approval trails from a single practice dashboard.",
      icon: Shield,
    },
    agentMap: AUDIENCE_AGENT_MAPS.practices,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Set up, oversee, evidence",
      sectionDescription: "Three steps from practice setup to governance-ready reporting — agents named.",
      disclaimer:
        "Clinical approval remains with named clinicians. Partner EMIS write-back is not enabled (liveEmis:false).",
      steps: [
        {
          label: "01",
          title: "Set up the practice",
          description: "Link organisation context and role access for your team.",
          icon: Building2,
        },
        {
          label: "02",
          title: "Oversee the queue (CONDUCTOR)",
          description:
            "See review backlog and BRIDGE integration health without peeking into clinical detail you do not need.",
          icon: ClipboardList,
        },
        {
          label: "03",
          title: "Evidence governance (SHIELD)",
          description: "Exportable audit trails for ICS and internal assurance.",
          icon: FileText,
        },
      ],
    },
    ctaPrimary: { label: "Create practice account", href: "/signup?role=practice-manager" },
    ctaSecondary: { label: "Guided demo script", href: "/demo/script" },
    ctaTertiary: { label: "Open admin dashboard", href: "/dashboard/admin" },
    complianceNote:
      "Practice oversight stays separate from clinical sign-off. liveEmis:false. See documentation for architecture and compliance pathways.",
  },
  ics: {
    eyebrow: "For ICS leads",
    headline: "See population health across your system.",
    subline:
      "COMPASS equity, HORIZON foresight, PATHWAY patterns — aggregates by default. Synthetic demo cohorts.",
    roles: ["ICS Lead", "Clinical Informatics"],
    problem: {
      title: "System intelligence arrives too late",
      body: "ICS teams need disparity and capacity signals across sites, but data often arrives as lagged extracts.",
      icon: TrendingUp,
    },
    outcome: {
      title: "System view without losing trust",
      body: "COMPASS-led equity and capacity views help leaders plan earlier while keeping patient detail out of population dashboards.",
      icon: BarChart3,
    },
    agentMap: AUDIENCE_AGENT_MAPS.ics,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, compare, plan",
      sectionDescription: "Three steps from site connection to ICS planning — COMPASS first.",
      disclaimer: "Population views are aggregate by default. Public demo uses synthetic data only. liveEmis:false.",
      steps: [
        {
          label: "01",
          title: "Connect sites (BRIDGE)",
          description: "Bring practices into a shared regional view — staging posture, not live EMR scrape.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Compare (COMPASS · HORIZON)",
          description: "See demand, outcomes, and equity gaps across the system.",
          icon: BarChart3,
        },
        {
          label: "03",
          title: "Plan capacity",
          description: "Use foresight views to prioritise support before winter pressure peaks. Site clinicians keep HITL.",
          icon: TrendingUp,
        },
      ],
    },
    ctaPrimary: { label: "Try ICS demo", href: "/dashboard/ics" },
    ctaSecondary: { label: "Guided demo script", href: "/demo/script" },
    ctaTertiary: { label: "Discuss a pilot", href: "/get-started" },
    complianceNote:
      "Population views are aggregate by default. Public demo uses synthetic data only. See documentation for ICS governance pathways.",
  },
  administrators: {
    eyebrow: "For administrators",
    headline: "Keep integrations healthy and auditable.",
    subline:
      "BRIDGE staging health, SHIELD audit, CONDUCTOR gate intact. Admins never bypass clinician Accept. liveEmis:false.",
    roles: ["Administrator", "IT Lead"],
    problem: {
      title: "Integration failure is silent until clinics stall",
      body: "When overnight jobs fail or connectors drift, clinical teams feel it first — and audit answers arrive last.",
      icon: Link2,
    },
    outcome: {
      title: "Ops health you can prove",
      body: "Monitor BRIDGE connectors, tenancy controls, and immutable SHIELD audit events from one admin surface.",
      icon: Shield,
    },
    agentMap: AUDIENCE_AGENT_MAPS.administrators,
    workflow: {
      sectionLabel: "Your care journey",
      sectionTitle: "Connect, monitor, evidence",
      sectionDescription: "Three steps from integration setup to governance evidence — agents named.",
      disclaimer: "Admin tools do not bypass clinician approval. EMIS write-back Not enabled. liveEmis:false.",
      steps: [
        {
          label: "01",
          title: "Connect systems (BRIDGE)",
          description: "Configure FHIR-ready paths and organisation tenancy — sim/staging today.",
          icon: Link2,
        },
        {
          label: "02",
          title: "Monitor health (CONDUCTOR)",
          description: "See ETL, connector, and orchestration status before clinic hours start.",
          icon: Activity,
        },
        {
          label: "03",
          title: "Evidence control (SHIELD)",
          description: "Audit who accessed what and which writes clinicians approved.",
          icon: Shield,
        },
      ],
    },
    ctaPrimary: { label: "Open admin dashboard", href: "/dashboard/admin" },
    ctaSecondary: { label: "Create account", href: "/signup?role=practice-manager" },
    ctaTertiary: { label: "Guided demo script", href: "/demo/script" },
    complianceNote:
      "Admin tools do not bypass clinician approval. liveEmis:false. See documentation for architecture and compliance pathways.",
  },
} as const satisfies Record<string, AudiencePageContent>;
