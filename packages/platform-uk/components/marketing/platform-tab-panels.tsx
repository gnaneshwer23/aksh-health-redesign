import Link from "next/link";

const clinicianFeatures = [
  {
    title: "Clinical Copilot",
    body: "Pre-consultation briefing, in-consultation decision support, and post-consultation task management — all in your existing workflow.",
  },
  {
    title: "SYNTHESIS Documentation",
    body: "Ambient note generation produces FHIR DocumentReference SOAP notes. You review, edit, and approve before anything writes to the record.",
  },
  {
    title: "GUARDIAN Safety Checks",
    body: "Real-time drug interaction, allergy, and contraindication checking with DetectedIssue FHIR resources.",
  },
  {
    title: "ORACLE Risk Scoring",
    body: "CVD, T2D, and frailty risk predictions surfaced as FHIR RiskAssessment resources in your review queue.",
  },
  {
    title: "Referral Agent",
    body: "Automated referral package creation with urgency prediction — ServiceRequest FHIR resources ready for your approval.",
  },
  {
    title: "One Review Queue",
    body: "All AI outputs in one place. Accept, edit, or reject. Nothing reaches the patient record without your explicit approval.",
  },
];

const hospitalSections = [
  {
    title: "Hospital Command Centre",
    body: "Real-time ED waiting times, bed occupancy, staff shortage alerts, and AI recommendations — a single operational view for your trust.",
  },
  {
    title: "Capacity Prediction",
    body: "Know your bed demand 14 days before it happens. Admission forecasts and winter planning powered by the Capacity Prediction agent.",
  },
  {
    title: "Digital Twin",
    body: "Simulate winter surge scenarios. Model what happens if ED admissions rise 20% and get AI recommendations 72 hours in advance.",
  },
  {
    title: "Workforce Intelligence",
    body: "Agency staff triggers, theatre utilisation optimisation, and elective capacity scheduling around ED demand.",
  },
  {
    title: "Compliance & Governance",
    body: "Immutable audit trail, CQC-ready reports, and ICS-level governance dashboards for medical directors and CIOs.",
  },
];

const patientFeatures = [
  "Daily health check-ins and symptom tracking",
  "Medication reminders and adherence support",
  "Care plan view with upcoming tasks and appointments",
  "Secure messaging with your care team",
  "Appointment management and booking",
  "Lifestyle coaching tailored to your conditions",
];

const capabilities = [
  {
    title: "Interoperability First",
    body: "FHIR R4, HL7 v2, DICOM, and NHS Spine connectivity without replacing your EHR.",
  },
  {
    title: "Knowledge Graph Reasoning",
    body: "Neo4j-powered clinical knowledge graph with John Snow Labs NLP for structured reasoning.",
  },
  {
    title: "Multi-Agent Orchestration",
    body: "Twelve specialist AI agents coordinated through a single workflow engine with safety guardrails.",
  },
  {
    title: "Human-in-the-Loop Governance",
    body: "Every clinical action requires explicit approval. Immutable audit trail for CQC and ICS governance.",
  },
];

const layers = [
  { name: "Experience", detail: "Role dashboards, review queue, patient companion" },
  { name: "Intelligence", detail: "12 AI agents with memory, permissions, and HITL gates" },
  { name: "Knowledge", detail: "Neo4j clinical graph + FHIR R4 resource model" },
  { name: "Integration", detail: "EMIS, SystmOne, Epic, HL7 v2, NHS Spine" },
];

