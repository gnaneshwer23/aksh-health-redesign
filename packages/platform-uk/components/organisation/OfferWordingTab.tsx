"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Data = {
  active: { body: string; version: string; preview: string };
  placeholders: Record<string, string>;
  versions: { version: number; body: string; note: string | null; approvedBy: string; approvedAt: string }[];
  check?: { problems: string[]; preview: string };
};

/** PRD v1.1 PA-04 / PA-108: the wording of slot offers, approved by the organisation, versioned. */
export function OfferWordingTab({ org, onMessage }: { org: { id: string; isAdmin: boolean }; onMessage: (m: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [check, setCheck] = useState<Data["check"] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/orgs/${org.id}/offer-templates`);
    if (r.ok) {
      const d = (await r.json()) as Data;
      setData(d);
      setDraft((cur) => cur || d.active.body);
    }
  }, [org.id]);
  useEffect(() => void load(), [load]);

  // Check the wording as it changes (debounced), without saving.
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => {
      void fetch(`/api/orgs/${org.id}/offer-templates?preview=${encodeURIComponent(draft)}`)
        .then(async (r) => (r.ok ? ((await r.json()) as Data).check ?? null : null))
        .then(setCheck)
        .catch(() => undefined);
    }, 350);
    return () => clearTimeout(t);
  }, [draft, org.id]);

  if (!data) return <p className="text-sm text-muted">Loading…</p>;
  const unchanged = draft.trim() === data.active.body.trim();

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]" data-offer-wording>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Offer wording</CardTitle>
          <p className="text-sm text-muted">
            The message staff send when offering a freed slot. Only slot and organisation facts can be inserted, never clinical details. In use:{" "}
            <Badge variant="outline">{data.active.version === "offer-template-v1" ? "Aksh default" : data.active.version.replace("org-template-v", "Version ")}</Badge>
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-muted">Wording</span>
            <textarea id="offer-wording" aria-label="Offer wording" rows={5} maxLength={640} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!org.isAdmin} className="mt-1 w-full rounded-xl p-3 font-mono text-[13px] leading-relaxed" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.placeholders).map(([k, v]) => (
              <button key={k} type="button" title={v} disabled={!org.isAdmin} onClick={() => setDraft((d) => `${d}{${k}}`)} className="rounded-md border border-border-subtle px-2 py-0.5 font-mono text-xs text-foreground hover:border-secondary">{`{${k}}`}</button>
            ))}
          </div>
          {check ? (
            check.problems.length ? (
              <ul className="list-disc space-y-1 rounded-xl border border-[#f0d9a8] bg-[#fdf3e1] py-2 pl-7 pr-3 text-xs text-[#7a4800]" role="status" data-wording-problems>
                {check.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            ) : (
              <div className="rounded-xl border border-secondary/20 bg-pastel-mint p-3" data-wording-preview>
                <p className="text-xs font-medium text-muted">Preview with sample details</p>
                <p className="mt-1 text-foreground">{check.preview}</p>
                <p className="mt-1 text-xs text-muted">{check.preview.length} characters · about {Math.max(1, Math.ceil(check.preview.length / 153))} text message{check.preview.length > 160 ? "s" : ""}</p>
              </div>
            )
          ) : null}
          {org.isAdmin ? (
            <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await fetch(`/api/orgs/${org.id}/offer-templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: draft, note: note || undefined }) });
              const d = await r.json().catch(() => ({}));
              setBusy(false);
              if (r.ok) { onMessage(`Wording approved as version ${d.version}. New offers use it.`); setNote(""); void load(); }
              else onMessage(d.error ?? "Could not approve the wording");
            }}>
              <label className="min-w-[14rem] flex-1 text-xs text-muted">Why it changed (optional)
                <input id="offer-wording-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 block h-9 w-full rounded-xl px-2 text-sm" aria-label="Why it changed" />
              </label>
              <Button type="submit" size="sm" disabled={busy || unchanged || !check || check.problems.length > 0}>Approve wording</Button>
            </form>
          ) : <p className="text-xs text-muted">Only admins approve offer wording.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Versions ({data.versions.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm" data-wording-versions>
          {data.versions.length === 0 ? <p className="text-muted">No approved versions yet. Offers use the Aksh default.</p> : null}
          {data.versions.map((v, i) => (
            <div key={v.version} className="rounded-xl border border-border-subtle p-3">
              <p className="text-xs text-muted">Version {v.version}{i === 0 ? " · in use" : ""} · approved by {v.approvedBy} · {new Date(v.approvedAt).toLocaleString()}</p>
              <p className="mt-1 whitespace-pre-wrap font-mono text-[12.5px] text-foreground">{v.body}</p>
              {v.note ? <p className="mt-1 text-xs text-muted">{v.note}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
