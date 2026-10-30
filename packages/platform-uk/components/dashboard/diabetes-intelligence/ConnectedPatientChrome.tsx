"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  CONNECTED_JOURNEY_DISCLOSURE,
  CONNECTED_JOURNEY_STEPS,
  type ConnectedJourneyStepId,
} from "@/lib/diabetes-intelligence/connected-journey-steps";

type Props = {
  patientId: string;
  patientLabel?: string;
  activeStep: ConnectedJourneyStepId;
  /** Workspace-specific primary actions (seed, draft, worklist). */
  actions?: ReactNode;
  subtitle?: string;
};

/**
 * Shared patient header + journey stepper for Connected Diabetes Intelligence.
 * Reduces redundant cross-links without deleting phase workspaces.
 */
export function ConnectedPatientChrome({
  patientId,
  patientLabel,
  activeStep,
  actions,
  subtitle,
}: Props) {
  const label = patientLabel?.trim() || patientId;

  return (
    <header
      className="rounded-lg border border-[#d7e3ef] bg-white p-5 text-[#0f2744]"
      data-testid="connected-patient-chrome"
      data-active-step={activeStep}
      data-patient-id={patientId}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide text-teal-700"
        role="status"
      >
        Connected diabetes intelligence · {CONNECTED_JOURNEY_DISCLOSURE}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="mt-1 text-sm text-[#5b6b7c]">
            Patient id {patientId}
            {subtitle ? ` · ${subtitle}` : null}
          </p>
        </div>
        <ButtonishLink href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}`}>
          Patient chart
        </ButtonishLink>
      </div>

      <nav
        className="mt-4 flex flex-wrap gap-2"
        aria-label="Connected diabetes journey steps"
        data-testid="connected-journey-stepper"
      >
        {CONNECTED_JOURNEY_STEPS.map((step) => {
          const current = step.id === activeStep;
          return (
            <Link
              key={step.id}
              href={step.href(patientId)}
              aria-current={current ? "step" : undefined}
              data-testid={`connected-step-${step.id}`}
              className={
                current
                  ? "rounded-md bg-[#0f2744] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md border border-[#d7e3ef] bg-[#f7fafc] px-3 py-1.5 text-sm text-[#0f2744] hover:border-teal-600"
              }
            >
              <span className="opacity-70">{step.phase} · </span>
              {step.shortLabel}
            </Link>
          );
        })}
      </nav>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

function ButtonishLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-[#d7e3ef] px-3 py-1.5 text-sm text-[#0f2744] hover:border-teal-600"
    >
      {children}
    </Link>
  );
}
