"use client";

import { useState } from "react";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

const STEPS = ["Organisation", "Technical Setup", "Commitments"];

export default function PilotApplyPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orgType: "",
    orgName: "",
    odsCode: "",
    region: "",
    contactName: "",
    contactEmail: "",
    ehrSystem: [] as string[],
    listSize: "",
    itContact: "",
    commitments: [] as string[],
  });

  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const toggleArr = (key: "ehrSystem" | "commitments", value: string) => {
    const arr = form[key];
    update(key, arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value]);
  };

  if (submitted) {
    return (
      <div className="marketing-site flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md px-6 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10">
              <span className="text-4xl text-emerald">✓</span>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-navy">Application Received</h1>
            <p className="text-steel">
              Our team will contact you within 3 working days to discuss your pilot application.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="marketing-site flex min-h-screen flex-col bg-surface">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-20 pt-28">
        <h1 className="mb-2 text-3xl font-bold text-navy">Apply for ICS Pilot</h1>
        <p className="mb-8 text-steel">Phase 1 — October 2026 · 3 sites · 150 clinicians</p>

        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  index < step ? "bg-emerald text-white" : index === step ? "bg-navy text-white" : "bg-border text-steel"
                }`}
              >
                {index < step ? "✓" : index + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${index === step ? "text-navy" : "text-steel"}`}>
                {label}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${index < step ? "bg-emerald" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="mb-6 text-xl font-bold text-navy">Organisation Details</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate">Organisation Type *</label>
                <select
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-slate focus:border-navy focus:outline-none"
                  value={form.orgType}
                  onChange={(event) => update("orgType", event.target.value)}
                >
                  <option value="">Select type</option>
                  {["NHS ICS", "GP Network / PCN", "NHS Hospital Trust", "Private Healthcare Provider"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              {(
                [
                  ["Organisation Name *", "orgName"],
                  ["ODS Code *", "odsCode"],
                  ["Contact Name *", "contactName"],
                  ["Contact Email *", "contactEmail"],
                ] as const
              ).map(([label, key]) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-slate">{label}</label>
                  <input
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-slate focus:border-navy focus:outline-none"
                    value={form[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate">ICS Region *</label>
                <select
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-slate focus:border-navy focus:outline-none"
                  value={form.region}
                  onChange={(event) => update("region", event.target.value)}
                >
                  <option value="">Select region</option>
                  {["London", "South East", "South West", "Midlands", "East of England", "North West", "North East & Yorkshire"].map(
                    (option) => (
                      <option key={option}>{option}</option>
                    ),
                  )}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="mb-6 text-xl font-bold text-navy">Technical Setup</h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate">Current EHR System(s) *</label>
                <div className="space-y-2">
                  {["EMIS Web", "SystmOne", "Epic", "Oracle Health", "Other"].map((ehr) => (
                    <label key={ehr} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.ehrSystem.includes(ehr)}
                        onChange={() => toggleArr("ehrSystem", ehr)}
                        className="h-4 w-4 accent-navy"
                      />
                      <span className="text-sm text-slate">{ehr}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate">Approximate Patient List Size *</label>
                <select
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-slate focus:border-navy focus:outline-none"
                  value={form.listSize}
                  onChange={(event) => update("listSize", event.target.value)}
                >
                  <option value="">Select size</option>
                  {["Under 5,000", "5,000–15,000", "15,000–50,000", "50,000–200,000", "Over 200,000"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate">IT Lead Contact (optional)</label>
                <input
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-slate focus:border-navy focus:outline-none"
                  placeholder="Name and email"
                  value={form.itContact}
                  onChange={(event) => update("itContact", event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="mb-6 text-xl font-bold text-navy">Commitments</h2>
              <p className="text-sm text-steel">Please confirm your organisation can commit to the following:</p>
              <div className="space-y-3">
                {[
                  "We will sign a Data Processing Agreement (DPA) before pilot start",
                  "We will nominate a Clinical Safety Officer or lead clinician for the pilot",
                  "We will provide access for integration with our EHR system",
                  "We will make at least 50 clinicians available for the pilot period (Oct–Dec 2026)",
                  "We will participate in monthly clinical outcome reporting",
                ].map((commitment) => (
                  <label
                    key={commitment}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-navy"
                  >
                    <input
                      type="checkbox"
                      checked={form.commitments.includes(commitment)}
                      onChange={() => toggleArr("commitments", commitment)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
                    />
                    <span className="text-sm text-slate">{commitment}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className={`rounded-lg border border-border px-5 py-2.5 font-medium text-slate transition-colors hover:bg-surface ${
                step === 0 ? "invisible" : ""
              }`}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                className="rounded-lg bg-navy px-8 py-2.5 font-bold text-white transition-colors hover:bg-navy/90"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="rounded-lg bg-emerald px-8 py-2.5 font-bold text-white transition-colors hover:bg-emerald/90"
              >
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
