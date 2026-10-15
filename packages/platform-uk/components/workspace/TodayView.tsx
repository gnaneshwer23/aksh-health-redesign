"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { Today, WorkItem, WorkKind } from "@/lib/workspace/today";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  sandbox: "Setting up",
  onboarding: "Go-live under review",
  live_read_only: "Live (shadow mode)",
  live: "Live",
  suspended: "Suspended",
};

const SETUP: Record<Exclude<Today["setup"]["step"], "done">, { title: string; body: string; cta: string; href: (orgId: string | null) => string }> = {
  create_or_join: {
    title: "Join your clinic",
    body: "Ask your clinic's admin for an invite code, or set up your clinic if you are the admin.",
    cta: "Open organisation",
    href: () => "/dashboard/organisation",
  },
  add_patients: {
    title: "Add your patients",
    body: "Import your diabetes patients from a CSV export of your records system, or add them one by one.",
    cta: "Add patients",
    href: (id) => `/dashboard/organisation?org=${id}&tab=patients`,
  },
  add_waitlist: {
    title: "Build the waiting list",
    body: "Add patients who need an earlier appointment. Aksh matches them to cancelled slots.",
    cta: "Add to waiting list",
    href: (id) => `/dashboard/organisation?org=${id}&tab=patients`,
  },
  go_live: {
    title: "Go live",
    body: "Complete the go-live checklist so Aksh can review your organisation and switch on shadow mode.",
    cta: "Open go-live checklist",
    href: (id) => `/dashboard/organisation?org=${id}&tab=go-live`,
  },
};

const KIND_LABEL: Record<WorkKind, string> = {
  handoff: "Hand-offs",
  cgm_low: "Low glucose",
  slot: "Freed slots",
  read_back: "Bookings to confirm",
  readings: "Readings to check",
  cgm_upload: "CGM uploads",
};
const PRIORITY: Record<0 | 1 | 2, { label: string; className: string }> = {
  0: { label: "Urgent", className: "bg-danger/10 text-[#b42318]" },
  1: { label: "Due soon", className: "bg-[#fbf0d9] text-[#8a5a00]" },
  2: { label: "When you can", className: "bg-surface-muted text-muted" },
};

