"use client";

import Link from "next/link";
import { useState } from "react";

import { btnPrimary, btnSecondary, frame } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import {
  EHR_SYSTEMS,
  ICS_REGIONS,
  LIST_SIZES,
  ORG_TYPES,
  ORGANISATION_COMMITMENTS,
} from "@/lib/access-requests/validation";

const STEPS = ["Organisation", "Technical Setup", "Commitments"];

type FormState = {
  orgType: string;
  orgName: string;
  odsCode: string;
  region: string;
  contactName: string;
  contactEmail: string;
  ehrSystem: string[];
  listSize: string;
  itContact: string;
  commitments: string[];
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--mk-line)] bg-white px-4 py-2.5 text-[var(--mk-ink)] shadow-sm focus:border-[var(--mk-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--mk-accent)]/25";

export default function GetStartedPageClient() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    orgType: "",
    orgName: "",
    odsCode: "",
    region: "",
    contactName: "",
    contactEmail: "",
    ehrSystem: [],
    listSize: "",
    itContact: "",
    commitments: [],
  });

  const update = (key: keyof FormState, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleArr = (key: "ehrSystem" | "commitments", value: string) => {
    const arr = form[key];
    update(key, arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgType: form.orgType,
          orgName: form.orgName,
          odsCode: form.odsCode,
          region: form.region,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          ehrSystems: form.ehrSystem,
          listSize: form.listSize,
          itContact: form.itContact,
          commitments: form.commitments,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        referenceLabel?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit enquiry. Please try again.");
      }

      setReferenceLabel(payload.referenceLabel ?? "");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MarketingShell editorial>
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="max-w-md rounded-[2rem] border border-[var(--mk-line)] bg-white px-8 py-10 text-center shadow-[var(--mk-shadow-frame)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-pastel-mint">
              <span className="text-4xl text-[var(--mk-accent)]">✓</span>
            </div>
            <h1 className="mb-3 font-display text-2xl font-bold text-[var(--mk-ink)]">Enquiry received</h1>
            <p className="mb-6 text-[var(--mk-muted)]">
              Our team will respond within two business days to discuss onboarding your organisation.
            </p>
            {referenceLabel ? (
              <p className="rounded-2xl border border-[var(--mk-line)] bg-[#f7f8fa] px-4 py-3 text-sm text-[var(--mk-muted)]">
                Reference:{" "}
                <span className="font-mono font-semibold text-[var(--mk-ink)]">{referenceLabel}</span>
              </p>
            ) : null}
          </div>
        </div>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Organisation access"
        title="Request access for your organisation"
        lede="For practice managers, regional leads, hospital procurement, and IT teams. Tell us about your organisation and we will arrange a conversation with your clinical and technical leads."
        secondary={{ label: "Create your account instead", href: "/signup" }}
      />

      <TrustStrip />

      <div className="py-12 md:py-16">
        <div className="mx-auto w-full max-w-2xl px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-2">
            {STEPS.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    index < step
                      ? "bg-[var(--mk-accent)] text-white"
                      : index === step
                        ? "bg-[var(--mk-accent)] text-white"
                        : "bg-[#eef1f4] text-[var(--mk-muted)]"
                  }`}
                >
                  {index < step ? "✓" : index + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    index === step ? "text-[var(--mk-ink)]" : "text-[var(--mk-muted)]"
                  }`}
                >
                  {label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      index < step ? "bg-[var(--mk-accent)]" : "bg-[#eef1f4]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className={frame}>
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="mb-2 font-display text-xl font-bold text-[var(--mk-ink)]">Organisation details</h2>
                <p className="mb-4 text-sm text-[var(--mk-muted)]">
                  We will respond within two business days after you submit.
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--mk-ink)]">Organisation type *</label>
                  <select
                    className={fieldClass}
                    value={form.orgType}
                    onChange={(event) => update("orgType", event.target.value)}
                  >
                    <option value="">Select type</option>
                    {ORG_TYPES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {(
                  [
                    ["Organisation name *", "orgName"],
                    ["Organisation ID (optional)", "odsCode"],
                    ["Contact name *", "contactName"],
                    ["Contact email *", "contactEmail"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--mk-ink)]">{label}</label>
                    <input
                      className={fieldClass}
                      type={key === "contactEmail" ? "email" : "text"}
                      placeholder={key === "odsCode" ? "e.g. clinic code or ODS if UK" : undefined}
                      value={form[key]}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--mk-ink)]">Region *</label>
                  <select
                    className={fieldClass}
                    value={form.region}
                    onChange={(event) => update("region", event.target.value)}
                  >
                    <option value="">Select region</option>
                    {ICS_REGIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="mb-6 font-display text-xl font-bold text-[var(--mk-ink)]">Technical setup</h2>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--mk-ink)]">Current EHR system(s) *</label>
                  <div className="space-y-2">
                    {EHR_SYSTEMS.map((ehr) => (
                      <label
                        key={ehr}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--mk-line)] bg-[#f7f8fa] px-4 py-3 transition-colors hover:border-[var(--mk-accent)]"
                      >
                        <input
                          type="checkbox"
                          checked={form.ehrSystem.includes(ehr)}
                          onChange={() => toggleArr("ehrSystem", ehr)}
                          className="h-4 w-4 accent-[var(--mk-accent)]"
                        />
                        <span className="text-sm text-[var(--mk-ink)]">{ehr}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--mk-ink)]">
                    Approximate patient list size *
                  </label>
                  <select
                    className={fieldClass}
                    value={form.listSize}
                    onChange={(event) => update("listSize", event.target.value)}
                  >
                    <option value="">Select size</option>
                    {LIST_SIZES.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--mk-ink)]">
                    IT lead contact (optional)
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="Name and email"
                    value={form.itContact}
                    onChange={(event) => update("itContact", event.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="mb-6 font-display text-xl font-bold text-[var(--mk-ink)]">Commitments</h2>
                <p className="text-sm text-[var(--mk-muted)]">
                  Please confirm your organisation can commit to the following:
                </p>
                <div className="space-y-3">
                  {ORGANISATION_COMMITMENTS.map((commitment) => (
                    <label
                      key={commitment}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--mk-line)] bg-[#f7f8fa] p-4 transition-colors hover:border-[var(--mk-accent)]"
                    >
                      <input
                        type="checkbox"
                        checked={form.commitments.includes(commitment)}
                        onChange={() => toggleArr("commitments", commitment)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--mk-accent)]"
                      />
                      <span className="text-sm text-[var(--mk-ink)]">{commitment}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {submitError ? (
              <p
                id="get-started-form-error"
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submitError}
              </p>
            ) : null}

            <div
              className="mt-8 flex justify-between border-t border-[var(--mk-line)] pt-6"
              aria-describedby={submitError ? "get-started-form-error" : undefined}
            >
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                disabled={submitting}
                className={`${btnSecondary} px-5 ${step === 0 ? "invisible" : ""}`}
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep((current) => current + 1)} className={`${btnPrimary} px-8`}>
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`${btnPrimary} px-8 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {submitting ? "Submitting…" : "Submit enquiry"}
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--mk-muted)]">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-[var(--mk-accent-strong)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
