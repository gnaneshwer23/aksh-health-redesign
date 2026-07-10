import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent, AgentCategory } from "@/lib/content";
import { cn } from "@/lib/utils";

const categoryLabels: Record<AgentCategory, string> = {
  patient: "Patient Agent",
  clinical: "Clinical Agent",
  operational: "Operational Agent",
};

const categoryVariants: Record<AgentCategory, "patient" | "clinical" | "operational"> = {
  patient: "patient",
  clinical: "clinical",
  operational: "operational",
};

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <Badge variant={categoryVariants[agent.category]}>
            {categoryLabels[agent.category]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">{agent.description}</p>
        <div className="space-y-1 border-t border-border pt-3 text-xs">
          <p>
            <span className="font-semibold text-foreground">FHIR Output:</span>{" "}
            {agent.fhirOutput}
          </p>
          <p>
            <span className="font-semibold text-foreground">HITL Gate:</span>{" "}
            <span
              className={cn(
                agent.hitlGate === "Yes" ? "text-secondary" : "text-warning"
              )}
            >
              {agent.hitlGate}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
