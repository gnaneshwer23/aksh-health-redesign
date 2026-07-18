"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import type { EquityDraft } from "@/lib/agents/llm-equity";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton } from "./shared";

export function EquityDeepDive() {
  const { data, loading, liveData, source } = useIcsData();
  const { status } = useSession();
  const [draft, setDraft] = useState<EquityDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [planLogged, setPlanLogged] = useState(false);

  const generatePlan = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Sign in required",
        description: "EQUITY agent drafts require an account so SHIELD can log HITL staging."
      });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/agents/equity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        toast({ title: "EQUITY unavailable", description: "Could not generate an equity action brief." });
        return;
      }
      const payload = (await response.json()) as { draft: EquityDraft };
      setDraft(payload.draft);
      setPlanLogged(true);
      toast({
        title: "EQUITY draft ready",
        description: `${payload.draft.mode}/${payload.draft.dataSource} · SHIELD logged · no EHR write`
      });
    } catch {
      toast({
        title: "Could not generate plan",
        description: "EQUITY agent request failed; try again when signed in."
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">EQUITY Deep-Dive</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !liveData ? (
          <ChartSkeleton height="h-40" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.equityDeepDive.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.flagCount}</TableCell>
                    <TableCell>{row.practice}</TableCell>
                    <TableCell>{row.recommendedAction}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-4"
              variant="outline"
              disabled={busy}
              onClick={() => void generatePlan()}
              data-testid="equity-generate-plan"
            >
              {busy ? "Generating…" : "Generate Equity Action Plan"}
            </Button>
            {planLogged ? (
              <p className="mt-2 text-xs text-accent">
                EQUITY draft staged via `/api/agents/equity` · SHIELD audit · HITL only · no EHR write
                {source ? ` · source=${source}` : ""}
              </p>
            ) : null}
            {draft ? (
              <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                <p className="font-medium text-foreground">{draft.summary}</p>
                <p className="text-muted">
                  Mode {draft.mode} · {draft.dataSource} · confidence {(draft.confidence * 100).toFixed(0)}%
                </p>
                <ul className="list-disc space-y-1 pl-4 text-muted">
                  {draft.priorities.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted">{draft.safetyNotes[0]}</p>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
