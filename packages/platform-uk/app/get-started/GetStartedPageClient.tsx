"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  EHR_SYSTEMS,
  ICS_REGIONS,
  LIST_SIZES,
  ORG_TYPES,
  ORGANISATION_COMMITMENTS,
  accessRequestSchema,
} from "@/lib/access-requests/validation";

const STEPS = ["Organisation", "Technical Setup", "Commitments"] as const;

// Validate each step against the same schema the API uses, so errors surface before submit.
const STEP_SCHEMAS = [
  accessRequestSchema.pick({
    orgType: true,
    orgName: true,
    odsCode: true,
    region: true,
    contactName: true,
    contactEmail: true,
  }),
  accessRequestSchema.pick({ ehrSystems: true, listSize: true, itContact: true }),
  accessRequestSchema.pick({ commitments: true }),
] as const;

const FIELD_MESSAGES: Record<string, string> = {
  orgType: "Choose an organisation type.",
  orgName: "Enter your organisation name.",
  odsCode: "Keep the organisation ID under 32 characters.",
  region: "Choose a region.",
  contactName: "Enter a contact name.",
  contactEmail: "Enter a valid email address.",
  ehrSystems: "Select at least one EHR system.",
  listSize: "Choose an approximate list size.",
  itContact: "Keep the IT contact under 200 characters.",
  commitments: "Confirm at least one commitment.",
};

type FormState = {
  orgType: string;
  orgName: string;
  odsCode: string;
  region: string;
  contactName: string;
  contactEmail: string;
  ehrSystems: string[];
  listSize: string;
  itContact: string;
  commitments: string[];
};

const NEXT_STEPS = [
  { title: "We reply within two business days", note: "A named contact, not an autoresponder" },
  { title: "Scoping call with your clinical and IT leads", note: "One workflow, named reviewers, governance boundaries" },
  { title: "Rehearse on a synthetic clinic", note: "Live patient data waits for your DPIA and approvals" },
] as const;

