import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const problemCards = [
  {
    title: "Today",
    borderClass: "border-danger/40 bg-danger/5",
    icon: "◈◈ ◈",
    body: "Patient data lives in 6+ disconnected systems. Clinicians spend 40% of their time searching, documenting, and coordinating. Deterioration is detected late. Care is reactive.",
  },
  {
    title: "The Gap",
    borderClass: "border-warning/40 bg-warning/5",
    icon: "◇",
    body: "Healthcare has EHRs, labs, imaging, pharmacy. What is missing is an intelligence layer that connects them, reasons across them, and acts on them.",
  },
  {
    title: "Aksh Health",
    borderClass: "border-accent/40 bg-accent/5",
    icon: "◉—◉",
    body: "Seven AI agents. Real-time knowledge graph. FHIR-native. Human-approved. The intelligence layer healthcare has been waiting for.",
  },
];

export function ProblemStatement() {
  return (
    <section className="bg-card py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Healthcare Has Invested Trillions in Systems That Store Data.
          </h2>
          <p className="mt-3 text-xl text-muted">None of them understand it.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {problemCards.map((card) => (
            <Card key={card.title} className={`border-2 ${card.borderClass}`}>
              <CardHeader>
                <div className="mb-2 font-mono text-2xl text-muted">{card.icon}</div>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
