"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { Today } from "@/lib/workspace/today";
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

function Task({ count, label, detail, href, urgent, testId }: { count: number | string; label: string; detail?: string; href: string; urgent?: boolean; testId?: string }) {
  return (
    <Link href={href} data-today-task={testId} className={cn("flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-secondary", urgent ? "border-danger" : "border-border-subtle")}>
      <span className={cn("min-w-[3rem] text-3xl font-semibold tabular-nums", urgent ? "text-danger" : "text-foreground")}>{count}</span>
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{label}</span>
        {detail ? <span className="block text-sm text-muted">{detail}</span> : null}
      </span>
    </Link>
  );
}

/** The real workspace home: what needs a person now. Counts come from live records only. */
export function TodayView({ name }: { name?: string | null }) {
  const [t, setT] = useState<Today | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const greeting = name?.trim() ? `Hello, ${name.trim().split(/\s+/)[0]}` : "Today";
  if (error) return <p className="m-6 rounded-xl border border-border-subtle bg-card p-4 text-sm" role="alert">{error}</p>;
  if (!t) return <p className="p-6 text-sm text-muted">Loading…</p>;

  const setup = t.setup.step !== "done" ? SETUP[t.setup.step] : null;
  const tasks = [
    t.handoffs.overdue ? { count: t.handoffs.overdue, label: "Hand-offs overdue", detail: "Slots passed to a person that are past their due time", href: "/dashboard/access", urgent: true, id: "handoffs-overdue" } : null,
    t.cgm && t.cgm.lowGlucose ? { count: t.cgm.lowGlucose, label: "Patients with low glucose on CGM", detail: "Time below range above target", href: "/dashboard/monitoring", urgent: true, id: "cgm-low" } : null,
    { count: t.slots.toWork, label: "Cancelled slots to fill", detail: t.slots.offersClosingSoon ? `${t.slots.offersClosingSoon} closing within 4 hours` : "Match, offer and book", href: "/dashboard/access", urgent: t.slots.offersClosingSoon > 0, id: "slots" },
    t.slots.awaitingReadBack ? { count: t.slots.awaitingReadBack, label: "Bookings to check in your schedule", detail: "Accepted, waiting for read-back", href: "/dashboard/access", id: "read-back" } : null,
    t.handoffs.open - t.handoffs.overdue > 0 ? { count: t.handoffs.open - t.handoffs.overdue, label: "Hand-offs open", href: "/dashboard/access", id: "handoffs" } : null,
    t.readingsToReview !== null ? { count: t.readingsToReview, label: "Patient readings to review", detail: "Shared by patients in the last 30 days", href: "/dashboard/network", id: "readings" } : null,
    t.cgm && t.cgm.uploadsToReview ? { count: t.cgm.uploadsToReview, label: "CGM uploads to review", detail: "Patient uploads count once a clinician checks them", href: "/dashboard/monitoring", id: "cgm-uploads" } : null,
  ].filter(Boolean) as { count: number; label: string; detail?: string; href: string; urgent?: boolean; id: string }[];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6" data-today>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="text-sm text-muted">{t.slots.filledLast7Days} slot{t.slots.filledLast7Days === 1 ? "" : "s"} filled and verified in the last 7 days.</p>
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
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Needs you</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {tasks.map((x) => <Task key={x.id} count={x.count} label={x.label} detail={x.detail} href={x.href} urgent={x.urgent} testId={x.id} />)}
          </div>
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
                  {STATUS_LABEL[o.status] ?? o.status} · {o.patients} patients · {o.waiting} waiting · {o.staff} staff
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