export default function GetStartedPageClient() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    orgType: "",
    orgName: "",
    odsCode: "",
    region: "",
    contactName: "",
    contactEmail: "",
    ehrSystems: [],
    listSize: "",
    itContact: "",
    commitments: [],
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggleArr = (key: "ehrSystems" | "commitments", value: string) => {
    const arr = form[key];
    update(key, arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value]);
  };

  const validateStep = (index: number) => {
    const result = STEP_SCHEMAS[index].safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      next[key] = FIELD_MESSAGES[key] ?? "Check this field.";
    }
    setErrors(next);
    return false;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  const fieldProps = (key: keyof FormState) => ({
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  const fieldError = (key: keyof FormState) =>
    errors[key] ? (
      <span id={`${key}-error`} className="text-xs text-[#b42318]">
        {errors[key]}
      </span>
    ) : null;

  return (
    <MarketingShell overLightHero>
      <section className="lv-book" aria-labelledby="get-started-title">
        <div className="lv-book__grid">
          <aside className="lv-book__aside">
            <span className="lv-hero__badge">
              <span className="lv-hero__badge-dot" aria-hidden>
                ✦
              </span>
              Organisation access
            </span>
            <h1 id="get-started-title" className="lv-book__title">
              Bring Aksh to your organisation
            </h1>
            <p className="lv-book__lede">
              Anyone can start free in a synthetic workspace. To use Aksh with real patients, tell us about your
              organisation: three short steps, then a conversation with your clinical and technical leads.
            </p>

            <p className="mt-8 text-sm font-medium text-white">What happens next</p>
            <ol className="lv-timeline mt-3">
              {NEXT_STEPS.map((item, i) => (
                <li key={item.title}>
                  <b aria-hidden>{i + 1}</b>
                  <span>
                    {item.title}
                    <small>{item.note}</small>
                  </span>
                </li>
              ))}
            </ol>

            <p className="lv-book__note">
              Individual clinicians can{" "}
              <Link href="/signup" className="font-medium text-white underline underline-offset-2">
                create an account instead
              </Link>
              .
            </p>
          </aside>

          <div className="lv-book__panel">
            {submitted ? (
              <div className="py-10 text-center" role="status">
                <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--lv-violet)]" aria-hidden />
                <h2 className="lv-book__h mt-5">Enquiry received</h2>
                <p className="mx-auto mt-3 max-w-sm text-[var(--lv-muted)]">
                  Our team will respond within two business days to discuss onboarding your organisation.
                </p>
                {referenceLabel ? (
                  <p className="lv-summary mx-auto mt-6 max-w-xs">
                    <span>
                      Reference <span className="font-mono font-semibold">{referenceLabel}</span>
                    </span>
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/demo/patel" className="lv-btn lv-btn--violet">
                    Walk through the Patel case
                  </Link>
                  <Link href="/" className="lv-btn lv-btn--outline">
                    Back to home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <ol className="lv-stepper" aria-label="Progress">
                  {STEPS.map((label, index) => (
                    <li
                      key={label}
                      data-state={index < step ? "done" : index === step ? "current" : "todo"}
                      aria-current={index === step ? "step" : undefined}
                    >
                      <span>
                        {index + 1}. {label}
                      </span>
                    </li>
                  ))}
                </ol>

                {step === 0 && (
                  <div className="grid gap-5">
                    <div>
                      <h2 className="lv-book__h">Organisation details</h2>
                      <p className="mt-1 text-sm text-[var(--lv-muted)]">Who you are and who we should talk to.</p>
                    </div>
                    <label className="lv-field">
                      <span>Organisation type *</span>
                      <select
                        className="lv-input"
                        value={form.orgType}
                        onChange={(event) => update("orgType", event.target.value)}
                        {...fieldProps("orgType")}
                      >
                        <option value="">Select type</option>
                        {ORG_TYPES.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                      {fieldError("orgType")}
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {(
                        [
                          ["Organisation name *", "orgName", "text"],
                          ["Organisation ID (optional)", "odsCode", "text"],
                          ["Contact name *", "contactName", "text"],
                          ["Contact email *", "contactEmail", "email"],
                        ] as const
                      ).map(([label, key, type]) => (
                        <label key={key} className="lv-field">
                          <span>{label}</span>
                          <input
                            className="lv-input"
                            type={type}
                            autoComplete={key === "contactEmail" ? "email" : key === "contactName" ? "name" : undefined}
                            placeholder={key === "odsCode" ? "ODS code if UK" : undefined}
                            value={form[key]}
                            onChange={(event) => update(key, event.target.value)}
                            {...fieldProps(key)}
                          />
                          {fieldError(key)}
                        </label>
                      ))}
                    </div>
                    <label className="lv-field">
                      <span>Region *</span>
                      <select
                        className="lv-input"
                        value={form.region}
                        onChange={(event) => update("region", event.target.value)}
                        {...fieldProps("region")}
                      >
                        <option value="">Select region</option>
                        {ICS_REGIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                      {fieldError("region")}
                    </label>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-5">
                    <div>
                      <h2 className="lv-book__h">Technical setup</h2>
                      <p className="mt-1 text-sm text-[var(--lv-muted)]">
                        Aksh sits beside your EHR. This tells us which simulated integration to rehearse.
                      </p>
                    </div>
                    <fieldset className="grid gap-2" {...fieldProps("ehrSystems")}>
                      <legend className="mb-2 text-[0.8125rem] font-medium text-[var(--lv-ink)]">
                        Current EHR system(s) *
                      </legend>
                      <div className="lv-option-grid lv-option-grid--2">
                        {EHR_SYSTEMS.map((ehr) => (
                          <label key={ehr} className="lv-option">
                            <input
                              type="checkbox"
                              checked={form.ehrSystems.includes(ehr)}
                              onChange={() => toggleArr("ehrSystems", ehr)}
                            />
                            <span>{ehr}</span>
                          </label>
                        ))}
                      </div>
                      {fieldError("ehrSystems")}
                    </fieldset>
                    <label className="lv-field">
                      <span>Approximate patient list size *</span>
                      <select
                        className="lv-input"
                        value={form.listSize}
                        onChange={(event) => update("listSize", event.target.value)}
                        {...fieldProps("listSize")}
                      >
                        <option value="">Select size</option>
                        {LIST_SIZES.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                      {fieldError("listSize")}
                    </label>
                    <label className="lv-field">
                      <span>IT lead contact (optional)</span>
                      <input
                        className="lv-input"
                        placeholder="Name and email"
                        value={form.itContact}
                        onChange={(event) => update("itContact", event.target.value)}
                        {...fieldProps("itContact")}
                      />
                      {fieldError("itContact")}
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-5">
                    <div>
                      <h2 className="lv-book__h">Commitments</h2>
                      <p className="mt-1 text-sm text-[var(--lv-muted)]">
                        Please confirm what your organisation can commit to.
                      </p>
                    </div>
                    <fieldset className="lv-option-grid" {...fieldProps("commitments")}>
                      <legend className="sr-only">Organisation commitments</legend>
                      {ORGANISATION_COMMITMENTS.map((commitment) => (
                        <label key={commitment} className="lv-option">
                          <input
                            type="checkbox"
                            checked={form.commitments.includes(commitment)}
                            onChange={() => toggleArr("commitments", commitment)}
                          />
                          <span>{commitment}</span>
                        </label>
                      ))}
                      {fieldError("commitments")}
                    </fieldset>

                    <dl className="lv-summary" aria-label="Enquiry summary">
                      <div>
                        <dt>Organisation</dt>
                        <dd>{form.orgName || "—"}</dd>
                      </div>
                      <div>
                        <dt>Contact</dt>
                        <dd>{form.contactEmail || "—"}</dd>
                      </div>
                      <div>
                        <dt>EHR</dt>
                        <dd>{form.ehrSystems.join(", ") || "—"}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                {submitError ? (
                  <p id="get-started-form-error" role="alert" className="lv-error">
                    {submitError}
                  </p>
                ) : null}

                <div className="lv-book__nav">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      setStep((current) => current - 1);
                    }}
                    disabled={submitting}
                    className={`lv-btn lv-btn--outline ${step === 0 ? "invisible" : ""}`}
                  >
                    Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={goNext} className="lv-btn lv-btn--ink px-8">
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="lv-btn lv-btn--violet px-8"
                    >
                      {submitting ? "Submitting…" : "Submit enquiry"}
                    </button>
                  )}
                </div>

                <p className="mt-6 text-center text-sm text-[var(--lv-muted)]">
                  Already have an account?{" "}
                  <Link href="/signin" className="font-semibold text-[var(--lv-indigo)] hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
