import type { AudienceWorkflow } from "@/components/marketing/audience/audience-content";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";

type AudienceWorkflowSectionProps = {
  workflow: AudienceWorkflow;
};

export function AudienceWorkflowSection({ workflow }: AudienceWorkflowSectionProps) {
  const stepCount = workflow.steps.length;
  const gridCols =
    stepCount <= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : stepCount === 5
        ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="bg-surface-muted py-20 md:py-24" aria-labelledby="audience-workflow-heading">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <MarketingSectionHeader
          align="left"
          label={workflow.sectionLabel}
          title={workflow.sectionTitle}
          description={workflow.sectionDescription}
        />

        <div className={`grid gap-6 ${gridCols}`}>
          {workflow.steps.map((step, index) => (
            <PastelCapabilityCard
              key={step.title}
              variant={pastelVariantAt(index)}
              icon={step.icon}
              stepNumber={String(index + 1).padStart(2, "0")}
              label={step.label}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>

        {workflow.disclaimer ? (
          <p className="mt-10 border-t border-border-subtle pt-6 text-sm text-steel">{workflow.disclaimer}</p>
        ) : null}
      </div>
    </section>
  );
}