export function PlatformOverviewPanel() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-bold text-navy">{item.title}</h2>
                <p className="mt-2 text-sm text-steel">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-navy">Four layers. One connected platform.</h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4">
            {layers.map((layer, index) => (
              <div
                key={layer.name}
                className="rounded-xl border border-border bg-white p-5 text-left shadow-sm"
                style={{ marginLeft: `${index * 12}px`, marginRight: `${(layers.length - index - 1) * 12}px` }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-emerald">{layer.name}</p>
                <p className="mt-1 text-sm text-slate">{layer.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold text-navy">See the platform in your environment</h2>
          <p className="mt-3 text-steel">
            Request a pilot to connect Aksh Health to your EMIS Web or SystmOne deployment with FHIR R4 integration.
          </p>
          <Link
            href="/pilot/apply"
            className="mt-6 inline-block rounded-xl bg-navy px-8 py-3 font-bold text-white transition-colors hover:bg-navy/90"
          >
            Request a Pilot
          </Link>
        </div>
      </section>
    </>
  );
}

export function PlatformCliniciansPanel() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-navy">Spend Time With Patients. Not Paperwork.</h2>
          <p className="mt-3 text-steel">
            Aksh Health gives GPs and nurses an AI clinical copilot that connects to EMIS Web and SystmOne —
            documenting consultations, checking safety, and coordinating care while you stay in control.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clinicianFeatures.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border p-6">
              <h3 className="text-base font-bold text-navy">{feature.title}</h3>
              <p className="mt-2 text-sm text-steel">{feature.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald/20 bg-emerald/5 p-6">
          <h3 className="font-bold text-emerald">Human-in-the-Loop</h3>
          <p className="mt-2 text-sm text-steel">
            Aksh Health is not autonomous AI. Every clinical output requires your explicit approval. NHS DCB0129
            compliant with a full immutable audit trail.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/signup?role=gp" className="rounded-xl bg-navy px-6 py-3 font-bold text-white hover:bg-navy/90">
            Get Started as a Clinician
          </Link>
          <Link href="/signup?role=gp" className="rounded-xl border border-navy px-6 py-3 font-bold text-navy hover:bg-navy/5">
            GP onboarding path
          </Link>
          <Link
            href="/signup?role=nurse"
            className="rounded-xl border border-emerald bg-emerald-light px-6 py-3 font-bold text-emerald hover:bg-emerald/10"
          >
            Nurse dashboard — vitals & handover
          </Link>
          <Link
            href="/signup?role=pharmacist"
            className="rounded-xl border border-[#6B46C1] bg-[#6B46C1]/5 px-6 py-3 font-bold text-[#6B46C1] hover:bg-[#6B46C1]/10"
          >
            Pharmacist dashboard — med review & interactions
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PlatformAdministratorsPanel() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-navy">Multi-tenancy, integration health, and SHIELD.</h2>
          <p className="mt-3 text-steel">
            Practice-level tenancy, EMIS/Mirth integration status, and SHIELD compliance evidence — scaffolded for
            Phase B. No live DSPT evidence export in this build.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-navy">Admin dashboard scaffold</h3>
            <p className="mt-2 text-sm text-steel">
              Integration health, tenant configuration, and SHIELD audit views for practice administrators.
            </p>
            <Link href="/signup?role=admin" className="mt-4 inline-block text-sm font-semibold text-navy hover:underline">
              Sign up as Admin →
            </Link>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-navy">EMIS → Mirth → FHIR → HITL (planned)</h3>
            <p className="mt-2 text-sm text-steel">
              Production interoperability is Phase E. Current proof uses synthetic patients and JSON persistence with
              integration placeholders only.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PlatformHospitalsPanel() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-navy">Command Your Hospital. Not Just Your Dashboard.</h2>
          <p className="mt-3 text-steel">
            For hospital CEOs, COOs, medical directors, and CIOs — Aksh Health provides real-time operational
            intelligence across Epic, Oracle Health, and NHS Spine-connected systems.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {hospitalSections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border p-6">
              <h3 className="text-lg font-bold text-navy">{section.title}</h3>
              <p className="mt-2 text-sm text-steel">{section.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/pilot/apply" className="rounded-xl bg-navy px-6 py-3 font-bold text-white hover:bg-navy/90">
            Book Executive Briefing
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PlatformPatientsPanel() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-navy">Your Health. Understood. Supported. Always.</h2>
          <p className="mt-3 text-steel">
            For patients invited to Aksh Health by their GP practice — a Health Companion that keeps you connected to
            your care team between appointments.
          </p>
        </div>

        <article className="rounded-2xl border border-border p-8">
          <h3 className="text-xl font-bold text-navy">Health Companion</h3>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {patientFeatures.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-slate">
                <span className="text-accent">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </article>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-6">
          <h3 className="font-bold text-navy">Voice Care</h3>
          <p className="mt-2 text-sm text-steel">
            Your care team never stops looking after you — even between appointments. If your health changes, someone
            will call.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald/20 bg-emerald/5 p-6">
          <h3 className="font-bold text-emerald">Privacy</h3>
          <p className="mt-2 text-sm text-steel">
            Your data stays within your NHS trust. You control what the AI sees. You can opt out of AI-assisted care at
            any time.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup?role=patient"
            className="rounded-xl bg-navy px-8 py-3 font-bold text-white transition-colors hover:bg-navy/90"
          >
            Sign up as a patient
          </Link>
          <Link
            href="/signup?role=patient"
            className="rounded-xl border border-navy px-8 py-3 font-bold text-navy transition-colors hover:bg-navy/5"
          >
            Get started
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-steel">
          Or ask your GP practice if they use Aksh Health
        </p>
      </div>
    </section>
  );
}
