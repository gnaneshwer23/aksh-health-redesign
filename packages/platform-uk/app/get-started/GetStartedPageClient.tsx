"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { ICS_REGIONS, LIST_SIZES, ORG_TYPES, accessRequestSchema } from "@/lib/access-requests/validation";

const FIELD_MESSAGES: Record<string, string> = {
  orgType: "Choose an organisation type.",
  orgName: "Enter your organisation name.",
  odsCode: "Keep the organisation ID under 32 characters.",
  region: "Choose a region.",
  contactName: "Enter your name.",
  contactEmail: "Enter a valid work email address.",
  ehrSystems: "Select at least one system.",
  listSize: "Choose an approximate list size.",
  itContact: "Keep this under 200 characters.",
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
  { title: "A named person replies", note: "Not an autoresponder" },
  { title: "A scoping call with your clinical and operations leads", note: "The workflow to start with, your systems and what go-live needs" },
  { title: "Setup and go-live", note: "Your clinic, your team, the checklist, then shadow mode" },
];

const errStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--s-red)" };

export default function GetStartedPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    orgType: "", orgName: "", odsCode: "", region: "", contactName: "", contactEmail: "", ehrSystems: [], listSize: "", itContact: "", commitments: [],
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => {
      if (!c[key]) return c;
      const next = { ...c };
      delete next[key];
      return next;
    });
  };

  const err = (key: keyof FormState) => (errors[key] ? <span id={`${key}-error`} style={errStyle}>{errors[key]}</span> : null);
  const aria = (key: keyof FormState) => ({ "aria-invalid": errors[key] ? (true as const) : undefined, "aria-describedby": errors[key] ? `${key}-error` : undefined });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = accessRequestSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = FIELD_MESSAGES[String(issue.path[0])] ?? "Check this field.";
      setErrors(next);
      document.getElementById(`field-${Object.keys(next)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/access-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; referenceLabel?: string };
      if (!response.ok) throw new Error(payload.error ?? "We could not send your request. Please try again.");
      setReferenceLabel(payload.referenceLabel ?? "");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not send your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <span className="s-eyebrow">Request a pilot</span>
          <h1 id="get-started-title" className="s-h1" style={{ fontSize: "clamp(36px, 4.6vw, 54px)" }}>Request an organisational pilot.</h1>
          <p className="s-lede">Six questions about your organisation. We reply in person and scope the pilot on a call.</p>
        </div>
      </section>

      <section className="s-section s-section--tight">
        <div className="s-container" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 48 }}>
          <div className="s-feature" style={{ alignItems: "start", gap: 56 }}>
            <aside style={{ display: "grid", gap: 20, alignContent: "start", position: "sticky", top: 100 }}>
              <h2 className="s-h3">What happens next</h2>
              <ol style={{ display: "grid", gap: 16 }}>
                {NEXT_STEPS.map((s, i) => (
                  <li key={s.title} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12 }}>
                    <span className="s-rank" style={{ width: 28, height: 28 }}>{i + 1}</span>
                    <span style={{ display: "grid", gap: 2 }}>
                      <strong style={{ color: "var(--s-ink)" }}>{s.title}</strong>
                      <span className="s-small">{s.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="s-small">
                Joining a clinic that already uses Aksh? Ask its admin for an invite code and <Link href="/signup" className="s-link">create an account</Link>.
              </p>
            </aside>

            <div className="s-card" style={{ padding: 32 }}>
              {submitted ? (
                <div role="status" style={{ display: "grid", gap: 14, justifyItems: "start", padding: "16px 0" }}>
                  <CheckCircle2 size={40} color="#0a7a68" aria-hidden />
                  <h2 className="s-h3" style={{ fontSize: 24 }}>Request received</h2>
                  <p className="s-body">Thank you. A member of our team will be in touch to arrange a call.</p>
                  {referenceLabel ? <p className="s-small">Reference <strong style={{ fontFamily: "var(--font-aksh-mono)" }}>{referenceLabel}</strong></p> : null}
                  <div className="s-actions" style={{ marginTop: 8 }}>
                    <Link href="/resources" className="s-btn s-btn--primary">Read the guides</Link>
                    <Link href="/" className="s-btn s-btn--ghost">Back to home</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate style={{ display: "grid", gap: 22 }} aria-labelledby="get-started-title">
                  <div className="s-grid s-grid--2" style={{ gap: 16 }}>
                    <label className="s-field" id="field-contactName">Your name
                      <input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} autoComplete="name" {...aria("contactName")} />
                      {err("contactName")}
                    </label>
                    <label className="s-field" id="field-contactEmail">Work email
                      <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} autoComplete="email" {...aria("contactEmail")} />
                      {err("contactEmail")}
                    </label>
                    <label className="s-field" id="field-orgName">Organisation name
                      <input value={form.orgName} onChange={(e) => update("orgName", e.target.value)} autoComplete="organization" {...aria("orgName")} />
                      {err("orgName")}
                    </label>
                    <label className="s-field" id="field-orgType">Organisation type
                      <select value={form.orgType} onChange={(e) => update("orgType", e.target.value)} {...aria("orgType")}>
                        <option value="">Choose…</option>
                        {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      {err("orgType")}
                    </label>
                    <label className="s-field" id="field-region">Region
                      <select value={form.region} onChange={(e) => update("region", e.target.value)} {...aria("region")}>
                        <option value="">Choose…</option>
                        {ICS_REGIONS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      {err("region")}
                    </label>
                    <label className="s-field" id="field-listSize">Patients registered (approximately)
                      <select value={form.listSize} onChange={(e) => update("listSize", e.target.value)} {...aria("listSize")}>
                        <option value="">Choose…</option>
                        {LIST_SIZES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      {err("listSize")}
                    </label>
                  </div>

                  <p className="s-small" style={{ margin: 0 }}>
                    Systems, integration and go-live requirements are covered on the scoping call.{" "}
                    <Link href="/resources/going-live" className="s-link">What going live involves</Link>.
                  </p>

                  {submitError ? <p role="alert" style={errStyle}>{submitError}</p> : null}
                  <div className="s-actions" style={{ alignItems: "center" }}>
                    <button type="submit" className="s-btn s-btn--primary" disabled={submitting}>{submitting ? "Sending…" : "Send request"}</button>
                    <span className="s-small">We use these details only to reply to you. See our <Link href="/privacy" className="s-link">privacy notice</Link>.</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
