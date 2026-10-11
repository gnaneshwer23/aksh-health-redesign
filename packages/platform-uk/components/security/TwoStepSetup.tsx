"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Status = { enabled: boolean; pending: boolean; recoveryCodesLeft: number };

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/me/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

/** Turn two-step sign-in on (authenticator app) or off. Recovery codes are shown once. */
export function TwoStepSetup() {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/me/mfa");
    if (r.ok) setStatus(await r.json());
  }, []);
  useEffect(() => void load(), [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6" data-security>
      <h1 className="text-xl font-semibold text-foreground">Security</h1>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Two-step sign-in</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm" data-two-step>
          <p className="text-muted">After your password, Aksh asks for a code from an authenticator app on your phone. Required for Aksh go-live reviewers; recommended for organisation admins.</p>
          {message ? <p role="status">{message}</p> : null}
          {codes ? (
            <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-4" data-recovery-codes>
              <p className="font-medium text-foreground">Recovery codes: keep them somewhere safe. Each works once if you lose your phone. Shown only now.</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setCodes(null)}>I&apos;ve saved them</Button>
            </div>
          ) : null}
          {status?.enabled ? (
            <>
              <p className="font-medium text-foreground" data-two-step-on>On · {status.recoveryCodesLeft} recovery codes left</p>
              <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
                e.preventDefault();
                const r = await post({ action: "disable", code });
                setMessage(r.ok ? "Two-step sign-in turned off." : r.data.error ?? "Could not turn it off");
                setCode("");
                await load();
              }}>
                <label><span className="block text-xs text-muted">Current code (to turn off)</span><Input value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code to turn off" className="w-48" /></label>
                <Button type="submit" variant="outline" size="sm">Turn off</Button>
              </form>
            </>
          ) : setup ? (
            <div className="space-y-2" data-two-step-setup>
              <p>1. In your authenticator app, add an account with this key (or open the link on your phone):</p>
              <p className="break-all rounded-lg bg-surface-muted p-2 font-mono text-sm" data-two-step-secret>{setup.secret.match(/.{1,4}/g)!.join(" ")}</p>
              <a className="text-xs text-secondary underline" href={setup.uri}>Open in authenticator app</a>
              <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                const r = await post({ action: "confirm", code }).finally(() => setBusy(false));
                if (r.ok) {
                  setCodes(r.data.recoveryCodes);
                  setSetup(null);
                  setMessage("Two-step sign-in is on.");
                } else setMessage(r.data.error ?? "That code didn't work");
                setCode("");
                await load();
              }}>
                <label><span className="block text-xs text-muted">2. Enter the 6-digit code it shows</span><Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Authenticator code" className="w-40" /></label>
                <Button type="submit" size="sm" disabled={busy}>{busy ? "Checking…" : "Turn on"}</Button>
              </form>
            </div>
          ) : status ? (
            <Button onClick={async () => {
              const r = await post({ action: "start" });
              if (r.ok) setSetup(r.data);
              else setMessage(r.data.error ?? "Could not start set-up");
            }}>Set up two-step sign-in</Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
