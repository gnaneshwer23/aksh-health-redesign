"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton } from "./shared";

export function EquityDeepDive() {
  const { data, loading, liveData, source } = useIcsData();
  const [planLogged, setPlanLogged] = useState(false);

  const generatePlan = async () => {
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          agentLabel: "EQUITY",
          label: "SHIELD: ICS equity action plan generated (rehearsal)",
          detail: `${data.equityDeepDive.length} deep-dive rows · source=${source ?? "unknown"}`,
          resourceRef: data.icsName,
          category: "reviewer_decision",
          payload: {
            flagCount: data.equityFlags,
            categories: data.equityDeepDive.map((row) => row.category)
          }
        })
      });
      setPlanLogged(true);
      toast({
        title: "Equity action plan logged",
        description: "SHIELD audit only · PDF export not wired in this build"
      });
    } catch {
      toast({
        title: "Could not persist plan",
        description: "SHIELD write failed; plan remains local rehearsal only"
      });
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
            <Button className="mt-4" variant="outline" onClick={() => void generatePlan()}>
              Generate Equity Action Plan
            </Button>
            {planLogged ? (
              <p className="mt-2 text-xs text-accent">Plan generation logged to SHIELD · no external report export</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
