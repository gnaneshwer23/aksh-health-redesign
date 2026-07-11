export default function VoiceAgentSection() {
  const steps = [
    { n: 1, title: "Patient Discharged", detail: "FHIR Encounter resource created on discharge" },
    { n: 2, title: "AI Calls Patient", detail: "Day 3 post-discharge · Natural voice conversation" },
    { n: 3, title: "Symptoms Collected", detail: "Breathing, weight, medication adherence, mood" },
    { n: 4, title: "Risk Assessed", detail: "Low: monitor · Medium: book review · High: escalate" },
    { n: 5, title: "FHIR Updated", detail: "Care team notified · Task created · AuditEvent logged" },
  ]

  return (
    <section className="py-24 bg-navy-dark text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">AI That Calls Your Patients.</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            The Voice Care Agent makes outbound calls post-discharge, collects structured clinical
            data, updates FHIR automatically, and escalates to the care team when risk is detected.
          </p>
        </div>

        {/* Flow */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-16 justify-center">
          {steps.map((step, i) => (
            <div key={step.n} className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald/20 border-2 border-emerald flex items-center justify-center mb-3 mx-auto">
                  <span className="text-emerald font-bold">{step.n}</span>
                </div>
                <div className="text-white font-semibold text-sm mb-1">{step.title}</div>
                <div className="text-white/50 text-xs max-w-[120px]">{step.detail}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block w-8 h-0.5 bg-white/20 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Demo dialogue */}
        <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="text-white/50 text-xs uppercase font-bold tracking-wider mb-6">
            Example Conversation — Day 3 Post-Discharge
          </div>
          {[
            { who: "AI", msg: "Hello Mrs Johnson, I'm calling to check your recovery after your heart failure admission. How are you feeling today?" },
            { who: "Patient", msg: "I've been more breathless and my ankles are swollen again..." },
            { who: "AI", msg: "Thank you for telling me. I'm flagging this to your care team immediately. A nurse will call you within the hour." },
            { who: "System", msg: "🔴 URGENT — Mrs Johnson — Readmission risk HIGH — Nurse dashboard notified" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex gap-3 ${item.who === "Patient" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                item.who === "AI" ? "bg-emerald text-white"
                : item.who === "Patient" ? "bg-white/20 text-white"
                : "bg-danger/30 text-danger w-full rounded-lg px-4 py-2 text-sm"
              }`}>
                {item.who !== "System" && item.who[0]}
              </div>
              {item.who !== "System" && (
                <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  item.who === "AI"
                    ? "bg-white/10 text-white"
                    : "bg-white/20 text-white"
                }`}>
                  {item.msg}
                </div>
              )}
              {item.who === "System" && (
                <div className="w-full bg-danger/20 border border-danger/30 rounded-lg px-4 py-2 text-danger text-sm font-medium">
                  {item.msg}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
