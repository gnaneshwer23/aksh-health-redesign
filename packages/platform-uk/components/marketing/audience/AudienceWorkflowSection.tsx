import {
  BarChart3,
  CheckSquare,
  Database,
  FileText,
  Settings,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import type { AudienceWorkflow, WorkflowIconName } from "@/components/marketing/audience/audience-content";

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

export function AudienceWorkflowSection({ workflow }: AudienceWorkflowSectionProps) {
  return (
    <section className="bg-surface-muted py-20 md:py-24" aria-labelledby="audience-workflow-heading">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-14 md:mb-16">
          <p className="marketing-section-label mb-3">{workflow.sectionLabel}</p>
          <h2 id="audience-workflow-heading" className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            {workflow.sectionTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-steel">{workflow.sectionDescription}</p>
        </div>

        <ol className="marketing-timeline">
          {workflow.steps.map((step) => {
            const Icon = workflowIcons[step.iconName];
            return (
              <li key={step.number} className="marketing-timeline-item flex gap-5 py-6 first:pt-0 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald/25 bg-emerald/[0.06] text-emerald">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald">Step {step.number}</p>
                  <h3 className="mt-1 text-lg font-semibold text-navy">{step.title}</h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-steel">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-10 border-t border-border-subtle pt-6 text-sm text-steel">{workflow.disclaimer}</p>
      </div>
    </section>
  );
}
