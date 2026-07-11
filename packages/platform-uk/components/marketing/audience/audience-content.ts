import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  HeartPulse,
  Link2,
  Phone,
  Scale,
  Send,
  Shield,
  Stethoscope,
  TrendingUp,
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
  iconBg: string;
  iconColor: string;
};

export type AudienceAgent = {
  name: string;
  tag: string;
  desc: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export type AudienceCta = {
  label: string;
  href: string;
};

export type AudiencePageContent = {
  eyebrow: string;
  headline: string;
  subline: string;
  roles?: string[];
  pains: [AudiencePain, AudiencePain, AudiencePain];
  capabilities: AudienceCapability[];
  workflowTitle: string;
  workflowDescription: string;
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
      "Aksh Health is designed for EMIS Web and SystmOne workflows. Specialist agents draft notes, check safety, and coordinate care. You approve every output before it reaches the record. Demo uses synthetic data.",
    roles: ["GP", "Nurse", "Pharmacist"],
    pains: [
      {
        title: "Admin overload",
        body: "Clinicians spend too much time on documentation and referral coordination instead of direct patient care.",
        icon: ClipboardList,
      },
      {
        title: "Fragmented safety checks",
        body: "Drug interactions, allergies, and risk scores sit in separate systems with no unified review path.",
        icon: Shield,
      },
      {
        title: "AI outputs without governance",
        body: "Generic AI tools produce documents that never reach the record or pass clinical safety review.",
        icon: FileText,
      },
    ],
    capabilities: [
      {
        title: "Clinical copilot",
        body: "Pre-consultation briefing, in-consultation decision support, and post-consultation task management within your existing workflow.",
        icon: Stethoscope,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "SYNTHESIS documentation",
        body: "Ambient note generation produces FHIR DocumentReference SOAP notes. You review, edit, and approve before anything is staged for the record.",
        icon: FileText,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
      },
      {
        title: "One review queue",
        body: "GUARDIAN safety checks, ORACLE risk scores, and referral drafts in one place. Accept, edit, or reject. Nothing proceeds without your approval.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
      {
        title: "Voice-to-note workflow",
        body: "Dictate naturally during consultation. VOICE transcribes in real time and SYNTHESIS structures the SOAP note for your review.",
        icon: Activity,
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        title: "Referral coordination",
        body: "REFERRAL AGENT drafts packages with criteria checks, missing investigations, and urgency prediction. You approve before send.",
        icon: Send,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
      },
      {
        title: "Risk scoring at point of care",
        body: "ORACLE surfaces CVD, T2D, and frailty scores plus 14-day admission prediction from the clinical knowledge graph.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
    ],
    workflowTitle: "Agents and dashboards for clinical teams",
    workflowDescription:
      "GP, nurse, and pharmacist views with review queue, vitals, handover, and medicines safety. Synthetic patients only in this build.",
    agents: [
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "Structured SOAP notes from consultation input in seconds, staged for clinician approval.",
        icon: FileText,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Drug interaction, allergy, and contraindication checking with BNF-validated red, amber, and green flags.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "CVD, T2D, and frailty risk scoring with 14-day admission prediction for proactive review.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        name: "DrASSIST",
        tag: "Clinical",
        desc: "Differential diagnosis and SNOMED-CT coding with confidence scores. GP overrides freely.",
        icon: Stethoscope,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
      },
      {
        name: "REFERRAL AGENT",
        tag: "Coordination",
        desc: "Auto-generates referral packages with criteria checks and urgency prediction.",
        icon: Send,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
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
      "Aksh Health gives hospital executives and operational leads a single view across wards, emergency demand, and workforce pressure. Designed for Epic, Oracle Health, and NHS Spine-connected environments. Synthetic data in this build.",
    roles: ["Hospital Executive", "Medical Director", "Chief Operating Officer"],
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
    capabilities: [
      {
        title: "Hospital command centre",
        body: "Real-time ED waiting times, bed occupancy, staff shortage alerts, and AI recommendations in one operational view for your trust.",
        icon: Building2,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        title: "Capacity prediction",
        body: "Admission forecasts and winter planning powered by the Capacity Prediction agent. Know bed demand up to 14 days ahead.",
        icon: BarChart3,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "Workforce intelligence",
        body: "Agency staff triggers, theatre utilisation optimisation, and elective scheduling aligned to ED demand patterns.",
        icon: Users,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Clinical risk at system level",
        body: "ORACLE admission prediction aggregated across wards helps medical directors prioritise flow and escalation pathways.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        title: "Governance and audit",
        body: "SHIELD immutable audit trail for operational recommendations and executive actions across connected systems.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
    ],
    workflowTitle: "Command centre for trust operations",
    workflowDescription:
      "Ward status, capacity forecasts, and staffing ratios for hospital executives. Synthetic patients only in this build.",
    agents: [
      {
        name: "HOSPITAL COMMAND",
        tag: "Operational",
        desc: "ED waiting times, bed occupancy, theatres, and pressure signals in one trust-wide operational view.",
        icon: Building2,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        name: "CAPACITY PREDICTION",
        tag: "Operational",
        desc: "14-day admission and discharge forecast with winter surge planning and discharge bottleneck detection.",
        icon: BarChart3,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Aggregated admission risk across wards for medical director review and flow prioritisation.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for operational AI recommendations and executive actions.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=hospital-executive" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Immutable audit trail and ICS-level governance dashboards for medical directors and CIOs. See documentation for architecture and compliance pathways.",
  },
  research: {
    eyebrow: "For research",
    headline: "Evaluate outcomes with governed data access.",
    subline:
      "Researchers and clinical informatics analysts study cohort metrics, AI-assisted care outcomes, and safety signals with clear governance boundaries. Pseudonymised synthetic cohorts in this build.",
    roles: ["Researcher", "Clinical Informatics", "Health Economist"],
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
    capabilities: [
      {
        title: "Cohort evaluation dashboards",
        body: "Outcome metrics, evaluation charts, and study-level KPIs for AI-assisted care pathways across defined patient cohorts.",
        icon: BarChart3,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "Governed data access",
        body: "Aggregate access by default with explicit ethics reference tracking. Individual-level access requires governance sign-off.",
        icon: Shield,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Authenticated export",
        body: "Download evaluation summaries as JSON authenticated to your researcher session for reproducible analysis workflows.",
        icon: FileText,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
      },
      {
        title: "Equity and disparity analysis",
        body: "EQUITY agent surfaces health disparities by IMD quintile and ethnicity for outcome studies and ICS reporting.",
        icon: Scale,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Safety signal monitoring",
        body: "Track GUARDIAN and ORACLE outputs across cohorts with SHIELD audit trails for pharmacovigilance-style review.",
        icon: Activity,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
    ],
    workflowTitle: "Research cohort overview",
    workflowDescription:
      "Cohort metrics, evaluation charts, and data access controls for clinical informatics research. Synthetic patients only in this build.",
    agents: [
      {
        name: "EQUITY",
        tag: "Population",
        desc: "Health disparity detection by IMD quintile and ethnicity for cohort outcome studies.",
        icon: Scale,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Cohort-level risk scoring and admission prediction for real-world evidence analysis.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for data access, exports, and governance approvals.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Safety signal aggregation across cohorts for pharmacovigilance-style monitoring.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=researcher" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "All cohort metrics in this build use pseudonymised synthetic patients. Production research access requires ethics approval and governance sign-off.",
  },
  patients: {
    eyebrow: "For patients",
    headline: "Your health, understood and supported.",
    subline:
      "The Health Companion keeps you connected to your care team between appointments. Check-ins, reminders, and secure messaging with clinician oversight. Demo uses synthetic data.",
    roles: ["Patient", "Carer"],
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
    capabilities: [
      {
        title: "Daily health check-ins",
        body: "Track symptoms and wellbeing between visits. Responses are reviewed by your care team when clinical action is needed.",
        icon: HeartPulse,
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        title: "Medication support",
        body: "Reminders and adherence support tailored to your conditions, with escalation to clinicians when concerns arise.",
        icon: ClipboardList,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Care plan in plain English",
        body: "See upcoming tasks, appointments, and lifestyle coaching in one companion view. You control what the AI can access.",
        icon: FileText,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
      },
      {
        title: "Post-discharge follow-up",
        body: "VOICE CARE AGENT makes outbound check-in calls after hospital discharge. Symptoms are escalated to your GP when needed.",
        icon: Phone,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
      },
      {
        title: "Clinician oversight always",
        body: "Every AI interaction is reviewed by your care team. You can opt out of AI-assisted features at any time.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
    ],
    workflowTitle: "Health Companion preview",
    workflowDescription:
      "Patient-facing companion for check-ins, medications, and care plan visibility. Ask your GP practice if they use Aksh Health.",
    agents: [
      {
        name: "HEALTH COMPANION",
        tag: "Patient",
        desc: "Daily check-ins, medication reminders, and care plan guidance in plain English.",
        icon: HeartPulse,
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
      },
      {
        name: "VOICE CARE AGENT",
        tag: "Patient",
        desc: "Outbound post-discharge calls that collect symptoms and escalate deterioration to your GP.",
        icon: Phone,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Medication safety checks with escalation to clinicians when concerns are flagged.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
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
      "Practice managers and administrators get tenancy controls, integration health views, and compliance evidence scaffolding. Designed for EMIS Web and SystmOne environments. Demo uses synthetic data.",
    roles: ["Practice Manager", "Practice Administrator"],
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
    capabilities: [
      {
        title: "Practice-level tenancy",
        body: "Configure sites, roles, and access boundaries for your organisation. Multi-site scaffolding for growing practices.",
        icon: Building2,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "Integration health",
        body: "Monitor EMIS and Mirth integration status with FHIR R4 ready pathways. Production interoperability is on the roadmap.",
        icon: Link2,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
      },
      {
        title: "SHIELD audit views",
        body: "Immutable audit trail for AI recommendations and clinician actions. Governance dashboards for practice leadership.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        title: "Review queue oversight",
        body: "Practice managers see queue clearance rates, AI adoption, and safety outcomes across clinical teams.",
        icon: ClipboardList,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Staff onboarding",
        body: "Role-based access for GPs, nurses, pharmacists, and admin staff with consistent permissions across sites.",
        icon: Users,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
      },
    ],
    workflowTitle: "Admin dashboard for practice operations",
    workflowDescription:
      "Integration health, tenant configuration, and SHIELD compliance views for practice administrators. Synthetic data in this build.",
    agents: [
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for AI recommendations and practice administrator actions.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "Practice-wide safety signal monitoring across clinical review queues.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "Documentation throughput and queue metrics for practice performance review.",
        icon: FileText,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=practice-manager" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways.",
  },
  ics: {
    eyebrow: "For ICS",
    headline: "See population health across your integrated care system.",
    subline:
      "ICS leads and clinical informatics teams get equity metrics, practice benchmarking, and admission forecasts across connected primary and secondary care. Synthetic cohorts in this build.",
    roles: ["ICS Lead", "Clinical Informatics", "Population Health"],
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
    capabilities: [
      {
        title: "Population health dashboards",
        body: "Risk distribution and deprivation-linked condition prevalence across practices in your ICS, powered by the clinical knowledge graph.",
        icon: BarChart3,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "EQUITY intelligence",
        body: "Health disparity flags by IMD quintile and ethnicity with recommended actions and monthly equity reporting.",
        icon: Scale,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Practice benchmarking",
        body: "Sortable practice scorecards for AI adoption, review queue clearance, and overall performance across your footprint.",
        icon: Building2,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        title: "Admission forecasting",
        body: "ICS-wide 14-day admission predictions from CAPACITY PREDICTION for winter planning and flow coordination.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        title: "Governed aggregate access",
        body: "Population views by default. Individual patient access requires explicit ICS governance approval.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
    ],
    workflowTitle: "ICS population intelligence",
    workflowDescription:
      "Population charts, equity deep-dives, and 14-day admission forecasts for integrated care leads. Synthetic data in this build.",
    agents: [
      {
        name: "EQUITY",
        tag: "Population",
        desc: "Health disparity detection by IMD quintile and ethnicity with monthly ICS equity reports.",
        icon: Scale,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        name: "CAPACITY PREDICTION",
        tag: "Operational",
        desc: "ICS-wide admission and discharge forecasts for system-level winter planning.",
        icon: BarChart3,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        name: "ORACLE",
        tag: "Risk",
        desc: "Aggregated risk distribution across practices for population health prioritisation.",
        icon: TrendingUp,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
      },
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Governance audit trail for ICS-level data access and population reporting.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=ics-lead" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Aggregate views only by default. Individual patient access requires explicit governance approval. See documentation for data access pathways.",
  },
  administrators: {
    eyebrow: "For administrators",
    headline: "Keep integrations healthy and governance auditable.",
    subline:
      "System administrators and clinical informatics leads monitor FHIR pipelines, tenancy boundaries, and SHIELD evidence across connected organisations. Designed for EMIS Web, SystmOne, and Mirth environments. Synthetic data in this build.",
    roles: ["System Administrator", "Clinical Informatics", "Integration Lead"],
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
    capabilities: [
      {
        title: "Integration health monitoring",
        body: "Track EMIS, Mirth, and FHIR R4 ready pipeline status from a single admin view. Production interoperability is on the roadmap.",
        icon: Link2,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
      },
      {
        title: "Multi-tenant configuration",
        body: "Manage organisation boundaries, role mappings, and access policies across practices and connected systems.",
        icon: Building2,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
      {
        title: "SHIELD audit infrastructure",
        body: "Immutable audit trail for AI recommendations and administrator actions. Governance scaffolding for compliance reviews.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        title: "FHIR pipeline visibility",
        body: "Monitor DocumentReference, Condition, and MedicationRequest staging queues across connected EHR environments.",
        icon: FileText,
        iconBg: "bg-emerald/10",
        iconColor: "text-emerald",
      },
      {
        title: "Role and access management",
        body: "Consistent RBAC across sites with audit logging for every permission change and tenancy boundary update.",
        icon: Users,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
      },
    ],
    workflowTitle: "Admin dashboard for system operations",
    workflowDescription:
      "Integration health, tenant configuration, and SHIELD compliance views for technical administrators. Synthetic data in this build.",
    agents: [
      {
        name: "SHIELD",
        tag: "Compliance",
        desc: "Immutable audit trail for administrator actions, integration events, and AI governance.",
        icon: Shield,
        iconBg: "bg-surface-muted",
        iconColor: "text-slate",
      },
      {
        name: "GUARDIAN",
        tag: "Safety",
        desc: "System-wide safety configuration and alert routing across connected clinical environments.",
        icon: Shield,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
      },
      {
        name: "SYNTHESIS",
        tag: "Clinical",
        desc: "FHIR DocumentReference pipeline monitoring and staging queue health metrics.",
        icon: FileText,
        iconBg: "bg-navy/10",
        iconColor: "text-navy",
      },
    ],
    ctaPrimary: { label: "Get Started", href: "/signup?role=practice-manager" },
    ctaSecondary: { label: "See platform", href: "/platform" },
    complianceNote:
      "Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways.",
  },
} as const satisfies Record<string, AudiencePageContent>;

export type AudiencePageKey = keyof typeof audiencePages;
