"use client"
import { useState } from "react"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

const STEPS = ["Organisation", "Technical Setup", "Commitments"]

export default function PilotApplyPage() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    orgType: "", orgName: "", odsCode: "", region: "", contactName: "", contactEmail: "",
    ehrSystem: [] as string[], listSize: "", itContact: "",
    commitments: [] as string[],
  })

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const toggleArr = (k: "ehrSystem" | "commitments", v: string) => {
    const arr = form[k]
    update(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-emerald">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-navy mb-3">Application Received</h1>
            <p className="text-steel">Our team will contact you within 3 working days to discuss your pilot application.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-navy mb-2">Apply for ICS Pilot</h1>
        <p className="text-steel mb-8">Phase 1 — October 2026 · 3 sites · 150 clinicians</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < step ? "bg-emerald text-white" : i === step ? "bg-navy text-white" : "bg-border text-steel"
              }`}>{i < step ? "✓" : i + 1}</div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-navy" : "text-steel"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-emerald" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-navy mb-6">Organisation Details</h2>
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">Organisation Type *</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-slate focus:outline-none focus:border-navy" value={form.orgType} onChange={e => update("orgType", e.target.value)}>
                  <option value="">Select type</option>
                  {["NHS ICS", "GP Network / PCN", "NHS Hospital Trust", "Private Healthcare Provider"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {([["Organisation Name *", "orgName"], ["ODS Code *", "odsCode"], ["Contact Name *", "contactName"], ["Contact Email *", "contactEmail"]] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate mb-1.5">{label}</label>
                  <input className="w-full border border-border rounded-lg px-4 py-2.5 text-slate focus:outline-none focus:border-navy" value={form[key]} onChange={e => update(key, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">ICS Region *</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-slate focus:outline-none focus:border-navy" value={form.region} onChange={e => update("region", e.target.value)}>
                  <option value="">Select region</option>
                  {["London", "South East", "South West", "Midlands", "East of England", "North West", "North East & Yorkshire"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-navy mb-6">Technical Setup</h2>
              <div>
                <label className="block text-sm font-medium text-slate mb-2">Current EHR System(s) *</label>
                <div className="space-y-2">
                  {["EMIS Web", "SystmOne", "Epic", "Oracle Health", "Other"].map(ehr => (
                    <label key={ehr} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.ehrSystem.includes(ehr)} onChange={() => toggleArr("ehrSystem", ehr)} className="w-4 h-4 accent-navy" />
                      <span className="text-slate text-sm">{ehr}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">Approximate Patient List Size *</label>
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-slate focus:outline-none focus:border-navy" value={form.listSize} onChange={e => update("listSize", e.target.value)}>
                  <option value="">Select size</option>
                  {["Under 5,000", "5,000–15,000", "15,000–50,000", "50,000–200,000", "Over 200,000"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">IT Lead Contact (optional)</label>
                <input className="w-full border border-border rounded-lg px-4 py-2.5 text-slate focus:outline-none focus:border-navy" placeholder="Name and email" value={form.itContact} onChange={e => update("itContact", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-navy mb-6">Commitments</h2>
              <p className="text-steel text-sm">Please confirm your organisation can commit to the following:</p>
              <div className="space-y-3">
                {[
                  "We will sign a Data Processing Agreement (DPA) before pilot start",
                  "We will nominate a Clinical Safety Officer or lead clinician for the pilot",
                  "We will provide access for integration with our EHR system",
                  "We will make at least 50 clinicians available for the pilot period (Oct–Dec 2026)",
                  "We will participate in monthly clinical outcome reporting",
                ].map(c => (
                  <label key={c} className="flex items-start gap-3 cursor-pointer bg-surface rounded-lg p-3 border border-border hover:border-navy transition-colors">
                    <input type="checkbox" checked={form.commitments.includes(c)} onChange={() => toggleArr("commitments", c)} className="w-4 h-4 accent-navy mt-0.5 shrink-0" />
                    <span className="text-slate text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button onClick={() => setStep(s => s - 1)} className={`px-5 py-2.5 rounded-lg border border-border text-slate font-medium hover:bg-surface transition-colors ${step === 0 ? "invisible" : ""}`}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-8 py-2.5 rounded-lg bg-navy text-white font-bold hover:bg-navy/90 transition-colors">
                Continue
              </button>
            ) : (
              <button onClick={() => { console.log("Pilot application:", form); setSubmitted(true) }} className="px-8 py-2.5 rounded-lg bg-emerald text-white font-bold hover:bg-emerald/90 transition-colors">
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
