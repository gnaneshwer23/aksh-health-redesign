export type PageMetadata = {
  title: string;
  description: string;
};

export type HeroAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type HeroContent = {
  kicker: string;
  title: string;
  description: string;
  pills: string[];
  actions: HeroAction[];
  preview?: {
    label: string;
    title: string;
    rows: Array<{ label: string; count: string; status: "good" | "warn" | "danger" }>;
    miniCards: Array<{ strong: string; span: string }>;
  };
};

export type Stat = {
  value: string;
  label: string;
  detail: string;
};

export type Capability = {
  icon: string;
  title: string;
  text: string;
  items: string[];
};

export type WorkflowStep = {
  step: string;
  title: string;
  text: string;
};

export type RoleCard = {
  role: string;
  promise: string;
  detail: string;
  href: string;
  cta: string;
  primary?: boolean;
};

export type SectionBlock = {
  kicker: string;
  title: string;
  description: string;
};

export type ProofCard = {
  title: string;
  text: string;
  tag?: string;
};

export type PartnerAudience = {
  audience: string;
  promise: string;
  detail: string;
  items: string[];
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export type CtaBand = {
  kicker: string;
  title: string;
  description: string;
  actions: HeroAction[];
};

function defineHero(hero: HeroContent): HeroContent {
  return hero;
}

function defineCta(cta: CtaBand): CtaBand {
  return cta;
}

export const site = {
  name: "Aksh Health",
  region: "India",
  contactEmail: "hello@akshhealth.in",
  proofNotice:
    "Phase 3 India launch (Month 13 target). Synthetic-safe proof today — no live patient data until AWS Mumbai (ap-south-1) and DPDPA controls are live. CDSCO and ABDM registrations are roadmap targets, not current claims.",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/for-clinicians", label: "Clinicians" },
  { href: "/for-amcs", label: "Clinics" },
  { href: "/for-partners", label: "Partners" },
];

export const trustBadges = [
  "ABDM-native architecture",
  "FHIR R4 + ABHA roadmap",
  "DPDPA 2023 design",
  "6-language SOAP target",
  "CDSCO Class B pathway",
];

export const homePage = {
  metadata: {
    title: "Aksh Health India — ABDM-Native Clinical AI Platform",
    description:
      "6-language SOAP documentation, ABDM-native FHIR, and clinician-owned review for India clinics. Built on UK-validated evidence — scaling for Mumbai and beyond.",
  },
  hero: defineHero({
    kicker: "ABDM-native platform · Phase 3 India",
    title: "Less paperwork. More care. Clinician-owned AI.",
    description:
      "India's 600,000+ doctors spend 40–50% of consultation time on documentation. Aksh Health turns multilingual consults into structured SOAP notes, ABDM-ready FHIR, and review-gated outputs — with DPDPA residency and CDSCO pathway built in from day one.",
    pills: ["6-language SOAP", "ABHA + FHIR R4", "Practo / HealthPlix", "WhatsApp follow-up"],
    actions: [
      { label: "Request pilot conversation", href: "/for-partners", variant: "primary" },
      { label: "View clinician workflow", href: "/for-clinicians", variant: "secondary" },
    ],
    preview: {
      label: "Platform cockpit",
      title: "Clinical Workflow Status",
      rows: [
        { label: "Review queue", count: "4 pending", status: "warn" },
        { label: "Safety flags", count: "1 blocked", status: "danger" },
        { label: "Consent coverage", count: "Active", status: "good" },
        { label: "Validation gate", count: "Pilot prep", status: "warn" },
      ],
      miniCards: [
        { strong: "FHIR R4", span: "Evidence shape" },
        { strong: "Human gate", span: "Every decision" },
        { strong: "Synthetic", span: "Safe boundary" },
        { strong: "Audit trail", span: "Decision history" },
      ],
    },
  }),
  stats: [
    {
      value: "600K+",
      label: "Registered doctors",
      detail: "India addressable market — clinics seeing 80–150 patients per day with chronic documentation burden.",
    },
    {
      value: "6",
      label: "Clinical languages",
      detail: "Hindi, Tamil, Telugu, Bengali, Kannada, and English — IndicBERT + Azure Speech roadmap.",
    },
    {
      value: "60%",
      label: "Doc time reduction target",
      detail: "Validation study V-IN5 target for Mumbai and Delhi pilots — time-motion evidence for CDSCO.",
    },
    {
      value: "Rs.20K",
      label: "Clinic SaaS anchor",
      detail: "Beachhead pricing for ≤5 doctor clinics — ROI from minutes saved per doctor per day.",
    },
  ],
  capabilitiesSection: {
    kicker: "India platform stack",
    title: "Built for ABDM, multilingual care, and clinic scale.",
    description:
      "Same FHIR R4 and review-first architecture as the UK proof — with India-specific NLP, EHR connectors, patient engagement, and regulatory path.",
  },
  capabilities: [
    {
      icon: "01",
      title: "6-Language SOAP & ASR",
      text: "Consultations in Hindi, Tamil, Telugu, Bengali, Kannada, or English become structured SOAP notes — with IndicBERT NER and Azure Speech on the roadmap.",
      items: [
        "Priority: Hindi, Tamil, Telugu clinical NER",
        "Medical English via Deepgram in urban clinics",
        "ICMR terminology — not NICE pathways",
      ],
    },
    {
      icon: "02",
      title: "Clinician-Owned Review",
      text: "Human gates before any note is final. Indian Pharmacopoeia DDI checks, safety flags, and frozen artifacts for CDSCO evidence.",
      items: [
        "Reviewer checklist before accept or defer",
        "Zero false negatives target on critical DDI (V-IN4)",
        "NMC telemedicine oversight compatible design",
      ],
    },
    {
      icon: "03",
      title: "ABDM-Native FHIR",
      text: "Medplum FHIR with ABDM profiles, ABHA patient identity, and HIP/HIU registration pathway with NHA.",
      items: [
        "Practo + HealthPlix write-back roadmap",
        "AWS Mumbai (ap-south-1) data residency",
        "DPDPA 2023 consent manager design",
      ],
    },
    {
      icon: "04",
      title: "Patient Engagement & Scale",
      text: "WhatsApp Business API and Vapi India IVR for reminders — plus federated learning across city, Tier-2, and PHC sites.",
      items: [
        "WhatsApp no-show reduction target <20%",
        "3-site federated learning by Month 22",
        "UK validates → India scales → EU expands",
      ],
    },
  ],
  howItWorksSection: {
    kicker: "Sequencing rule",
    title: "UK validates. India scales. EU expands.",
    description:
      "Every pound spent on UK Phase 1–2 also advances India launch — shared FHIR, LangGraph orchestration, and clinical evidence for CDSCO.",
  },
  howItWorks: [
    {
      step: "01",
      title: "Capture in any language",
      text: "Voice, transcript, or note in Hindi, Tamil, Telugu, Bengali, Kannada, or English — mapped to SOAP structure with India clinical vocabulary.",
    },
    {
      step: "02",
      title: "Review before write-back",
      text: "Clinician confirms drafts, DDI checks against Indian Pharmacopoeia, and safety flags — then pushes ABDM-compliant FHIR to Practo or HealthPlix.",
    },
    {
      step: "03",
      title: "Engage and learn safely",
      text: "WhatsApp reminders reduce no-shows. Federated learning improves models across Mumbai, Tier-2, and PHC sites without moving raw PHI.",
    },
  ],
  rolesSection: {
    kicker: "Built for your role",
    title: "Clinics, clinicians, and partners — each with a lane.",
    description:
      "Beachhead: Mumbai private clinics (BKC, Lower Parel, South Mumbai). Scale path: 30 paying clinics by Month 18.",
  },
  roles: [
    {
      role: "GP / Clinical Lead",
      promise: "Finish notes before the next patient.",
      detail:
        "Hindi-first dashboard, SOAP editor, DrASSIST India panel, and review gates — built for 100–150 patients per day.",
      href: "/for-clinicians",
      cta: "Clinician path",
      primary: true,
    },
    {
      role: "Clinic Operator",
      promise: "DPDPA-ready ops across sites.",
      detail:
        "Consent, ABHA identity, AWS Mumbai residency, and multi-clinic governance — from pilot to Rs.20K/month SaaS.",
      href: "/for-amcs",
      cta: "Clinic network path",
    },
    {
      role: "Partner",
      promise: "Rs.1.64Cr Year-1 India ARR path.",
      detail:
        "Investors, hospital networks, ABDM marketplace, Apollo/Manipal channels, and pharma RWE studies.",
      href: "/for-partners",
      cta: "Partner path",
    },
  ],
  testimonialsSection: {
    kicker: "Pilot narrative",
    title: "Designed for Mumbai clinics first.",
    description:
      "Synthetic proof today — Mumbai 3-clinic and Delhi 2-clinic pilots targeted for Month 14–15 with 90-day free trials.",
  },
  testimonials: [
    {
      quote:
        "If Hindi SOAP is as fast as they claim, this pays for itself in the first hour of every morning OPD — before we even talk hospital SaaS.",
      name: "Dr. Vikram S.",
      role: "GP, South Mumbai multi-specialty clinic",
      initials: "VS",
    },
    {
      quote:
        "ABDM marketplace buyers want HIP-ready tools with Mumbai data residency — not another English-only scribe bolted onto Practo.",
      name: "Neha P.",
      role: "Clinic operations, BKC digital-ready facility",
      initials: "NP",
    },
    {
      quote:
        "UK RCT evidence plus India pilot data is the right CDSCO story — we are not funding two separate regulatory tracks.",
      name: "Arjun M.",
      role: "Health tech investor, Series A diligence",
      initials: "AM",
    },
  ],
  cta: defineCta({
    kicker: "Mumbai beachhead · Month 13 launch target",
    title: "Join the India pilot waitlist.",
    description:
      "Targeting 5 clinics in the first 30 days via warm introductions — then ABDM marketplace and hospital network channels. Synthetic demo available today.",
    actions: [
      { label: "Request pilot conversation", href: "mailto:hello@akshhealth.in?subject=Aksh%20Health%20India%20Pilot", variant: "primary" },
      { label: "For clinicians", href: "/for-clinicians", variant: "secondary" },
      { label: "For clinic networks", href: "/for-amcs", variant: "secondary" },
    ],
  }),
};

export const amcsPage = {
  metadata: {
    title: "For Clinics & Hospital Networks — Aksh Health India",
    description:
      "DPDPA-compliant Mumbai deployment, ABHA identity, multi-clinic governance, and federated learning for India clinic and hospital operators.",
  },
  hero: defineHero({
    kicker: "For clinic & hospital operators",
    title: "DPDPA-ready ops from Mumbai to Tier-2 and PHC.",
    description:
      "AWS ap-south-1 residency, DPDPA 2023 consent architecture, and ABDM HIP/HIU registration pathway — built for 50–200 bed facilities scaling from 5-clinic pilots to 30 paying sites.",
    pills: ["AWS Mumbai", "ABHA identity", "DPDPA 2023", "Federated learning"],
    actions: [
      { label: "Schedule clinic walkthrough", href: "mailto:hello@akshhealth.in?subject=Clinic%20Network%20Walkthrough", variant: "primary" },
      { label: "Partner with us", href: "/for-partners", variant: "secondary" },
    ],
  }),
  sections: [
    {
      kicker: "DPDPA 2023 architecture",
      title: "Health data stays in India before launch.",
      description:
        "Sensitive personal data requires AWS Mumbai deployment, consent manager, and DPO appointment — targeted Month 11–13 before any live patient processing.",
    },
    {
      kicker: "Multi-site scale path",
      title: "City clinic → Tier-2 → rural PHC federated loop.",
      description:
        "Governed model improvement across three site types by Month 22 — secure aggregation without casual raw PHI movement.",
    },
  ],
  proofCards: [
    {
      tag: "Beachhead",
      title: "Mumbai private clinics",
      text: "BKC, Lower Parel, and South Mumbai — 100–150 patients/day, Rs.20K/month SaaS for ≤5 doctors, 90-day pilot trials.",
    },
    {
      tag: "Hospital SaaS",
      title: "CDSCO-gated expansion",
      text: "Rs.50K–2L/month for >5 doctor hospitals — Class B approval target Month 18 unlocks government and NABH procurement.",
    },
    {
      tag: "ABDM",
      title: "Marketplace + HIP/HIU",
      text: "NHA registration and ABHA integration roadmap — clinics enrolled in ABDM actively seek compliant documentation tools.",
    },
  ],
  stats: [
    { value: "30", label: "Paying clinics target", detail: "Month 18 India Scale gate — convert Mumbai/Delhi pilots plus referral onboarding." },
    { value: "5", label: "Clinics in 30 days", detail: "Direct sales target at launch via India Country Head warm introductions." },
    { value: "3", label: "Federated sites", detail: "City + Tier-2 + PHC active federated learning target by Month 22." },
    { value: "M13", label: "Phase 3 launch", detail: "Medplum FHIR with ABDM profiles on AWS Mumbai — after Months 11–12 prep." },
  ],
  cta: defineCta({
    kicker: "Clinic network pilots",
    title: "Mumbai and Delhi cohorts opening Month 14–15.",
    description:
      "Multi-specialty clinics with digital-ready management teams — English-comfortable senior doctors and willingness to pay for documentation productivity.",
    actions: [
      { label: "Email clinic team", href: "mailto:hello@akshhealth.in?subject=Clinic%20Pilot%20Conversation", variant: "primary" },
      { label: "View home", href: "/", variant: "secondary" },
    ],
  }),
};

export const cliniciansPage = {
  metadata: {
    title: "For Clinicians — Aksh Health India",
    description:
      "Hindi-first GP dashboard, 6-language SOAP documentation, Indian Pharmacopoeia DDI checks, and ICMR-aligned clinical AI for India doctors.",
  },
  hero: defineHero({
    kicker: "For GPs and clinical leads",
    title: "SOAP notes in Hindi — reviewed before they ship.",
    description:
      "Built for 80–150 patients per day. Structured SOAP from voice or transcript, DrASSIST India panel, Indian Pharmacopoeia safety checks, and explicit clinician sign-off — not auto-generated chart dumps.",
    pills: ["Hindi-first UI", "6-language SOAP", "ICMR guidelines", "Indian Pharmacopoeia DDI"],
    actions: [
      { label: "See workflow stages", href: "#workflow", variant: "primary" },
      { label: "Request demo", href: "mailto:hello@akshhealth.in?subject=Clinician%20Demo", variant: "secondary" },
    ],
  }),
  sections: [
    {
      kicker: "Multilingual documentation",
      title: "Speak Hindi. Review structured SOAP. Sign off.",
      description:
        "IndicBERT + Azure Speech roadmap for Hindi, Tamil, Telugu, Bengali, and Kannada — with English medical NLP for urban clinics. Target: ≥90% Hindi SOAP F1 by Month 14.",
    },
    {
      kicker: "India clinical safety",
      title: "ICMR and Indian Pharmacopoeia — not NICE or BNF.",
      description:
        "Drug interaction checks against Indian Pharmacopoeia with zero false negatives on critical conflicts (V-IN4). Allergy and high-risk medication flags stay visible until you decide.",
    },
  ],
  proofCards: [
    {
      tag: "Dashboard",
      title: "Hindi GP dashboard",
      text: "Next.js Hindi-first SOAP editor with DrASSIST India panel — GP NPS ≥40 target in Hindi usability testing Month 14.",
    },
    {
      tag: "Engagement",
      title: "WhatsApp follow-up",
      text: "Medication reminders and appointment follow-up via WhatsApp Business API — no-show rate target <20% vs ~40% baseline.",
    },
    {
      tag: "Write-back",
      title: "Practo + HealthPlix",
      text: "ABDM FHIR write-back to Practo and HealthPlix with handwritten Rx OCR on the integration roadmap — sandbox Month 12.",
    },
  ],
  workflowSection: {
    kicker: "Clinical workflow",
    title: "Consult → review → document → engage.",
    description: "NMC telemedicine guidelines compatible — AI assists, NMC-registered clinician retains oversight.",
  },
  workflow: [
    {
      step: "01",
      title: "Multilingual capture",
      text: "Voice or transcript in any supported language — ASR and NER tuned for India clinical vocabulary.",
    },
    {
      step: "02",
      title: "SOAP draft + DDI",
      text: "Structured SOAP generates with Indian Pharmacopoeia interaction checks and ranked safety flags.",
    },
    {
      step: "03",
      title: "Clinician sign-off",
      text: "Review, edit, accept, or defer — frozen artifact and audit trail on every decision.",
    },
    {
      step: "04",
      title: "ABDM write-back",
      text: "Confirmed notes push as ABDM-compliant FHIR to clinic EHR — Practo or HealthPlix on roadmap.",
    },
  ],
  cta: defineCta({
    kicker: "Mumbai / Delhi pilots",
    title: "Hindi usability testing opens Month 14.",
    description:
      "Targeting daily active use >80% in 3-clinic Mumbai and 2-clinic Delhi pilots. Synthetic workflow demo available today.",
    actions: [
      { label: "Request clinician walkthrough", href: "mailto:hello@akshhealth.in?subject=Clinician%20Walkthrough", variant: "primary" },
      { label: "Back to home", href: "/", variant: "secondary" },
    ],
  }),
};

export const partnersPage = {
  metadata: {
    title: "For Partners — Aksh Health India",
    description:
      "India commercial strategy: Rs.1.64Cr Year-1 ARR path, ABDM marketplace, Apollo/Manipal channels, and pharma RWE revenue streams.",
  },
  hero: defineHero({
    kicker: "For investors, payers, and integrators",
    title: "UK evidence in. India ARR out.",
    description:
      "Rs.1.64Cr Year-1 ARR target (~$200K) from 30 paying clinics — scaling to Rs.5Cr Year-2. UK RCT data feeds CDSCO Class B dossier. Patent #439306 covers India globally.",
    pills: ["Rs.1.64Cr Y1 ARR", "CDSCO Class B path", "ABDM marketplace", "Pharma RWE"],
    actions: [
      { label: "Request strategy deck", href: "mailto:hello@akshhealth.in?subject=Partner%20Deck%20Request", variant: "primary" },
      { label: "Contact team", href: "mailto:hello@akshhealth.in?subject=Partnership%20Conversation", variant: "secondary" },
    ],
  }),
  sections: [
    {
      kicker: "Revenue model",
      title: "Four India revenue streams by Month 24.",
      description:
        "Clinic SaaS (Rs.20K/mo), hospital SaaS (Rs.50K–2L/mo), ABDM analytics API (Rs.5K/integration/mo), and pharma RWE studies (Rs.10L+/study).",
    },
    {
      kicker: "Channel strategy",
      title: "Direct sales + ABDM + hospital networks.",
      description:
        "India Country Head drives Mumbai/Delhi clinic sales. ABDM marketplace listing, Apollo/Manipal innovation partnerships, HIMSS India, and WhatsApp outreach.",
    },
  ],
  partnerAudiences: [
    {
      audience: "Investors",
      promise: "Series A India traction evidence.",
      detail: "Rs.1.64Cr Year-1 ARR funds EU expansion without extra dilution. UK validates → India scales sequencing de-risks spend.",
      items: ["30 clinics Month 18 gate", "CDSCO Class B Month 18 target", "Patent #439306 India coverage"],
    },
    {
      audience: "Hospital networks",
      promise: "Apollo / Manipal-scale partnerships.",
      detail: "Digital health innovation partnerships provide instant credibility and referral pipeline beyond direct clinic sales.",
      items: ["NABH digital standards Month 18", "ISO 27001 procurement path", "Government hospital eligibility post-CDSCO"],
    },
    {
      audience: "Pharma & data",
      promise: "India-specific RWE cohorts.",
      detail: "Real-world evidence studies on India disease cohorts — Rs.10L+ per study, scaling to Rs.50L Year-2 with federated site data.",
      items: ["ABDM analytics API", "Federated learning moat", "ICMR-indexed evidence base"],
    },
  ],
  stats: [
    { value: "Rs.12K Cr", label: "India TAM by 2028", detail: "Clinical AI software market — 1.4B people, documentation infrastructure gap." },
    { value: "V-IN1–6", label: "Validation framework", detail: "Hindi NLP, ABDM FHIR, WhatsApp RCT, DDI, doc time, and 6-language SOAP studies." },
    { value: "M11–12", label: "Pre-launch prep", detail: "CDSCO consultant, DPDPA architecture, IndicBERT fine-tune, Practo sandbox." },
    { value: "M24", label: "End goal", detail: "30 clinics, Rs.1.64Cr ARR, CDSCO Class B approved, 6-language SOAP live, federated learning active." },
  ],
  cta: defineCta({
    kicker: "Confidential strategy guide available",
    title: "Investor, hospital, or integration partner?",
    description:
      "We will route you to the right walkthrough — commercial model, validation framework, or ABDM integration conversation.",
    actions: [
      { label: "Email partnerships", href: "mailto:hello@akshhealth.in?subject=Partnership%20Intro", variant: "primary" },
      { label: "View clinic path", href: "/for-amcs", variant: "secondary" },
    ],
  }),
};
