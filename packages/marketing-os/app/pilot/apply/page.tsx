"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const orgTypes = [
  "GP Network",
  "ICS",
  "Hospital",
  "Private Provider",
];

const ehrOptions = ["EMIS Web", "SystmOne", "Epic", "Oracle Health", "Other"];

const useCaseOptions = [
  "Clinical Documentation",
  "Post-Discharge Voice Care",
  "Hospital Command Centre",
  "Care Pathway Automation",
  "Population Health / Equity",
  "Digital Twin Planning",
];

const commitments = [
  "Named clinical safety officer engagement",
  "Minimum 50 clinicians participating",
  "FHIR R4 integration readiness",
  "Quarterly outcome data sharing",
  "Human-in-the-loop approval for all AI outputs",
];

type FormData = {
  orgType: string;
  name: string;
  odsCode: string;
  region: string;
  contactName: string;
  contactEmail: string;
  ehrs: string[];
  populationSize: string;
  useCases: string[];
  commitments: string[];
};

const initialForm: FormData = {
  orgType: "",
  name: "",
  odsCode: "",
  region: "",
  contactName: "",
  contactEmail: "",
  ehrs: [],
  populationSize: "",
  useCases: [],
  commitments: [],
};

export default function PilotApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleArray = (key: "ehrs" | "useCases" | "commitments", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/pilot-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="bg-background py-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Application Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted">
                Application received. Our team will respond within 3 working
                days.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold">Apply for Pilot Cohort</h1>
        <p className="mt-2 text-muted">NHS Phase 1 Pilot — October 2026</p>

        <div className="mt-8 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Organisation type</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {orgTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, orgType: type })}
                        className={cn(
                          "rounded-sm border px-3 py-2 text-sm transition-colors",
                          form.orgType === type
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { key: "name", label: "Organisation name" },
                  { key: "odsCode", label: "ODS code" },
                  { key: "region", label: "Region" },
                  { key: "contactName", label: "Lead contact name" },
                  { key: "contactEmail", label: "Lead contact email" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm font-medium">{field.label}</label>
                    <input
                      className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
                      value={form[field.key as keyof FormData] as string}
                      onChange={(e) =>
                        setForm({ ...form, [field.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current EHR(s)</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ehrOptions.map((ehr) => (
                      <button
                        key={ehr}
                        type="button"
                        onClick={() => toggleArray("ehrs", ehr)}
                        className={cn(
                          "rounded-sm border px-3 py-1.5 text-sm",
                          form.ehrs.includes(ehr)
                            ? "border-secondary bg-secondary/10"
                            : "border-border"
                        )}
                      >
                        {ehr}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Patient population size
                  </label>
                  <input
                    className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
                    value={form.populationSize}
                    onChange={(e) =>
                      setForm({ ...form, populationSize: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Primary use case interest
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {useCaseOptions.map((uc) => (
                      <button
                        key={uc}
                        type="button"
                        onClick={() => toggleArray("useCases", uc)}
                        className={cn(
                          "rounded-sm border px-3 py-1.5 text-sm",
                          form.useCases.includes(uc)
                            ? "border-accent bg-accent/10"
                            : "border-border"
                        )}
                      >
                        {uc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Commitments checklist</p>
                {commitments.map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.commitments.includes(item)}
                      onChange={() => toggleArray("commitments", item)}
                      className="mt-0.5"
                    />
                    {item}
                  </label>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)}>Continue</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
