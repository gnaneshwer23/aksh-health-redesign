const agents = [
  { name: "SYNTHESIS", tag: "Clinical", color: "bg-navy", desc: "Converts voice or typed consultation notes into structured SOAP notes in 4 seconds.", fhir: "DocumentReference" },
  { name: "DrASSIST", tag: "Clinical", color: "bg-purple-700", desc: "Differential diagnosis + SNOMED-CT / ICD-10 coding with confidence scores. GP overrides freely.", fhir: "Condition" },
  { name: "GUARDIAN", tag: "Safety", color: "bg-danger", desc: "Real-time drug interaction, allergy, and contraindication checking. BNF-validated. Red / Amber / Green.", fhir: "Flag, MedicationRequest" },
  { name: "ORACLE", tag: "Risk", color: "bg-warning", desc: "CVD, T2D, and frailty risk scoring. 14-day hospital admission prediction using the knowledge graph.", fhir: "RiskAssessment" },
  { name: "VOICE", tag: "Documentation", color: "bg-sky-500", desc: "GP dictates naturally. VOICE transcribes in real-time. SYNTHESIS converts to SOAP. GP approves.", fhir: "DocumentReference" },
  { name: "EQUITY", tag: "Population", color: "bg-teal-600", desc: "Detects health disparities by IMD quintile and ethnicity. Monthly ICS equity reports.", fhir: "Observation (flag)" },
  { name: "SHIELD", tag: "Compliance", color: "bg-slate", desc: "Immutable audit trail for every AI recommendation and GP action. DCB0129-compliant. CQC-ready.", fhir: "AuditEvent" },
  { name: "HEALTH COMPANION", tag: "Patient", color: "bg-accent", desc: "24/7 patient health assistant. Daily check-ins, medication reminders, care plan in plain English.", fhir: "CommunicationRequest" },
  { name: "VOICE CARE AGENT", tag: "Patient", color: "bg-sky-600", desc: "AI makes outbound calls post-discharge. Collects symptoms. Detects deterioration. Escalates to GP.", fhir: "Encounter, Flag" },
  { name: "REFERRAL AGENT", tag: "Coordination", color: "bg-purple-600", desc: "Auto-generates referral packages: criteria check, missing investigations, urgency prediction.", fhir: "ServiceRequest" },
  { name: "HOSPITAL COMMAND", tag: "Operational", color: "bg-slate", desc: "Live hospital status: ED waiting, bed occupancy, theatres. Predicts pressure. Recommends actions.", fhir: "Operational data" },
  { name: "CAPACITY PREDICTION", tag: "Operational", color: "bg-navy", desc: "14-day admission and discharge forecast. Winter surge planning. Discharge bottleneck detection.", fhir: "Operational data" },
]

export default function AgentGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy mb-4">
            Twelve AI Agents. Every Role. One Platform.
          </h2>
          <p className="text-xl text-steel max-w-2xl mx-auto">
            Each agent has memory, permissions, and a human-approval gate before any action is taken.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 bg-white"
            >
              <div className={`inline-block px-2.5 py-1 rounded-md text-white text-xs font-bold mb-3 ${agent.color}`}>
                {agent.name}
              </div>
              <div className="text-xs font-medium text-steel mb-2 uppercase tracking-wider">
                {agent.tag}
              </div>
              <p className="text-sm text-slate leading-relaxed mb-3">{agent.desc}</p>
              <div className="text-xs text-steel/70">
                <span className="font-semibold">FHIR:</span> {agent.fhir}
              </div>
            </div>
          ))}
        </div>

        {/* HITL reminder */}
        <div className="mt-10 p-6 bg-emerald/5 border border-emerald/20 rounded-2xl text-center">
          <p className="text-emerald font-bold text-lg mb-1">Human-in-the-Loop. Always.</p>
          <p className="text-steel text-sm">
            Every AI output is staged as a Draft. The clinician clicks Accept, Edit, or Reject.
            Zero AI outputs are written to the FHIR record without explicit human approval.
          </p>
        </div>
      </div>
    </section>
  )
}
