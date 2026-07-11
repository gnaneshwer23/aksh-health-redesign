"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton } from "./shared";

export function PracticeBenchmarkTable() {
  const { data, loading, liveData } = useIcsData();
  const { icsSortColumn, icsSortAsc, setIcsSort } = useDashboardStore();

  const sortedPractices = useMemo(() => {
    const list = [...data.benchmarkByPractice];
    list.sort((a, b) => {
      const av = a[icsSortColumn as keyof typeof a] as number;
      const bv = b[icsSortColumn as keyof typeof b] as number;
      return icsSortAsc ? av - bv : bv - av;
    });
    return list;
  }, [data.benchmarkByPractice, icsSortColumn, icsSortAsc]);

  const cellColor = (val: number, avg: number) => {
    if (val >= avg) return "text-accent";
    if (val >= avg * 0.8) return "text-warning";
    return "text-danger";
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row justify-between">
        <CardTitle className="text-sm">Practice Benchmarking</CardTitle>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Generating PDF report..." })}>
          Download Board Report
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !liveData ? (
          <ChartSkeleton height="h-40" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  ["name", "Practice"],
                  ["listSize", "List Size"],
                  ["aiAdoption", "AI Adoption %"],
                  ["queueClearance", "Queue Clearance"],
                  ["guardianAlerts", "GUARDIAN"],
                  ["equityFlags", "EQUITY"],
                  ["overallScore", "Score"],
                ].map(([key, label]) => (
                  <TableHead key={key} className="cursor-pointer" onClick={() => setIcsSort(key)}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPractices.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="sticky left-0 bg-card">{p.name}</TableCell>
                  <TableCell>{p.listSize.toLocaleString()}</TableCell>
                  <TableCell className={cellColor(p.aiAdoption, 85)}>{p.aiAdoption}%</TableCell>
                  <TableCell className={cellColor(p.queueClearance, 80)}>{p.queueClearance}%</TableCell>
                  <TableCell>{p.guardianAlerts}</TableCell>
                  <TableCell className={p.equityFlags > 5 ? "text-danger" : ""}>{p.equityFlags}</TableCell>
                  <TableCell className={cn("font-semibold", cellColor(p.overallScore, 80))}>{p.overallScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
