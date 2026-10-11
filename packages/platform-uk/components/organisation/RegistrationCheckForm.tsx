"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Record what the official register showed for this person. Used by organisation admins (Staff tab) and Aksh admins
 * (go-live review); `endpoint` decides which.
 */
export function RegistrationCheckForm({
  endpoint,
  licensed,
  defaults,
  onDone,
}: {
  endpoint: string;
  licensed: boolean;
  defaults?: { registry?: string | null; registrationNumber?: string | null };
  onDone: (message: string) => void;
}) {
  const [f, setF] = useState({
    outcome: licensed ? "verified" : "not_applicable",
    registry: defaults?.registry ?? "",
    registrationNumber: defaults?.registrationNumber ?? "",
    checkedOn: today(),
    evidenceRef: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  const field = "mt-1 h-10 w-full rounded-xl border border-border bg-card px-2 text-sm";
  return (
    <form
      className="mt-2 grid gap-2 rounded-xl border border-border-subtle bg-surface-muted/40 p-3 text-sm sm:grid-cols-2"
      data-registration-check
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await r.json().catch(() => ({}));
        if (r.ok) onDone(f.outcome === "verified" ? "Registration recorded as checked" : f.outcome === "rejected" ? "Registration recorded as not matching" : "Recorded: no registration needed");
        else setError(data.details?.formErrors?.[0] ?? Object.values(data.details?.fieldErrors ?? {}).flat()[0] ?? data.error ?? "Could not record the check");
      }}
    >
      <label className="sm:col-span-2">
        <span className="text-muted">What did the register show?</span>
        <select className={field} value={f.outcome} onChange={set("outcome")} aria-label="Check outcome">
          <option value="verified">Registered and in good standing</option>
          <option value="rejected">Not found or does not match</option>
          {licensed ? null : <option value="not_applicable">No registration needed for this role</option>}
        </select>
      </label>
      {f.outcome !== "not_applicable" ? (
        <>
          <label><span className="text-muted">Register checked</span><Input value={f.registry} onChange={set("registry")} aria-label="Register checked" placeholder="e.g. national medical register" /></label>
          <label><span className="text-muted">Registration number</span><Input value={f.registrationNumber} onChange={set("registrationNumber")} aria-label="Registration number" /></label>
        </>
      ) : null}
      <label><span className="text-muted">Checked on</span><Input type="date" value={f.checkedOn} onChange={set("checkedOn")} aria-label="Checked on" max={today()} /></label>
      <label><span className="text-muted">Reference (link or search reference, optional)</span><Input value={f.evidenceRef} onChange={set("evidenceRef")} aria-label="Check reference" /></label>
      <label className="sm:col-span-2"><span className="text-muted">Note{f.outcome === "rejected" ? "" : " (optional)"}</span><Input value={f.note} onChange={set("note")} aria-label="Check note" /></label>
      <div className="sm:col-span-2"><Button type="submit" size="sm">Record check</Button></div>
      {error ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
    </form>
  );
}
