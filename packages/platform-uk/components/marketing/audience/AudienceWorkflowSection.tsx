"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Database,
  FileText,
  Settings,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import type { AudienceWorkflow, WorkflowIconName } from "@/components/marketing/audience/audience-content";
import { cn } from "@/lib/utils";

const workflowIcons: Record<WorkflowIconName, typeof UserPlus> = {
  UserPlus,
  Settings,
  Database,
  Stethoscope,
  CheckSquare,
  FileText,
  Shield,
  Users,
  BarChart3,
};

type AudienceWorkflowSectionProps = {
  workflow: AudienceWorkflow;
};

function WorkflowMockPanel({
  step,
  disclaimer,
}: {
  step: AudienceWorkflow["steps"][number];
  disclaimer: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-muted/60 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">{step.mockTitle}</p>
          {step.mockSubtitle && <p className="text-sm font-bold text-navy">{step.mockSubtitle}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/25 bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
          Demo
        </span>
      </div>

      {step.mockStats && step.mockStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-b border-border-subtle p-5 sm:grid-cols-3">
          {step.mockStats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border-subtle bg-surface-muted/50 p-4">
              <p className={cn("text-2xl font-bold", stat.tone ?? "text-navy")}>{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-steel">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5 p-5">
        {step.mockRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-muted/40 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {row.badge && (
                <span
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                    row.tone ?? "bg-navy"
                  )}
                >
                  {row.badge}
                </span>
              )}
              <span className="truncate text-sm text-slate">{row.label}</span>
              {row.detail && <span className="hidden text-xs text-steel sm:inline">{row.detail}</span>}
            </div>
            {row.status && (
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold",
                  row.statusTone === "success" && "text-emerald",
                  row.statusTone === "warning" && "text-warning",
                  row.statusTone === "danger" && "text-danger",
                  !row.statusTone && "text-steel"
                )}
              >
                {row.status}
              </span>
            )}
            {!row.status && row.badge && <CheckCircle2 className="h-4 w-4 shrink-0 text-steel/40" aria-hidden />}
          </div>
        ))}
      </div>

      {(step.mockFooter || disclaimer) && (
        <div className="flex items-center gap-2 border-t border-border-subtle bg-surface-muted/50 px-5 py-3">
          <Shield className="h-4 w-4 shrink-0 text-emerald" aria-hidden />
          <p className="text-xs text-steel">{step.mockFooter ?? disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function ArchitectureDiagram({ stages }: { stages: string[] }) {
  return (
    <div
      className="mt-12 rounded-2xl border border-border-subtle bg-white p-6 shadow-card md:p-8"
      aria-label="Platform data flow"
    >
      <p className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-steel">Data flow</p>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center md:gap-2">
        {stages.map((stage, index) => (
          <div key={stage} className="flex items-center gap-2 md:gap-2">
            <div
              className={cn(
                "flex-1 rounded-xl border px-4 py-3 text-center text-sm font-semibold md:flex-none md:min-w-[9rem]",
                index === 0 && "border-sky-200 bg-sky-50 text-sky-800",
                index === 1 && "border-navy/20 bg-navy/5 text-navy",
                index === 2 && "border-emerald/25 bg-emerald/5 text-emerald",
                index === 3 && "border-purple-200 bg-purple-50 text-purple-800"
              )}
            >
              {stage}
            </div>
            {index < stages.length - 1 && (
              <ChevronRight className="mx-auto hidden h-5 w-5 shrink-0 text-steel/50 md:block" aria-hidden />
            )}
            {index < stages.length - 1 && (
              <ArrowRight className="mx-auto h-4 w-4 shrink-0 text-steel/40 md:hidden" aria-hidden />
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-steel">
        Nothing is written to the EHR without explicit clinician approval.
      </p>
    </div>
  );
}

export function AudienceWorkflowSection({ workflow }: AudienceWorkflowSectionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const current = workflow.steps[activeStep];

  return (
    <section className="bg-surface-muted py-20 md:py-24" aria-labelledby="audience-workflow-heading">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 max-w-2xl md:mb-14">
          <p className="marketing-section-label mb-3">{workflow.sectionLabel}</p>
          <h2 id="audience-workflow-heading" className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            {workflow.sectionTitle}
          </h2>
          <p className="mt-3 text-lg text-steel">{workflow.sectionDescription}</p>
        </div>

        {/* Desktop: horizontal step diagram */}
        <div className="mb-10 hidden lg:block">
          <ol className="flex items-start justify-between gap-1">
            {workflow.steps.map((step, index) => {
              const Icon = workflowIcons[step.iconName];
              const isActive = index === activeStep;
              const isPast = index < activeStep;
              return (
                <li key={step.number} className="relative flex flex-1 flex-col items-center">
                  {index < workflow.steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-[calc(50%+1.75rem)] top-7 h-0.5 w-[calc(100%-3.5rem)]",
                        isPast ? "bg-emerald" : "bg-border-subtle"
                      )}
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      "group relative z-10 flex flex-col items-center text-center transition-colors",
                      isActive ? "text-navy" : "text-steel hover:text-navy"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all",
                        isActive && "border-emerald bg-emerald text-white shadow-card",
                        isPast && !isActive && "border-emerald/60 bg-emerald/10 text-emerald",
                        !isActive && !isPast && "border-border-subtle bg-white text-steel group-hover:border-emerald/40"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="mb-1 text-xs font-bold text-emerald">Step {step.number}</span>
                    <span className="max-w-[8.5rem] text-sm font-semibold leading-snug">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile: vertical step list */}
        <div className="mb-8 lg:hidden">
          <ol className="relative space-y-0">
            {workflow.steps.map((step, index) => {
              const Icon = workflowIcons[step.iconName];
              const isActive = index === activeStep;
              return (
                <li key={step.number} className="relative flex gap-4">
                  {index < workflow.steps.length - 1 && (
                    <div
                      className="absolute left-[1.65rem] top-14 h-[calc(100%-2rem)] w-0.5 bg-border-subtle"
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className="relative z-10 mb-4 flex w-full items-start gap-4 rounded-xl border border-transparent p-2 text-left transition-colors hover:bg-white/60"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
                        isActive && "border-emerald bg-emerald text-white",
                        !isActive && "border-border-subtle bg-white text-steel"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-xs font-bold text-emerald">Step {step.number}</p>
                      <p className="font-semibold text-navy">{step.title}</p>
                      <p className="mt-1 text-sm text-steel">{step.description}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* Step detail (desktop sidebar) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border-subtle bg-white p-8 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald">Step {current.number}</p>
              <h3 className="mt-2 text-xl font-bold text-navy">{current.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">{current.description}</p>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-steel transition-colors hover:bg-surface-muted disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeStep === workflow.steps.length - 1}
                  onClick={() => setActiveStep((s) => Math.min(workflow.steps.length - 1, s + 1))}
                  className="rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald/90 disabled:opacity-40"
                >
                  Next step
                </button>
              </div>

              <p className="mt-6 text-xs text-steel">{workflow.disclaimer}</p>
            </div>
          </div>

          {/* Dashboard mock */}
          <WorkflowMockPanel step={current} disclaimer={workflow.disclaimer} />
        </div>

        {workflow.architecture && workflow.architecture.stages.length > 0 && (
          <ArchitectureDiagram stages={workflow.architecture.stages} />
        )}
      </div>
    </section>
  );
}
