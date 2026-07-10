"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const diabetesSteps = [
  "AI detects HbA1c 9.0 (was 7.1 six months ago)",
  "Checks: last review date, current medications, screening status, complications",
  "Creates tasks: book diabetes review, arrange retinal screening, medication assessment",
  "Contacts patient: Voice agent calls to book appointment",
  "GP notified: dashboard shows risk flag + recommended actions",
  "Care plan updated: FHIR CarePlan resource with all tasks and dates",
  "Outcome tracked: if HbA1c improves, workflow closes. If not, escalation.",
];

const abbreviatedPathways = {
  "heart-failure": [
    "Voice Care Agent calls Day 3 post-discharge",
    "Weight gain + breathlessness detected — risk scored HIGH",
    "Nurse escalation triggered, FHIR Task created, readmission prevented",
  ],
  copd: [
    "ORACLE flags rising exacerbation risk from spirometry trend",
    "Medication review task created, rescue pack dispatched",
    "GP dashboard shows COPD pathway status with HITL approval gate",
  ],
  "post-surgical": [
    "Post-op check-in via Health Companion app",
    "Wound photo + symptom score analysed — infection risk flagged",
    "Surgical team notified, review appointment auto-scheduled",
  ],
};

function PathwaySteps({ steps }: { steps: string[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-accent pl-6">
      {steps.map((step, index) => (
        <li key={step} className="relative">
          <span className="absolute -left-[1.65rem] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {index + 1}
          </span>
          <p className="text-sm">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export function CarePathwaySection() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            From Detection to Resolution — Automated.
          </h2>
          <p className="mt-4 text-muted">
            Aksh Health converts clinical guidelines into intelligent care
            pathways that run automatically, escalating to humans at every
            critical decision point.
          </p>
        </div>
        <div className="mt-10">
          <Tabs defaultValue="diabetes">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="diabetes">Diabetes</TabsTrigger>
              <TabsTrigger value="heart-failure">Heart Failure</TabsTrigger>
              <TabsTrigger value="copd">COPD</TabsTrigger>
              <TabsTrigger value="post-surgical">Post-Surgical</TabsTrigger>
            </TabsList>
            <TabsContent value="diabetes" className="mt-8">
              <p className="mb-6 text-sm font-semibold text-secondary">
                Trigger: HbA1c rises above threshold
              </p>
              <PathwaySteps steps={diabetesSteps} />
            </TabsContent>
            {Object.entries(abbreviatedPathways).map(([key, steps]) => (
              <TabsContent key={key} value={key} className="mt-8">
                <PathwaySteps steps={steps} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
}
