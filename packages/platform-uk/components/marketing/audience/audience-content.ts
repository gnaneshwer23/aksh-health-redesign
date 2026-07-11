import {
  Activity,
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  Database,
  FileText,
  HeartPulse,
  Link2,
  Phone,
  Scale,
  Send,
  Settings,
  Shield,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AudiencePain = {
  title: string;
  body: string;
  icon: LucideIcon;
};

export type AudienceCapability = {
  title: string;
  body: string;
  icon: LucideIcon;
};

export type AudienceAgent = {
  name: string;
  tag: string;
  desc: string;
  icon: LucideIcon;
};

export type AudienceSectionHeader = {
  label: string;
  title: string;
  description?: string;
};

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
  painSection: AudienceSectionHeader;
  pains: [AudiencePain, AudiencePain, AudiencePain];
  capabilitiesSection: AudienceSectionHeader;
  capabilities: AudienceCapability[];
  workflow: AudienceWorkflow;
  agentsSection: AudienceSectionHeader;
  agents: AudienceAgent[];
  ctaPrimary: AudienceCta;
  ctaSecondary: AudienceCta;
  complianceNote: string;
};

export const audiencePages = {
  clinicians: {
    eyebrow: "For clinicians",
    headline: "Spend time with patients, not paperwork.",
    subline:
      "Aksh Health is designed for EMIS Web and SystmOne workflows. Specialist agents draft notes, check safety, and coordinate care. You approve every output before it reaches the record.",
    roles: ["GP", "Nurse", "Pharmacist"],
    painSection: {
      label: "The challenge",
      title: "Challenges we hear every day",
      description: "Built for NHS workflows with clinician approval on every output.",
    },
    pains: [
      {
        title: "Notes typing eats the evening",
        body: "You know the patient, the plan, and the code before you finish the consultation. Then you spend the next twenty minutes typing it all up instead of seeing the next patient.",
        icon: ClipboardList,
      },
      {
        title: "One more interaction check away from missing one",
        body: "A new prescription for warfarin lands on a patient already on amiodarone. GUARDIAN flags the interaction the moment it appears, not after you have switched between the BNF, the record, and memory.",
        icon: Shield,
      },
      {
        title: "AI outputs without governance",
        body: "Generic AI tools produce documents that never reach the record or pass clinical safety review.",
        icon: FileText,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "How Aksh Health helps",
      description: "FHIR R4 ready outputs staged for review.",
    },
    capabilities: [
      {
        title: "Clinical copilot",
        body: "Pre-consultation briefing, in-consultation decision support, and post-consultation task management within your existing workflow.",
        icon: Stethoscope,
      },
      {
        title: "SYNTHESIS documentation",
        body: "Ambient note generation produces FHIR DocumentReference SOAP notes. You review, edit, and approve before anything is staged for the record.",
        icon: FileText,
      },
      {
        title: "One review queue",
        body: "GUARDIAN safety checks, ORACLE risk scores, and referral drafts in one place. Accept, edit, or reject. Nothing proceeds without your approval.",
        icon: Shield,
      },
      {
        title: "Voice-to-note workflow",
        body: "Dictate naturally during consultation. VOICE transcribes in real time and SYNTHESIS structures the SOAP note for your review.",
        icon: Activity,
      },
      {
        title: "Referral coordination",
        body: "REFERRAL AGENT drafts packages with criteria checks, missing investigations, and urgency prediction. You approve before send.",
        icon: Send,
      },
      {
        title: "Risk scoring at point of care",
        body: "ORACLE surfaces CVD, T2D, and frailty scores plus 14-day admission prediction from the clinical knowledge graph.",
        icon: TrendingUp,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From sign-up to staged FHIR draft",
      sectionDescription:
        "Seven steps from role selection through EHR write-back. Every AI output stays a draft until you approve it.",
      disclaimer: "No outputs are written to the EHR without clinician approval.",
      steps: [
        {
          label: "Register",
          title: "Sign up and role",
          description:
            "Choose GP, nurse, or pharmacist at registration. Your dashboard, permissions, and review queue adapt to your clinical role.",
          icon: UserPlus,
        },
        {
          label: "Onboard",
          title: "Practice onboarding",
          description:
            "Link your practice and EHR context. EMIS Web and SystmOne integration paths are configured during setup.",
          icon: Settings,
        },
        {
          label: "Context",
          title: "Patient context loads",
          description:
            "Patient records load into your clinician view with conditions, medications, and appointment context ready for consultation.",
          icon: Database,
        },
        {
          label: "Consult",
          title: "Consultation and agent drafts",
          description:
            "During consultation, SYNTHESIS drafts your SOAP note while GUARDIAN checks interactions and ORACLE scores risk in parallel.",
          icon: Stethoscope,
        },
        {
          label: "Review",
          title: "Review queue (HITL)",
          description:
            "All agent outputs appear in one review queue. Accept, edit, or reject each draft. Nothing proceeds without your explicit decision.",
          icon: CheckSquare,
        },
        {
          label: "Stage",
          title: "FHIR draft staged",
          description:
            "Approved outputs are staged as FHIR DocumentReference drafts. They are not auto-written to the EHR record until you confirm.",
          icon: FileText,
        },
        {
          label: "Write back",
          title: "EHR write-back on confirm",
          description:
            "On confirmation, the staged draft writes to EMIS Web or SystmOne. A short undo window lets you reverse the write-back before it is final.",
          icon: CheckSquare,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents and dashboards for clinical teams",
      description:
        "GP, nurse, and pharmacist views with review queue, vitals, handover, and medicines safety.",
    },
    agents: [
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "Structured SOAP notes from consultation input in seconds, staged for clinician approval.",
        icon: FileText,
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Drug interaction, allergy, and contraindication checking with BNF-validated red, amber, and green flags.",
        icon: Shield,
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "CVD, T2D, and frailty risk scoring with 14-day admission prediction for proactive review.",
        icon: TrendingUp,
      },
      {
        name: "Dr.Assist",
        tag: "Clinical",
        desc: "Differential diagnosis and SNOMED-CT coding with confidence scores. GP overrides freely.",
        icon: Stethoscope,
      },
      {
        name: "REFERRAL AGENT",
        tag: "Coordination",
        desc: "Auto-generates referral packages with criteria checks and urgency prediction.",
        icon: Send,
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=gp" },
    ctaSecondary: { label: "See it in action", href: "/demo/patel" },
    complianceNote:
      "Human-in-the-loop on every clinical output. NHS DCB0129 safety case in progress. See documentation for architecture and compliance pathways.",
  },
  hospitals: {
    eyebrow: "For hospitals",
    headline: "Command your hospital, not just your dashboard.",
    subline:
      "Aksh Health gives hospital executives and operational leads a single view across wards, emergency demand, and workforce pressure. Designed for Epic, Oracle Health, and NHS Spine-connected environments.",
    roles: ["Hospital Executive", "Medical Director", "Chief Operating Officer"],
    painSection: {
      label: "The challenge",
      title: "Operational pressure without a single view",
      description: "Built for trust leadership with governed AI recommendations and full audit trails.",
    },
    pains: [
      {
        title: "Fragmented operational data",
        body: "ED waits, bed occupancy, and staffing gaps sit in separate systems with no unified command view for trust leadership.",
        icon: Building2,
      },
      {
        title: "Reactive capacity planning",
        body: "Winter surges and elective backlogs are managed after pressure arrives, not when forecasts show demand building.",
        icon: BarChart3,
      },
      {
        title: "Workforce pressure without foresight",
        body: "Agency triggers and theatre utilisation are hard to align when ED demand shifts faster than rota planning cycles.",
        icon: Users,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "Command centre for trust operations",
      description: "Ward status, capacity forecasts, and staffing ratios for hospital executives.",
    },
    capabilities: [
      {
        title: "Hospital command centre",
        body: "Real-time ED waiting times, bed occupancy, staff shortage alerts, and AI recommendations in one operational view for your trust.",
        icon: Building2,
      },
      {
        title: "Capacity prediction",
        body: "Admission forecasts and winter planning powered by the Capacity Prediction agent. Know bed demand up to 14 days ahead.",
        icon: BarChart3,
      },
      {
        title: "Workforce intelligence",
        body: "Agency staff triggers, theatre utilisation optimisation, and elective scheduling aligned to ED demand patterns.",
        icon: Users,
      },
      {
        title: "Clinical risk at system level",
        body: "ORACLE admission prediction aggregated across wards helps medical directors prioritise flow and escalation pathways.",
        icon: TrendingUp,
      },
      {
        title: "Governance and audit",
        body: "SHIELD immutable audit trail for operational recommendations and executive actions across connected systems.",
        icon: Shield,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From connected systems to executive action",
      sectionDescription:
        "Four steps for hospital executives to monitor operations, forecast demand, and govern AI-assisted decisions across the trust.",
      disclaimer: "Production deployment requires trust governance sign-off.",
      steps: [
        {
          label: "Connect",
          title: "Link operational systems",
          description:
            "Connect ED, ward, theatre, and workforce data sources into a single Aksh Health command view for trust leadership.",
          icon: Link2,
        },
        {
          label: "Monitor",
          title: "Real-time command centre",
          description:
            "Track ED waits, bed occupancy, staffing gaps, and pressure signals in one operational dashboard updated in real time.",
          icon: Building2,
        },
        {
          label: "Forecast",
          title: "Capacity and demand planning",
          description:
            "Use 14-day admission forecasts and winter surge models to plan beds, theatres, and agency triggers before pressure builds.",
          icon: BarChart3,
        },
        {
          label: "Govern",
          title: "Audit executive actions",
          description:
            "SHIELD logs every operational recommendation and executive decision with immutable audit trails for medical directors and CIOs.",
          icon: Shield,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents for hospital operations",
      description:
        "Operational intelligence, capacity forecasting, and governance for trust-wide decision making.",
    },
    agents: [
      {
        name: "HOSPITAL COMMAND",
        tag: "Operational",
        desc: "ED waiting times, bed occupancy, theatres, and pressure signals in one trust-wide operational view.",
        icon: Building2,
      },
      {
        name: "CAPACITY PREDICTION",
        tag: "Operational",
        desc: "14-day admission and discharge forecast with winter surge planning and discharge bottleneck detection.",
        icon: BarChart3,
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Aggregated admission risk across wards for medical director review and flow prioritisation.",
        icon: TrendingUp,
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for operational AI recommendations and executive actions.",
        icon: Shield,
      },
    ],
    ctaPrimary: { label: "Request organisation access", href: "/get-started" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Immutable audit trail and ICS-level governance dashboards for medical directors and CIOs. See documentation for architecture and compliance pathways.",
  },
  research: {
    eyebrow: "For research",
    headline: "Evaluate outcomes with governed data access.",
    subline:
      "Researchers and clinical informatics analysts study cohort metrics, AI-assisted care outcomes, and safety signals with clear governance boundaries.",
    roles: ["Researcher", "Clinical Informatics", "Health Economist"],
    painSection: {
      label: "The challenge",
      title: "Evaluation data without clear governance",
      description: "Built for researchers with aggregate access by default and explicit ethics boundaries.",
    },
    pains: [
      {
        title: "Fragmented evaluation data",
        body: "Outcome metrics for AI-assisted workflows sit across EHR exports, spreadsheets, and ad hoc queries with no consistent cohort view.",
        icon: BarChart3,
      },
      {
        title: "Unclear access boundaries",
        body: "Ethics approvals and data access levels are hard to enforce when research tools bypass platform governance.",
        icon: Shield,
      },
      {
        title: "Slow export cycles",
        body: "Getting authenticated evaluation exports for board papers or publication often means manual IT requests and delayed turnaround.",
        icon: FileText,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "Governed research and evaluation",
      description: "Cohort metrics, evaluation charts, and data access controls for clinical informatics research.",
    },
    capabilities: [
      {
        title: "Cohort evaluation dashboards",
        body: "Outcome metrics, evaluation charts, and study-level KPIs for AI-assisted care pathways across defined patient cohorts.",
        icon: BarChart3,
      },
      {
        title: "Governed data access",
        body: "Aggregate access by default with explicit ethics reference tracking. Individual-level access requires governance sign-off.",
        icon: Shield,
      },
      {
        title: "Authenticated export",
        body: "Download evaluation summaries as JSON authenticated to your researcher session for reproducible analysis workflows.",
        icon: FileText,
      },
      {
        title: "Equity and disparity analysis",
        body: "EQUITY agent surfaces health disparities by IMD quintile and ethnicity for outcome studies and ICS reporting.",
        icon: Scale,
      },
      {
        title: "Safety signal monitoring",
        body: "Track GUARDIAN and ORACLE outputs across cohorts with SHIELD audit trails for pharmacovigilance-style review.",
        icon: Activity,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From cohort definition to outcome evaluation",
      sectionDescription:
        "Four steps for researchers to define study scope, access governed data, evaluate outcomes, and monitor safety signals.",
      disclaimer: "Production research access requires ethics approval and governance sign-off.",
      steps: [
        {
          label: "Define",
          title: "Set cohort and ethics scope",
          description:
            "Define study parameters, cohort inclusion criteria, and ethics reference boundaries before any data access is granted.",
          icon: ClipboardList,
        },
        {
          label: "Access",
          title: "Governed aggregate data",
          description:
            "Access population-level metrics and evaluation dashboards with aggregate views by default and audit logging on every query.",
          icon: Shield,
        },
        {
          label: "Evaluate",
          title: "Outcome analysis and export",
          description:
            "Study AI-assisted care outcomes with cohort dashboards and authenticated JSON exports for reproducible analysis.",
          icon: BarChart3,
        },
        {
          label: "Monitor",
          title: "Safety signal tracking",
          description:
            "Track GUARDIAN and ORACLE outputs across cohorts with SHIELD audit trails for pharmacovigilance-style review.",
          icon: Activity,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents for research and evaluation",
      description:
        "Cohort analytics, equity analysis, and safety monitoring for clinical informatics research.",
    },
    agents: [
      {
        name: "EQUITY",
        tag: "Population",
        desc: "Health disparity detection by IMD quintile and ethnicity for cohort outcome studies.",
        icon: Scale,
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Cohort-level risk scoring and admission prediction for real-world evidence analysis.",
        icon: TrendingUp,
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for data access, exports, and governance approvals.",
        icon: Shield,
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Safety signal aggregation across cohorts for pharmacovigilance-style monitoring.",
        icon: Shield,
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=researcher" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Production research access requires ethics approval and governance sign-off.",
  },
  patients: {
    eyebrow: "For patients",
    headline: "Your health, understood and supported.",
    subline:
      "The Health Companion keeps you connected to your care team between appointments. Check-ins, reminders, and secure messaging with clinician oversight.",
    roles: ["Patient", "Carer"],
    painSection: {
      label: "The challenge",
      title: "Care gaps between appointments",
      description: "Built for patients with clinician oversight on every AI interaction.",
    },
    pains: [
      {
        title: "Gaps between appointments",
        body: "Symptoms change after you leave the surgery, but getting timely advice can mean long waits on the phone.",
        icon: HeartPulse,
      },
      {
        title: "Medication confusion",
        body: "Multiple medicines and changing doses are hard to track without simple reminders and plain-language guidance.",
        icon: ClipboardList,
      },
      {
        title: "Unclear care plans",
        body: "Upcoming tasks, referrals, and lifestyle goals are often buried in letters rather than one accessible view.",
        icon: FileText,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "Your Health Companion",
      description: "Check-ins, medications, and care plan visibility with clinician oversight on every interaction.",
    },
    capabilities: [
      {
        title: "Daily health check-ins",
        body: "Track symptoms and wellbeing between visits. Responses are reviewed by your care team when clinical action is needed.",
        icon: HeartPulse,
      },
      {
        title: "Medication support",
        body: "Reminders and adherence support tailored to your conditions, with escalation to clinicians when concerns arise.",
        icon: ClipboardList,
      },
      {
        title: "Care plan in plain English",
        body: "See upcoming tasks, appointments, and lifestyle coaching in one companion view. You control what the AI can access.",
        icon: FileText,
      },
      {
        title: "Post-discharge follow-up",
        body: "VOICE CARE AGENT makes outbound check-in calls after hospital discharge. Symptoms are escalated to your GP when needed.",
        icon: Phone,
      },
      {
        title: "Clinician oversight always",
        body: "Every AI interaction is reviewed by your care team. You can opt out of AI-assisted features at any time.",
        icon: Shield,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "Stay connected to your care team",
      sectionDescription:
        "Four steps for patients to register, check in daily, receive care team review, and manage medications and care plans.",
      disclaimer: "Ask your GP practice if they use Aksh Health.",
      steps: [
        {
          label: "Register",
          title: "Access your companion",
          description:
            "Sign up through your GP practice to access the Health Companion with secure, NHS-aligned patient authentication.",
          icon: UserPlus,
        },
        {
          label: "Check in",
          title: "Daily health updates",
          description:
            "Log symptoms, wellbeing, and medication adherence between appointments. Responses are reviewed when clinical action is needed.",
          icon: HeartPulse,
        },
        {
          label: "Review",
          title: "Care team oversight",
          description:
            "Your GP or nurse reviews AI-assisted check-in responses and escalates concerns. You are never left without clinical support.",
          icon: Stethoscope,
        },
        {
          label: "Plan",
          title: "Care plan visibility",
          description:
            "See upcoming tasks, appointments, and lifestyle goals in plain English. Control what the AI can access at any time.",
          icon: ClipboardList,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents that support your care",
      description:
        "Patient-facing companions with clinician oversight on every interaction. Ask your GP practice if they use Aksh Health.",
    },
    agents: [
      {
        name: "HEALTH COMPANION",
        tag: "Patient",
        desc: "Daily check-ins, medication reminders, and care plan guidance in plain English.",
        icon: HeartPulse,
      },
      {
        name: "VOICE CARE AGENT",
        tag: "Patient",
        desc: "Outbound post-discharge calls that collect symptoms and escalate deterioration to your GP.",
        icon: Phone,
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Medication safety checks with escalation to clinicians when concerns are flagged.",
        icon: Shield,
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=patient" },
    ctaSecondary: { label: "Learn more", href: "/resources" },
    complianceNote: "Your data stays within your NHS care pathway. You can opt out of AI-assisted features at any time.",
  },
  practices: {
    eyebrow: "For practices",
    headline: "Run the practice with clear oversight.",
    subline:
      "Practice managers and administrators get tenancy controls, integration health views, and compliance evidence scaffolding. Designed for EMIS Web and SystmOne environments.",
    roles: ["Practice Manager", "Practice Administrator"],
    painSection: {
      label: "The challenge",
      title: "Practice operations without clear oversight",
      description: "Built for practice managers with tenancy controls and compliance evidence scaffolding.",
    },
    pains: [
      {
        title: "Limited integration visibility",
        body: "It is hard to see whether EHR feeds, FHIR pipelines, and third-party tools are healthy across the practice.",
        icon: Link2,
      },
      {
        title: "Role and access sprawl",
        body: "Onboarding clinicians, nurses, and admin staff across multiple sites needs consistent tenancy and permissions.",
        icon: Users,
      },
      {
        title: "Compliance evidence gaps",
        body: "CQC, DSPT, and clinical safety audits need immutable trails, not spreadsheets assembled after the fact.",
        icon: Shield,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "Practice management and governance",
      description: "Integration health, tenant configuration, and SHIELD compliance views for practice administrators.",
    },
    capabilities: [
      {
        title: "Practice-level tenancy",
        body: "Configure sites, roles, and access boundaries for your organisation. Multi-site scaffolding for growing practices.",
        icon: Building2,
      },
      {
        title: "Integration health",
        body: "Monitor EMIS and Mirth integration status with FHIR R4 ready pathways. Production interoperability is on the roadmap.",
        icon: Link2,
      },
      {
        title: "SHIELD audit views",
        body: "Immutable audit trail for AI recommendations and clinician actions. Governance dashboards for practice leadership.",
        icon: Shield,
      },
      {
        title: "Review queue oversight",
        body: "Practice managers see queue clearance rates, AI adoption, and safety outcomes across clinical teams.",
        icon: ClipboardList,
      },
      {
        title: "Staff onboarding",
        body: "Role-based access for GPs, nurses, pharmacists, and admin staff with consistent permissions across sites.",
        icon: Users,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From practice setup to team governance",
      sectionDescription:
        "Six steps for practice managers to configure tenancy, monitor team performance, and maintain compliance evidence.",
      disclaimer: "Production tenancy requires practice administrator sign-off.",
      steps: [
        {
          label: "Register",
          title: "Practice manager sign-up",
          description:
            "Register as practice manager or administrator. You receive tenancy controls and oversight dashboards for your organisation.",
          icon: UserPlus,
        },
        {
          label: "Configure",
          title: "Practice and role setup",
          description:
            "Set up sites, invite clinicians, and assign role-based access for GPs, nurses, pharmacists, and admin staff.",
          icon: Settings,
        },
        {
          label: "Monitor",
          title: "Team dashboards",
          description:
            "Monitor GP, nurse, and admin views from a practice-level overview. See queue clearance, agent adoption, and daily activity.",
          icon: Users,
        },
        {
          label: "Audit",
          title: "Compliance and audit",
          description:
            "SHIELD provides an immutable audit trail of AI recommendations and clinician actions for CQC, DSPT, and clinical safety reviews.",
          icon: Shield,
        },
        {
          label: "Population",
          title: "Population oversight",
          description:
            "Practice-level population view shows risk distribution, queue trends, and operational metrics across your registered list.",
          icon: BarChart3,
        },
        {
          label: "Govern",
          title: "HITL governance across team",
          description:
            "Set practice-wide policies for human-in-the-loop review. Monitor that no AI output bypasses clinician approval before the record.",
          icon: CheckSquare,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents for practice operations",
      description:
        "Compliance, safety monitoring, and documentation metrics for practice administrators.",
    },
    agents: [
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for AI recommendations and practice administrator actions.",
        icon: Shield,
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Practice-wide safety signal monitoring across clinical review queues.",
        icon: Shield,
      },
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "Documentation throughput and queue metrics for practice performance review.",
        icon: FileText,
      },
    ],
    ctaPrimary: { label: "Request organisation access", href: "/get-started" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways.",
  },
  ics: {
    eyebrow: "For ICS",
    headline: "See population health across your integrated care system.",
    subline:
      "ICS leads and clinical informatics teams get equity metrics, practice benchmarking, and admission forecasts across connected primary and secondary care.",
    roles: ["ICS Lead", "Clinical Informatics", "Population Health"],
    painSection: {
      label: "The challenge",
      title: "Population health without a system view",
      description: "Built for ICS leads with aggregate access by default and governed individual-level access.",
    },
    pains: [
      {
        title: "Uneven practice performance",
        body: "AI adoption, queue clearance, and safety outcomes vary widely across practices with no shared scorecard.",
        icon: BarChart3,
      },
      {
        title: "Equity gaps hard to quantify",
        body: "Health disparities by deprivation and ethnicity are difficult to surface consistently across the ICS footprint.",
        icon: Scale,
      },
      {
        title: "Reactive system planning",
        body: "Admission pressure and winter demand are managed practice by practice instead of from an ICS-wide forecast.",
        icon: TrendingUp,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "ICS population intelligence",
      description: "Population charts, equity deep-dives, and 14-day admission forecasts for integrated care leads.",
    },
    capabilities: [
      {
        title: "Population health dashboards",
        body: "Risk distribution and deprivation-linked condition prevalence across practices in your ICS, powered by the clinical knowledge graph.",
        icon: BarChart3,
      },
      {
        title: "EQUITY intelligence",
        body: "Health disparity flags by IMD quintile and ethnicity with recommended actions and monthly equity reporting.",
        icon: Scale,
      },
      {
        title: "Practice benchmarking",
        body: "Sortable practice scorecards for AI adoption, review queue clearance, and overall performance across your footprint.",
        icon: Building2,
      },
      {
        title: "Admission forecasting",
        body: "ICS-wide 14-day admission predictions from CAPACITY PREDICTION for winter planning and flow coordination.",
        icon: TrendingUp,
      },
      {
        title: "Governed aggregate access",
        body: "Population views by default. Individual patient access requires explicit ICS governance approval.",
        icon: Shield,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From population data to system planning",
      sectionDescription:
        "Four steps for ICS leads to aggregate population metrics, benchmark practices, surface equity gaps, and plan system-wide capacity.",
      disclaimer: "Aggregate views only by default.",
      steps: [
        {
          label: "Aggregate",
          title: "Population health overview",
          description:
            "View risk distribution, condition prevalence, and deprivation-linked metrics across all practices in your ICS footprint.",
          icon: BarChart3,
        },
        {
          label: "Benchmark",
          title: "Practice performance scorecards",
          description:
            "Compare AI adoption, queue clearance rates, and safety outcomes across practices with sortable benchmarking dashboards.",
          icon: Building2,
        },
        {
          label: "Equity",
          title: "Disparity analysis",
          description:
            "Surface health disparities by IMD quintile and ethnicity with EQUITY intelligence and recommended actions for ICS reporting.",
          icon: Scale,
        },
        {
          label: "Plan",
          title: "System-wide forecasting",
          description:
            "Use ICS-wide 14-day admission predictions for winter planning, flow coordination, and proactive capacity management.",
          icon: TrendingUp,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents for population health",
      description:
        "Equity analysis, capacity forecasting, and governance for integrated care system leads.",
    },
    agents: [
      {
        name: "EQUITY",
        tag: "Population",
        desc: "Health disparity detection by IMD quintile and ethnicity with monthly ICS equity reports.",
        icon: Scale,
      },
      {
        name: "CAPACITY PREDICTION",
        tag: "Operational",
        desc: "ICS-wide admission and discharge forecasts for system-level winter planning.",
        icon: BarChart3,
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Aggregated risk distribution across practices for population health prioritisation.",
        icon: TrendingUp,
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Governance audit trail for ICS-level data access and population reporting.",
        icon: Shield,
      },
    ],
    ctaPrimary: { label: "Request organisation access", href: "/get-started" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Aggregate views only by default. Individual patient access requires explicit governance approval. See documentation for data access pathways.",
  },
  administrators: {
    eyebrow: "For administrators",
    headline: "Keep integrations healthy and governance auditable.",
    subline:
      "System administrators and clinical informatics leads monitor FHIR pipelines, tenancy boundaries, and SHIELD evidence across connected organisations. Designed for EMIS Web, SystmOne, and Mirth environments.",
    roles: ["System Administrator", "Clinical Informatics", "Integration Lead"],
    painSection: {
      label: "The challenge",
      title: "Integration and governance without visibility",
      description: "Built for system administrators with FHIR pipeline monitoring and immutable audit trails.",
    },
    pains: [
      {
        title: "Opaque integration status",
        body: "EMIS feeds, Mirth channels, and FHIR pipelines fail quietly until clinicians report missing data in the record.",
        icon: Link2,
      },
      {
        title: "Tenancy sprawl across sites",
        body: "Configuring roles, sites, and access boundaries across multiple organisations needs consistent technical controls.",
        icon: Users,
      },
      {
        title: "Audit evidence assembled late",
        body: "DSPT and clinical safety reviews need immutable trails of AI recommendations and administrator actions, not retrospective exports.",
        icon: Shield,
      },
    ],
    capabilitiesSection: {
      label: "How we help",
      title: "System operations and governance",
      description: "Integration health, tenant configuration, and SHIELD compliance views for technical administrators.",
    },
    capabilities: [
      {
        title: "Integration health monitoring",
        body: "Track EMIS, Mirth, and FHIR R4 ready pipeline status from a single admin view. Production interoperability is on the roadmap.",
        icon: Link2,
      },
      {
        title: "Multi-tenant configuration",
        body: "Manage organisation boundaries, role mappings, and access policies across practices and connected systems.",
        icon: Building2,
      },
      {
        title: "SHIELD audit infrastructure",
        body: "Immutable audit trail for AI recommendations and administrator actions. Governance scaffolding for compliance reviews.",
        icon: Shield,
      },
      {
        title: "FHIR pipeline visibility",
        body: "Monitor DocumentReference, Condition, and MedicationRequest staging queues across connected EHR environments.",
        icon: FileText,
      },
      {
        title: "Role and access management",
        body: "Consistent RBAC across sites with audit logging for every permission change and tenancy boundary update.",
        icon: Users,
      },
    ],
    workflow: {
      sectionLabel: "Your workflow",
      sectionTitle: "From tenancy setup to governed operations",
      sectionDescription:
        "Four steps for system administrators to configure tenancy, monitor integrations, manage access, and maintain audit evidence.",
      disclaimer: "Production deployment requires organisation governance sign-off.",
      steps: [
        {
          label: "Configure",
          title: "Tenancy and organisation setup",
          description:
            "Configure organisation boundaries, sites, and role mappings with consistent RBAC across connected practices and systems.",
          icon: Settings,
        },
        {
          label: "Monitor",
          title: "Integration health dashboard",
          description:
            "Track EMIS feeds, Mirth channels, and FHIR R4 pipeline status from a single admin view with proactive alerting.",
          icon: Link2,
        },
        {
          label: "Manage",
          title: "Access and permissions",
          description:
            "Manage role-based access across sites with audit logging for every permission change and tenancy boundary update.",
          icon: Users,
        },
        {
          label: "Audit",
          title: "SHIELD governance evidence",
          description:
            "Maintain immutable audit trails of administrator actions, integration events, and AI governance for DSPT and clinical safety reviews.",
          icon: Shield,
        },
      ],
    },
    agentsSection: {
      label: "AI agents",
      title: "Agents for system administration",
      description:
        "Compliance, safety configuration, and FHIR pipeline monitoring for technical administrators.",
    },
    agents: [
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for administrator actions, integration events, and AI governance.",
        icon: Shield,
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "System-wide safety configuration and alert routing across connected clinical environments.",
        icon: Shield,
      },
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "FHIR DocumentReference pipeline monitoring and staging queue health metrics.",
        icon: FileText,
      },
    ],
    ctaPrimary: { label: "Download integration architecture brief", href: "/resources#integration" },
    ctaSecondary: { label: "Request organisation access", href: "/get-started" },
    complianceNote:
      "Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways.",
  },
} as const satisfies Record<string, AudiencePageContent>;

export type AudiencePageKey = keyof typeof audiencePages;
