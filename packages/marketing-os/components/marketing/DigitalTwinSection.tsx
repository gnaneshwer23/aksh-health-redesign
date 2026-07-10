import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const twins = [
  {
    title: "Patient Digital Twin",
    description:
      "Aksh Health maintains a continuously updated simulation of each patient — their conditions, medications, lifestyle, risk trajectory, and predicted future health events.",
    useCases: [
      "Predict hospital admission 14 days before it happens",
      "Simulate treatment responses before prescribing",
      "Identify deterioration before the patient notices",
    ],
    accent: "border-l-accent",
  },
  {
    title: "Hospital Digital Twin",
    description:
      "Model your entire hospital in real time — beds, staff, demand, theatre utilisation, waiting lists.",
    useCases: [
      "Winter surge planning: what if admissions rise 20%?",
      "Bed management: predict discharge bottlenecks 48 hours ahead",
      "Theatre optimisation: AI schedules elective capacity around ED demand",
    ],
    accent: "border-l-primary",
  },
];

export function DigitalTwinSection() {
  return (
    <section className="bg-card py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          A Digital Twin of Every Patient. And Every Hospital.
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {twins.map((twin) => (
            <Card key={twin.title} className={`border-l-4 ${twin.accent}`}>
              <CardHeader>
                <CardTitle>{twin.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted">{twin.description}</p>
                <ul className="space-y-2 text-sm">
                  {twin.useCases.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-accent">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
