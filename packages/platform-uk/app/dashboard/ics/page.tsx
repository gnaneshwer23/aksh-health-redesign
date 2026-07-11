"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { useNeo4jIcsPopulation } from "@/lib/hooks/use-neo4j-clinical";
import { metricSparklines, populationData } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

const RISK_COLORS = ["#00A86B", "#E67E22", "#E53E3E", "#7B2D8B"];

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted/20", height)} />;
}

export default function IcsDashboardPage() {
  const { icsDateRange, setIcsDateRange, icsSortColumn, icsSortAsc, setIcsSort } = useDashboardStore();
  const [equityOpen, setEquityOpen] = useState(false);
  const { data: liveData, loading } = useNeo4jIcsPopulation();
  const data = liveData ?? populationData;

  const pieData = [
    { name: "Low", value: data.riskDistribution.low },
    { name: "Medium", value: data.riskDistribution.medium },
    { name: "High", value: data.riskDistribution.high },
    { name: "Very High", value: data.riskDistribution.veryHigh },
  ];

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
    <DashboardShell role="ics" title={data.icsName}>
      <div className="overflow-y-auto p-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ConsentBanner className="flex-1" />
          <Select value={icsDateRange} onValueChange={(v) => setIcsDateRange(v as typeof icsDateRange)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Patients" value={data.totalPatients.toLocaleString()} sparkline={metricSparklines.patients} trend="up" />
          <MetricCard label="AI Actions This Month" value={data.aiActionsThisMonth.toLocaleString()} sparkline={metricSparklines.aiActions} trend="up" />
          <MetricCard label="SYNTHESIS Approval Rate" value={`${(data.synthesisApprovalRate * 100).toFixed(1)}%`} sparkline={metricSparklines.approvalRate.map((v) => v * 100)} trend="up" />
          <MetricCard label="Guardian Alerts" value={String(data.guardianAlertsGenerated)} sparkline={metricSparklines.guardianAlerts} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-sm">Patient Risk Profile Across ICS</CardTitle></CardHeader>
            <CardContent className="h-64">
              {loading && !liveData ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-sm">Condition Prevalence vs Deprivation</CardTitle></CardHeader>
            <CardContent className="h-64">
              {loading && !liveData ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.conditionPrevalenceByIMD}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quintile" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="t2d" fill="#003D7A" name="T2D" />
                    <Bar dataKey="hypertension" fill="#006B4F" name="Hypertension" />
                    <Bar dataKey="copd" fill="#38BDF8" name="COPD" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            <p className="px-6 pb-4 text-xs text-muted">T2D prevalence 3.2× higher in Q1 vs Q5</p>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-sm">ICS Admission Forecast — Digital Twin</CardTitle></CardHeader>
          <CardContent className="h-72">
            {loading && !liveData ? (
              <ChartSkeleton height="h-72" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.admissionForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#003D7A" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#FFFFFF" fillOpacity={1} />
                  <Line type="monotone" dataKey="predicted" stroke="#003D7A" strokeWidth={2} name="Digital Twin" />
                  <Line type="monotone" dataKey="historical" stroke="#718096" strokeDasharray="4 4" name="Historical" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row justify-between">
            <CardTitle className="text-sm">Practice Benchmarking</CardTitle>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Generating PDF report..." })}>Download Board Report</Button>
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
                      <TableHead key={key} className="cursor-pointer" onClick={() => setIcsSort(key)}>{label}</TableHead>
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

        <Card className="shadow-sm">
          <CardHeader>
            <button type="button" className="text-left w-full" onClick={() => setEquityOpen(!equityOpen)}>
              <CardTitle className="text-sm">EQUITY Deep-Dive {equityOpen ? "▼" : "▶"}</CardTitle>
            </button>
          </CardHeader>
          {equityOpen && (
            <CardContent>
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
              <Button className="mt-4" variant="outline" onClick={() => toast({ title: "Equity action plan generated" })}>Generate Equity Action Plan</Button>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
