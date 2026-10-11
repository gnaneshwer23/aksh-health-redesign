"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { EHR_SYSTEMS, ICS_REGIONS, LIST_SIZES, ORG_TYPES, ORGANISATION_COMMITMENTS, accessRequestSchema } from "@/lib/access-requests/validation";

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
  { title: "A call with your clinical and operations leads", note: "Your cancellation process, waiting list and systems" },
  { title: "Setup and go-live", note: "Your clinic, your team, the checklist, then shadow mode" },
];

const box: React.CSSProperties = { display: "grid", gap: 8, border: 0, padding: 0, margin: 0, minWidth: 0 };
const optionStyle: React.CSSProperties = { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, fontWeight: 400, color: "var(--s-ink-2)", padding: "10px 12px", border: "1px solid var(--s-line)", borderRadius: 10, cursor: "pointer" };
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
  const toggle = (key: "ehrSystems" | "commitments", value: string) =>
    update(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value]);

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
          <span className="s-eyebrow">Request access</span>
          <h1 id="get-started-title" className="s-h1" style={{ fontSize: "clamp(36px, 4.6vw, 54px)" }}>Bring Aksh to your clinic.</h1>
          <p className="s-lede">Tell us about your organisation. It takes about two minutes.</p>
        </div>
      </section>

      <section className="s-section s-section--tight">
        <div className="s-container" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 48 }}>
          <div className="s-feature" style={{ alignItems: "start", gap: 56 }}>
            <aside style={{ display: "grid", gap: 20, alignContent: "start" }}>
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
                    <label className="s-field" id="field-odsCode">Organisation ID <span style={{ fontWeight: 400, color: "var(--s-faint)" }}>(optional)</span>
                      <input value={form.odsCode} onChange={(e) => update("odsCode", e.target.value)} placeholder="Registration, facility or licence ID" {...aria("odsCode")} />
                      {err("odsCode")}
                    </label>
                    <label className="s-field" id="field-itContact">IT lead <span style={{ fontWeight: 400, color: "var(--s-faint)" }}>(optional)</span>
                      <input value={form.itContact} onChange={(e) => update("itContact", e.target.value)} placeholder="Name and email" {...aria("itContact")} />
                      {err("itContact")}
                    </label>
                  </div>

                  <fieldset style={box} id="field-ehrSystems" {...aria("ehrSystems")}>
                    <legend className="s-field" style={{ marginBottom: 8 }}>Records or scheduling system in use</legend>
                    <div className="s-grid s-grid--2" style={{ gap: 8 }}>
                      {EHR_SYSTEMS.map((s) => (
                        <label key={s} style={optionStyle}>
                          <input type="checkbox" checked={form.ehrSystems.includes(s)} onChange={() => toggle("ehrSystems", s)} style={{ marginTop: 4 }} />
                          <span>{s}</span>
                        </label>
                      ))}
                    </div>
                    {err("ehrSystems")}
                  </fieldset>

                  <fieldset style={box} id="field-commitments" {...aria("commitments")}>
                    <legend className="s-field" style={{ marginBottom: 8 }}>Before go-live, your organisation can…</legend>
                    {ORGANISATION_COMMITMENTS.map((c) => (
                      <label key={c} style={optionStyle}>
                        <input type="checkbox" checked={form.commitments.includes(c)} onChange={() => toggle("commitments", c)} style={{ marginTop: 4 }} />
                        <span>{c.replace(/^We will /, "").replace(/^./, (x) => x.toUpperCase())}</span>
                      </label>
                    ))}
                    {err("commitments")}
                  </fieldset>

                  {submitError ? <p role="alert" style={errStyle}>{submitError}</p> : null}
                  <div className="s-actions" style={{ alignItems: "center" }}>
                    <button type="submit" className="s-btn s-btn--primary" disabled={submitting}>{submitting ? "Sending…" : "Send request"}</button>
                    <span className="s-small">We use these details only to respond. See our <Link href="/privacy" className="s-link">privacy notice</Link>.</span>
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
