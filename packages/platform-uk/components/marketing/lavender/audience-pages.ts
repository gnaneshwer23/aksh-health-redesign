import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  LineChart,
  ListChecks,
  MessageCircle,
  Network,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

export type AudienceKey = "clinicians" | "patients" | "pharmacists" | "organisations";

export type AudiencePage = {
  key: AudienceKey;
  path: string;
  icon: LucideIcon;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lede: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  /** A realistic moment in the product, told as timed steps. Synthetic people only. */
  scenario: { heading: string; steps: { time: string; text: string }[] };
  gets: { icon: LucideIcon; title: string; body: string }[];
  /** What never happens without a person. */
  boundaries: string[];
  tryIt: { label: string; href: string; note: string }[];
};

export const AUDIENCE_PAGES: Record<AudienceKey, AudiencePage> = {
  clinicians: {
    key: "clinicians",
    path: "/for-clinicians",
    icon: Stethoscope,
    metaTitle: "For physicians & nurses",
    metaDescription:
      "Aksh prepares the diabetes picture before every review: drafted notes, coding, risk with its reasons and medication checks. You accept, edit or reject.",
    eyebrow: "For physicians, nurses & diabetes educators",
    title: "Walk into every diabetes review already prepared.",
    lede: "Aksh reads labs, medicines, readings and what the patient told Asha, then drafts the note, the coding and the risk picture. Nothing reaches the record until you accept it.",
    primary: { label: "Start free", href: "/signup" },
    secondary: { label: "Try without an account", href: "/dashboard/gp" },
    scenario: {
      heading: "A Tuesday clinic, synthetic patient",
      steps: [
        { time: "08:10", text: "HbA1c 68 mmol/mol arrives; the risk check rises and lists why." },
        { time: "08:11", text: "Apixaban with aspirin is held for a medication decision." },
        { time: "09:30", text: "Draft SOAP note and SNOMED CT codes are waiting in the review queue." },
        { time: "09:34", text: "You edit one line, accept the note; the pharmacist confirms the hold." },
      ],
    },
    gets: [
      { icon: FileText, title: "Drafted notes and coding", body: "SOAP draft and suggested codes from the consultation, each with its source." },
      { icon: LineChart, title: "Risk with its reasons", body: "Risk changes show the contributing factors, never a bare score." },
      { icon: Pill, title: "Medication safety holds", body: "Interactions and allergies are held for a named decision, not silently flagged." },
      { icon: ListChecks, title: "Care gaps listed, not guessed", body: "Overdue eye screening, foot checks or labs are shown as missing data." },
      { icon: MessageCircle, title: "What the patient reported", body: "Readings and symptoms from Asha arrive marked unverified until you accept them." },
      { icon: ClipboardCheck, title: "One review queue", body: "Accept, edit or reject. Every decision is attributed to you and audited." },
    ],
    boundaries: [
      "No autonomous diagnosis, prescribing or treatment.",
      "Insulin and GLP-1 output is explanatory only, never an executable dose.",
      "Nothing is written to a live record; staging is FHIR R4 beside the EHR.",
    ],
    tryIt: [
      { label: "Clinician dashboard", href: "/dashboard/gp", note: "Synthetic review queue" },
      { label: "Care network registry", href: "/dashboard/network", note: "Test patients ranked by risk" },
      { label: "Patel walkthrough", href: "/demo/patel", note: "One case, end to end" },
    ],
  },
  patients: {
    key: "patients",
    path: "/for-patients",
    icon: HeartHandshake,
    metaTitle: "For people living with diabetes",
    metaDescription:
      "Talk or type to Asha to book, ask clinic questions and share readings. Anything clinical goes to your own care team; anything urgent goes to a person.",
    eyebrow: "For people living with diabetes",
    title: "Help between appointments, without waiting on hold.",
    lede: "Asha is the voice and chat assistant for your clinic. Book or move an appointment, ask a practical question, or share a reading. Your own care team decides anything clinical.",
    primary: { label: "Talk to Asha", href: "/asha" },
    secondary: { label: "Create a free account", href: "/signup" },
    scenario: {
      heading: "An evening check-in, synthetic patient",
      steps: [
        { time: "18:02", text: "Asha calls for a planned check-in and asks about recent readings." },
        { time: "18:03", text: "You say your sugar was 3.6 this morning and you felt shaky." },
        { time: "18:03", text: "Asha records it for your care team, marked as patient-reported." },
        { time: "09:15", text: "Your nurse reviews it next morning and books a medication review." },
      ],
    },
    gets: [
      { icon: CalendarCheck, title: "Book, move or cancel", body: "Appointments handled on the call, any time of day." },
      { icon: MessageCircle, title: "Answers you can trust", body: "Practical clinic questions answered from your clinic's own published information." },
      { icon: Activity, title: "Share readings and symptoms", body: "Glucose, blood pressure or how you feel goes to your care team to review." },
      { icon: Phone, title: "Check-in calls", body: "Reminders and follow-ups for reviews, screening and missed appointments." },
      { icon: BellRing, title: "A person for anything urgent", body: "Emergencies get your local emergency number and a hand-off to a person." },
      { icon: ShieldCheck, title: "Your data stays governed", body: "Only your care team sees your record; every access is audited." },
    ],
    boundaries: [
      "Asha never diagnoses, changes medicines or gives doses.",
      "Anything clinical becomes a note for your clinician, who decides.",
      "Emergency words stop the conversation and route you to help immediately.",
    ],
    tryIt: [
      { label: "Talk to Asha", href: "/asha", note: "Voice or chat, sandbox clinic" },
      { label: "Safety & privacy", href: "/security", note: "How data is handled per market" },
    ],
  },
  pharmacists: {
    key: "pharmacists",
    path: "/for-pharmacists",
    icon: Pill,
    metaTitle: "For pharmacists",
    metaDescription:
      "Medication risks surfaced before they become harm: interaction and allergy holds, a medication review queue and a recorded rationale for every decision.",
    eyebrow: "For clinical & community pharmacists",
    title: "See the medication risk before the prescription moves.",
    lede: "Aksh checks every diabetes medication change against kidney function, interactions and allergies, then holds it for you. You confirm the medication decision; the physician stays co-accountable.",
    primary: { label: "See the pharmacy step", href: "/demo/patel" },
    secondary: { label: "Start free", href: "/signup" },
    scenario: {
      heading: "A medication review, synthetic patient",
      steps: [
        { time: "10:05", text: "eGFR falls to 28; metformin is flagged against kidney function." },
        { time: "10:05", text: "The repeat is held and added to your review queue." },
        { time: "10:20", text: "You record the rationale and confirm a dose-safe alternative to discuss." },
        { time: "10:21", text: "The physician sees your decision and signs the care-plan change." },
      ],
    },
    gets: [
      { icon: ShieldCheck, title: "Interaction and allergy holds", body: "Flags are held for a decision, not buried in alerts." },
      { icon: ListChecks, title: "Medication review queue", body: "Patients ranked by risk: renal function, hypos, polypharmacy." },
      { icon: FileText, title: "Rationale kept for audit", body: "Every confirm or reject records who decided and why." },
      { icon: Users, title: "Shared care team", body: "The prescriber and nurse see the same decision, in the same place." },
    ],
    boundaries: [
      "Pharmacists confirm the medication decision gate only; physicians stay co-accountable.",
      "No automatic prescribing or dose change.",
      "Nothing is dispensed or sent to a live system from the demo.",
    ],
    tryIt: [
      { label: "Patel walkthrough · pharmacy step", href: "/demo/patel", note: "Apixaban with aspirin hold" },
      { label: "Care network · pharmacies", href: "/dashboard/network", note: "20 synthetic pharmacies" },
    ],
  },
  organisations: {
    key: "organisations",
    path: "/for-organisations",
    icon: Building2,
    metaTitle: "For clinics, health systems & payers",
    metaDescription:
      "Close diabetes care gaps across a population with a governed, auditable layer beside your EHR. Baselines locked before go-live; outcomes measured against them.",
    eyebrow: "For clinics, health systems & payers",
    title: "Close diabetes care gaps across a whole population.",
    lede: "Aksh sits beside the EHR you already run. It finds who needs attention, prepares the work for your teams and measures what changed against a baseline locked before go-live.",
    primary: { label: "Bring Aksh to your organisation", href: "/get-started" },
    secondary: { label: "Explore the care network", href: "/dashboard/network" },
    scenario: {
      heading: "A quarter in a pilot, synthetic network",
      steps: [
        { time: "Week 0", text: "Baseline locked: calls answered, overdue reviews, HbA1c above target." },
        { time: "Week 2", text: "Registry ranks 500 patients by risk; recall campaigns start via Asha." },
        { time: "Week 6", text: "Care gaps close as clinicians accept prepared reviews." },
        { time: "Week 12", text: "Lift is reported against the baseline, labelled unverified until checked." },
      ],
    },
    gets: [
      { icon: Network, title: "Care network registry", body: "Patients, professionals and organisations in one view, ranked by risk." },
      { icon: Users, title: "Care teams across organisations", body: "Clinics, pharmacies, labs and specialists on the same loop." },
      { icon: LineChart, title: "Outcomes against a locked baseline", body: "No lift is claimed until it is checked against your own data." },
      { icon: ShieldCheck, title: "Governance built in", body: "Role-based access, named decisions and a tamper-evident audit trail." },
      { icon: Phone, title: "Front Desk and recall", body: "Inbound calls, recall campaigns and slot fill handled by Asha." },
      { icon: Building2, title: "Beside your EHR", body: "Your existing EHR stays the system of record." },
    ],
    boundaries: [
      "Pilots start on synthetic data; live patient data waits for your approvals.",
      "Each market's regulator, privacy assessment and clinical safety case come first.",
      "No live write to any EHR until a separately governed decision.",
    ],
    tryIt: [
      { label: "Care network", href: "/dashboard/network", note: "57 organisations, 100 professionals" },
      { label: "Front Desk console", href: "/dashboard/front-desk", note: "Calls, recalls and lift" },
      { label: "Regional dashboard", href: "/dashboard/ics", note: "Population signals" },
    ],
  },
};
