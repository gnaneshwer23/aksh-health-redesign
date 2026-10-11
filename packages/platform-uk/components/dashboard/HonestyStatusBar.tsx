"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type DataSource = "neo4j" | "mock" | "demo" | null;

/** Screens that read the organisation's own records. Everything else still shows sample content. */
const REAL_DATA_SURFACES = new Set(["Organisation", "Care network", "Slot fill", "Go-live reviews"]);
type OrgStatus = { name: string; status: string };

/**
 * Single quiet honesty/status strip for dashboards.
 * Replaces stacked DemoData + Neo4j + HITL essay banners at rest.
 */
export function HonestyStatusBar({
  className,
  surface = "Clinical",
  isPublicDemo = false,
  neo4jSource = null,
  neo4jLoading = false,
  showNeo4jLive = false,
}: {
  className?: string;
  surface?: string;
  isPublicDemo?: boolean;
  neo4jSource?: DataSource;
  neo4jLoading?: boolean;
  showNeo4jLive?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const realData = REAL_DATA_SURFACES.has(surface);
  const [orgs, setOrgs] = useState<OrgStatus[] | null>(null);
  const [orgsFailed, setOrgsFailed] = useState(false);

  // Only real-data screens can honestly say "live"; they ask which organisations this user belongs to.
  useEffect(() => {
    if (!realData || isPublicDemo) return;
    let cancelled = false;
    fetch("/api/orgs")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { rows?: OrgStatus[] }) => {
        if (cancelled) return;
        setOrgsFailed(false);
        setOrgs(d.rows ?? []);
      })
      .catch(() => !cancelled && setOrgsFailed(true));
    return () => {
      cancelled = true;
    };
  }, [realData, isPublicDemo]);
  // Only speak for an organisation when the user belongs to exactly one; with several, the Organisation page shows each.
  const only = orgs?.length === 1 ? orgs[0] : undefined;
  const liveOrg = only && (only.status === "live_read_only" || only.status === "live") ? only : undefined;
  const reviewOrg = only?.status === "onboarding" ? only : undefined;

  const neo4jLabel =
    neo4jLoading || neo4jSource === null || neo4jSource === "demo"
      ? null
      : neo4jSource === "neo4j"
        ? showNeo4jLive
          ? "graph:live"
          : null
        : "graph:fallback";

  return (
    <div
      role="status"
      data-testid="honesty-status-bar"
      className={cn(
        "border-b border-border-subtle/70 bg-card/80 px-4 py-1.5 text-[11px] text-muted backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {process.env.NEXT_PUBLIC_AKSH_ENVIRONMENT === "simulation" ? (
          <span
            data-testid="simulation-environment-badge"
            className="rounded-full bg-[#8a5a00] px-2 py-0.5 font-semibold uppercase tracking-wide text-white"
          >
            Simulation environment
          </span>
        ) : null}
        {isPublicDemo ? (
          <>
            <span data-testid="demo-data-banner" className="font-medium text-pastel-amber-ink">
              Public {surface} demo · synthetic
            </span>
            <Link href="/signup" className="font-semibold text-secondary underline underline-offset-2">
              Start free
            </Link>
          </>
        ) : realData && (orgs === null || orgsFailed) ? (
          <span data-testid="workspace-status-unknown" className="font-medium text-foreground/80">
            {orgsFailed ? "Organisation status unavailable" : "Checking organisation status…"}
          </span>
        ) : liveOrg ? (
          <>
            <span data-testid="live-workspace-banner" className="font-medium text-foreground/80">
              {liveOrg.status === "live"
                ? `${liveOrg.name} is live — real records`
                : `${liveOrg.name} is live in shadow mode — real records; Aksh drafts, your staff decide and act`}
            </span>
          </>
        ) : reviewOrg ? (
          <>
            <span data-testid="review-workspace-banner" className="font-medium text-foreground/80">
              {reviewOrg.name}: go-live review in progress
            </span>
            <Link href="/dashboard/organisation" className="font-semibold text-secondary underline underline-offset-2">
              See checklist
            </Link>
          </>
        ) : (
          <>
            <span data-testid="synthetic-workspace-banner" className="font-medium text-foreground/80">
              Sandbox workspace — live patient data needs your organisation to go live
            </span>
            <Link href="/get-started" className="font-semibold text-secondary underline underline-offset-2">
              Bring Aksh to your organisation
            </Link>
          </>
        )}
        <span aria-hidden className="text-border">
          ·
        </span>
        <span>HITL approve</span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <span className="font-medium text-foreground/80">liveEmis:false</span>
        {surface.toLowerCase().includes("hospital") ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span data-testid="hospital-mock-mode-banner" className="text-pastel-amber-ink">
              Not live hospital system
            </span>
          </>
        ) : null}
        {neo4jLabel ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span
              data-testid={
                neo4jSource === "neo4j" ? "neo4j-live-mode-banner" : "neo4j-mock-mode-banner"
              }
              className={
                neo4jSource === "neo4j" ? "text-emerald-800" : "text-pastel-amber-ink"
              }
            >
              {neo4jLabel}
            </span>
          </>
        ) : null}
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          What&apos;s this?
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {expanded ? (
        <div className="mt-1.5 space-y-1 border-t border-border-subtle/60 pt-1.5 text-[10px] leading-relaxed text-muted">
          <p>
            Assisted diabetes / care-coordination drafts only — not diagnosis or autonomous care.
            Clinicians Approve before anything is staged. No live EHR write-back.
          </p>
          {surface.toLowerCase().includes("hospital") ? (
            <p>
              Hospital figures are synthetic hospital system rehearsal — not a live hospital system / EPR feed. Accept /
              Dismiss on capacity recommendations log to SHIELD only.
            </p>
          ) : null}
          {surface.toLowerCase().includes("ics") ? (
            <p>
              Regional views are aggregate planning fixtures — synthetic cohorts, no patient-level spill.
            </p>
          ) : null}
          {neo4jSource === "mock" ? (
            <p>
              Clinical graph is in local fallback mode (Neo4j not connected). Resume Aura if paused,
              then refresh — see{" "}
              <Link href="/security" className="underline underline-offset-2 hover:text-foreground">
                Security
              </Link>
              .
            </p>
          ) : null}
          {neo4jSource === "neo4j" && showNeo4jLive ? (
            <p>
              Graph data is live from Neo4j for this session — still synthetic rehearsal patients, not
              a live clinical feed.
            </p>
          ) : null}
          <p className="flex flex-wrap gap-x-2 gap-y-1">
            <Link href="/demo/script" className="text-primary underline-offset-2 hover:underline">
              Demo script
            </Link>
            <span aria-hidden>·</span>
            <Link href="/demo/patel" className="text-primary underline-offset-2 hover:underline">
              Walkthrough
            </Link>
            <span aria-hidden>·</span>
            <Link href="/security" className="text-primary underline-offset-2 hover:underline">
              Security
            </Link>
            {isPublicDemo ? (
              <>
                <span aria-hidden>·</span>
                <Link href="/signup" className="text-primary underline-offset-2 hover:underline">
                  Create account
                </Link>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