function when(iso: string | null, label: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const mins = Math.round((d.getTime() - Date.now()) / 60_000);
  const rel = mins < 0 ? `${label === "Due" ? "overdue by" : "was"} ${Math.abs(mins) < 120 ? `${Math.abs(mins)} min` : `${Math.round(Math.abs(mins) / 60)} h`}` : mins < 120 ? `in ${mins} min` : mins < 48 * 60 ? `in ${Math.round(mins / 60)} h` : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${label} ${rel}`;
}

/** One row of work: what it is, why, when, and the action. */
function WorkRow({ item }: { item: WorkItem }) {
  const p = PRIORITY[item.priority];
  const appt = item.appointmentAt ? new Date(item.appointmentAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle px-4 py-3 first:border-t-0" data-work-item={item.kind} data-priority={item.priority}>
      <span className={cn("w-24 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold", p.className)}>{p.label}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{item.title}</span>
        <span className="block text-sm text-muted">{item.why}</span>
        <span className="block text-xs text-muted">
          {[appt ? `Appointment ${appt}` : null, when(item.due, "Due"), item.organisation].filter(Boolean).join(" · ")}
        </span>
      </span>
      <Link href={item.href} className="shrink-0 rounded-full bg-navy px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">{item.action}</Link>
    </li>
  );
}

/** The real workspace home: what needs a person now. Counts come from live records only. */
export function TodayView({ name }: { name?: string | null }) {
  const [t, setT] = useState<Today | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WorkKind | "all">("all");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/today")
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) setError(body.error ?? "Could not load today's work");
        else setT(body as Today);
      })
      .catch(() => !cancelled && setError("Could not load today's work"));
    return () => {
      cancelled = true;
    };
  }, []);

  // "Dr Maya Chen" → "Hello, Dr Chen"; "Maya Chen" → "Hello, Maya".
  const parts = name?.trim().split(/\s+/) ?? [];
  const title = /^(dr|prof|mr|mrs|ms|mx|miss)\.?$/i.test(parts[0] ?? "") ? parts[0] : null;
  const greeting = !parts.length ? "Today" : title && parts.length > 1 ? `Hello, ${title} ${parts[parts.length - 1]}` : `Hello, ${parts[0]}`;
  if (error) return <p className="m-6 rounded-xl border border-border-subtle bg-card p-4 text-sm" role="alert">{error}</p>;
  if (!t) return <p className="p-6 text-sm text-muted" role="status">Loading today’s work…</p>;

  const setup = t.setup.step !== "done" ? SETUP[t.setup.step] : null;
  const kinds = (Object.keys(KIND_LABEL) as WorkKind[]).map((k) => [k, t.work.filter((w) => w.kind === k).length] as const).filter(([, n]) => n > 0);
  const shown = filter === "all" ? t.work : t.work.filter((w) => w.kind === filter);
  const urgent = t.work.filter((w) => w.priority === 0).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6" data-today>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="text-sm text-muted">What needs a person today, most urgent first.</p>
      </div>

      {setup ? (
        <Card className="border-secondary" data-today-setup={t.setup.step}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">Next step</p>
              <p className="text-lg font-semibold text-foreground">{setup.title}</p>
              <p className="text-sm text-muted">{setup.body}</p>
            </div>
            <Link href={setup.href(t.setup.orgId)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">{setup.cta}</Link>
          </CardContent>
        </Card>
      ) : null}

      {t.organisations.length ? (
        <section className="space-y-3" data-needs-you>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Needs you now</h2>
            <p className="text-sm text-muted">{t.work.length ? `${t.work.length} item${t.work.length === 1 ? "" : "s"}${urgent ? `, ${urgent} urgent` : ""}` : "Nothing waiting"}</p>
          </div>
          {kinds.length > 1 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter work">
              {([["all", t.work.length] as const, ...kinds]).map(([k, n]) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={cn("rounded-full border px-3 py-1 text-sm", filter === k ? "border-navy bg-navy text-white" : "border-border-subtle bg-card text-foreground hover:border-navy")}>
                  {k === "all" ? "All" : KIND_LABEL[k]} <span className="tabular-nums opacity-70">{n}</span>
                </button>
              ))}
            </div>
          ) : null}
          {shown.length ? (
            <ul className="overflow-hidden rounded-2xl border border-border-subtle bg-card">{shown.map((w) => <WorkRow key={w.id} item={w} />)}</ul>
          ) : (
            <p className="rounded-2xl border border-border-subtle bg-card p-5 text-sm text-muted" data-work-empty>
              Nothing needs you right now. New freed slots, hand-offs, shared readings and CGM data will appear here as they arrive.
            </p>
          )}
          <p className="text-xs text-muted">
            {t.slots.filledLast7Days} slot{t.slots.filledLast7Days === 1 ? "" : "s"} filled and confirmed in the last 7 days
            {t.cgm ? ` · ${t.cgm.patients} patient${t.cgm.patients === 1 ? "" : "s"} with recent CGM data` : ""}.
          </p>
        </section>
      ) : null}

      {t.organisations.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your organisation{t.organisations.length > 1 ? "s" : ""}</h2>
          <div className="space-y-2">
            {t.organisations.map((o) => (
              <Link key={o.id} href={`/dashboard/organisation?org=${o.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-card p-4 hover:border-secondary" data-today-org>
                <span className="font-medium text-foreground">{o.name}</span>
                <span className="text-sm text-muted">
                  {STATUS_LABEL[o.status] ?? o.status} · {o.patients} patient{o.patients === 1 ? "" : "s"} · {o.waiting} waiting · {o.staff} staff
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
