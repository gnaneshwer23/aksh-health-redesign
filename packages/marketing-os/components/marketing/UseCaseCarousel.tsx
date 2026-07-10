import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const useCases = [
  {
    title: "Type 2 Diabetes + DVT",
    description:
      "A patient presents with worsening glycaemic control and suspected DVT. See how all seven agents work together in a single consultation.",
    href: "/use-cases/t2d-dvt",
  },
  {
    title: "Post-Discharge Heart Failure",
    description:
      "Mrs Johnson is discharged. Three days later, the Voice Care Agent detects readmission risk and escalates before she deteriorates.",
    href: "/use-cases/heart-failure",
  },
  {
    title: "Hospital Winter Surge",
    description:
      "The Hospital Command Agent predicts a 22% increase in ED admissions. The Digital Twin recommends discharge acceleration 72 hours in advance.",
    href: "/use-cases/winter-surge",
  },
  {
    title: "ICS Equity Review",
    description:
      "The EQUITY agent detects a disparity in T2D outcomes across IMD quintiles across 47 practices. Population intervention is triggered.",
    href: "/use-cases/equity",
  },
];

export function UseCaseCarousel() {
  return (
    <section className="bg-card py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          See It In Action
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="flex flex-col">
              <CardHeader>
                <CardTitle>{useCase.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="flex-1 text-sm text-muted">{useCase.description}</p>
                <Button variant="outline" className="mt-6 w-fit" asChild>
                  <Link href={useCase.href}>Read Case Study</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
